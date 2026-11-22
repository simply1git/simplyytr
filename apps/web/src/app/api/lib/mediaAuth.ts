import crypto from 'node:crypto';
import process from 'node:process';
import { timingSafeEqualStr, verifyAuth } from './auth';

/**
 * SIMPLYYTR 2.0 — Secure Media Stream Authorization Layer
 * 
 * Protects local media playback routes (/api/media/[filename]) against unauthenticated access.
 * Supports dual authorization:
 * 1. Privileged request headers (Bearer PIPELINE_SECRET, X-Pipeline-Secret, or user session cookie)
 * 2. Time-limited, file-scoped HMAC-SHA256 signed media tokens for HTML5 <video> / <img> tags.
 */

/**
 * Computes an HMAC-SHA256 signature for a specific filename and expiration timestamp.
 */
export function signMediaToken(
  filename: string,
  expiresInSec: number = 3600
): { token: string; expires: number } {
  const secret = process.env.PIPELINE_SECRET?.trim();
  if (!secret) {
    throw new Error('PIPELINE_SECRET is not configured. Cannot sign media tokens.');
  }

  const expires = Math.floor(Date.now() / 1000) + expiresInSec;
  const payload = `${filename}:${expires}`;
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return { token: hmac, expires };
}

/**
 * Appends a valid HMAC-SHA256 signature to a relative /api/media/ URL.
 * Passes external HTTP/HTTPS URLs through unchanged.
 */
export function signMediaUrl(url: string | null | undefined, expiresInSec: number = 3600): string | null {
  if (!url) return null;
  if (!url.startsWith('/api/media/')) return url;

  try {
    // Strip existing query string if any
    const [basePath] = url.split('?');
    const filename = basePath.replace('/api/media/', '').trim();
    if (!filename) return url;

    const { token, expires } = signMediaToken(filename, expiresInSec);
    return `${basePath}?token=${token}&expires=${expires}`;
  } catch (err) {
    console.warn('[MediaAuth] Failed to sign media URL:', err);
    return url;
  }
}

/**
 * Validates a signed media token for a given filename.
 */
export function verifyMediaToken(
  filename: string,
  token: string | null,
  expiresStr: string | null
): boolean {
  if (!token || !expiresStr) return false;

  const secret = process.env.PIPELINE_SECRET?.trim();
  if (!secret) return false;

  const expires = parseInt(expiresStr, 10);
  if (isNaN(expires)) return false;

  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec > expires) {
    // Token expired
    return false;
  }

  const payload = `${filename}:${expires}`;
  const expectedHmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return timingSafeEqualStr(token, expectedHmac);
}

/**
 * Gatekeeper for /api/media/[filename] requests.
 * Evaluates both header/cookie auth and signed token query parameters.
 */
export function verifyMediaRequest(
  request: Request,
  filename: string
): { authorized: boolean; reason?: string } {
  // 1. Privileged request header / cookie authentication
  if (verifyAuth(request)) {
    return { authorized: true };
  }

  // 2. Short-lived signed query token for HTML5 media players
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const expires = url.searchParams.get('expires');

    if (token && expires) {
      if (verifyMediaToken(filename, token, expires)) {
        return { authorized: true };
      }
      return { authorized: false, reason: 'INVALID_OR_EXPIRED_MEDIA_TOKEN' };
    }
  } catch {
    return { authorized: false, reason: 'MALFORMED_REQUEST_URL' };
  }

  return { authorized: false, reason: 'UNAUTHORIZED_MEDIA_ACCESS' };
}

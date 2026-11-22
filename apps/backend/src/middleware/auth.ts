import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Constant-time string equality comparison to mitigate timing attacks.
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Server-to-server and operator authentication middleware for Express routes.
 * Mirrors the canonical security standards established in apps/web/src/app/api/lib/auth.ts.
 * 
 * Rules:
 * - Requires server-side PIPELINE_SECRET environment variable.
 * - Fails closed if PIPELINE_SECRET is missing, empty, or whitespace.
 * - Validates Bearer tokens and X-Pipeline-Secret headers via constant-time comparison.
 * - Rejects unauthenticated requests with HTTP 401.
 */
export function verifyBackendAuth(req: Request, res: Response, next: NextFunction): void {
  const serverSecret = process.env.PIPELINE_SECRET?.trim();

  if (!serverSecret) {
    console.error('[Security] verifyBackendAuth: PIPELINE_SECRET is not configured on server. Failing closed.');
    res.status(401).json({ error: 'Unauthorized: Server pipeline secret is not configured', status: 401 });
    return;
  }

  // 1. Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      const token = parts[1].trim();
      if (token && timingSafeEqualStr(token, serverSecret)) {
        return next();
      }
    }
    res.status(401).json({ error: 'Unauthorized: Invalid bearer token', status: 401 });
    return;
  }

  // 2. X-Pipeline-Secret header
  const customHeader = req.headers['x-pipeline-secret'];
  if (typeof customHeader === 'string') {
    if (timingSafeEqualStr(customHeader.trim(), serverSecret)) {
      return next();
    }
    res.status(401).json({ error: 'Unauthorized: Invalid pipeline header', status: 401 });
    return;
  }

  res.status(401).json({ error: 'Unauthorized: Missing required authentication', status: 401 });
}

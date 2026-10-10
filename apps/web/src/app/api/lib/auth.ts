import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import process from 'node:process';


// ─── Cryptographic Security Helpers ──────────────────────

/**
 * Constant-time string equality comparison to mitigate timing attacks.
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Run constant-time comparison on dummy buffer to avoid timing leaks on length
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Extracts a cookie value by name from the Cookie header.
 */
export function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Supplementary CSRF & Origin defense for browser requests.
 * 
 * CRITICAL RULE: Origin and Sec-Fetch-Site headers supplement security and CSRF defense,
 * but NEVER constitute authentication by themselves.
 */
export function verifyCsrfProtection(request: Request): { valid: boolean; reason?: string } {
  const secFetchSite = request.headers.get('sec-fetch-site');
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  // 1. Explicit cross-site requests are rejected on state-changing operations
  if (secFetchSite === 'cross-site') {
    return { valid: false, reason: 'CROSS_SITE_REQUEST_FORBIDDEN' };
  }

  // 2. If Origin header is present, it must strictly match the host
  if (origin && host) {
    try {
      const parsedOrigin = new URL(origin);
      if (parsedOrigin.host !== host) {
        return { valid: false, reason: 'ORIGIN_HOST_MISMATCH' };
      }
    } catch {
      return { valid: false, reason: 'INVALID_ORIGIN_URL' };
    }
  }

  return { valid: true };
}

// ─── Flow 1: Server-to-Server Worker Authentication ────────

export interface AuthResult {
  authenticated: boolean;
  flow?: 'worker' | 'dashboard';
  reason?: string;
}

/**
 * Verifies server-to-server worker and CI/CD automation requests.
 * 
 * Rules:
 * - Requires server-side PIPELINE_SECRET environment variable.
 * - Fails closed if PIPELINE_SECRET is missing, empty, or whitespace.
 * - Compares bearer tokens using constant-time comparison.
 * - Does NOT accept browser cookies.
 * - NEVER exposed to browser code.
 */
export function verifyWorkerAuth(request: Request): AuthResult {
  const serverSecret = process.env.PIPELINE_SECRET?.trim();

  // Fail closed if server has no configured pipeline secret
  if (!serverSecret) {
    console.error('[Security] verifyWorkerAuth: PIPELINE_SECRET is not configured on server. Failing closed.');
    return { authenticated: false, reason: 'SERVER_SECRET_UNCONFIGURED' };
  }

  // 1. Authorization: Bearer <token>
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      const token = parts[1].trim();
      if (token && timingSafeEqualStr(token, serverSecret)) {
        return { authenticated: true, flow: 'worker' };
      }
    }
    return { authenticated: false, reason: 'INVALID_BEARER_TOKEN' };
  }

  // 2. Custom server-to-server header: X-Pipeline-Secret
  const customHeader = request.headers.get('x-pipeline-secret');
  if (customHeader) {
    if (timingSafeEqualStr(customHeader.trim(), serverSecret)) {
      return { authenticated: true, flow: 'worker' };
    }
    return { authenticated: false, reason: 'INVALID_PIPELINE_HEADER' };
  }

  return { authenticated: false, reason: 'MISSING_WORKER_CREDENTIALS' };
}

// ─── Flow 2: Browser / Dashboard User Session Authentication ──

/**
 * Evaluates browser dashboard user authentication.
 * 
 * Architectural Notice:
 * - Dashboard users must be authenticated via a real user session mechanism (e.g. secure HttpOnly session cookies, Auth.js, or signed session tokens).
 * - Client-side code must NEVER possess or send the server-to-server PIPELINE_SECRET.
 * - Client request headers (Origin, Sec-Fetch-Site) are strictly CSRF defenses and do NOT grant authentication.
 * - Because no secure user session store or login flow is currently implemented in this prototype,
 *   privileged dashboard requests explicitly FAIL CLOSED until real authentication is implemented.
 */
export function verifyDashboardAuth(request: Request): AuthResult {
  // Check for session cookie
  const cookieHeader = request.headers.get('cookie');
  const sessionCookie = getCookieValue(cookieHeader, '__Host-simplyytr_session') ||
                        getCookieValue(cookieHeader, 'simplyytr_session');

  if (!sessionCookie) {
    // No session cookie provided by browser
    return {
      authenticated: false,
      flow: 'dashboard',
      reason: 'NO_ACTIVE_DASHBOARD_SESSION'
    };
  }

  // A session cookie was provided, but no server-side user session store exists yet in Phase 0.
  // In accordance with security constraints: Do not invent a fake auth mechanism.
  // Fail closed until a real user session store (e.g., PostgreSQL session table / Auth.js) is implemented.
  return {
    authenticated: false,
    flow: 'dashboard',
    reason: 'DASHBOARD_SESSION_STORE_NOT_CONFIGURED'
  };
}

// ─── Combined Privileged Route Guard ──────────────────────

/**
 * Unified gatekeeper for privileged API routes.
 * Evaluates server-to-server worker credentials and browser session authentication.
 * Fails closed if neither flow is satisfied.
 */
export function verifyAuth(request: Request): boolean {
  // 1. Check Server-to-Server Worker Authentication
  const workerResult = verifyWorkerAuth(request);
  if (workerResult.authenticated) {
    return true;
  }

  // 2. Check Browser Dashboard Session Authentication
  const dashboardResult = verifyDashboardAuth(request);
  if (dashboardResult.authenticated) {
    // Enforce supplementary CSRF protection for state-changing browser requests
    const csrf = verifyCsrfProtection(request);
    if (!csrf.valid) {
      console.warn(`[Security] verifyAuth: Dashboard session rejected due to CSRF failure: ${csrf.reason}`);
      return false;
    }
    return true;
  }

  // 3. Fail closed
  return false;
}

export function unauthorized(message: string = 'Unauthorized. Privileged operation requires valid authentication.') {
  return Response.json({
    error: message,
    status: 401
  }, { status: 401 });
}

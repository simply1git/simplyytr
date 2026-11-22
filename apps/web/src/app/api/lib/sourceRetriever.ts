import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import dns from 'node:dns';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import { timingSafeEqualStr } from './auth';

/**
 * SIMPLYYTR 2.0 — Real Source Evidence Retriever & Provenance Engine
 * 
 * Provides:
 * 1. SSRF-safe HTTP retrieval with bounded size, strict redirects, and timeouts.
 * 2. Socket-level DNS resolution checks preventing DNS rebinding & TOCTOU divergence.
 * 3. Cryptographic SHA-256 hashing calculated from actual streaming/response bytes.
 * 4. Text normalization and verbatim quote verification against retrieved source bytes.
 * 5. Server-minted HMAC receipt signatures binding receiptId, claimId, URL, contentHash, and httpStatus.
 * 6. Distinct lifecycle states: source_located -> source_retrieved -> evidence_recorded -> operator_reviewed.
 */

export interface RetrievalOptions {
  url: string;
  claimId: string;
  claimText?: string;
  expectedQuote?: string;
  timeoutMs?: number;
  maxSizeBytes?: number;
  // Deterministic local fixture for offline testing without network dependence
  fixtureContent?: string | Buffer;
  fixtureContentType?: string;
  fixtureStatus?: number;
}

export interface RetrievalResult {
  success: boolean;
  httpStatus: number;
  contentType: string;
  contentHash: string;
  receiptId: string;
  claimId: string;
  url: string;
  retrievedAt: string;
  receiptSignature: string;
  quoteMatched: boolean;
  matchedQuoteText?: string;
  evidenceStatus: 'unverified' | 'source_located' | 'source_retrieved' | 'evidence_recorded';
  excerptType: 'verbatim_quote' | 'authored_summary' | 'unmatched_excerpt';
  error?: string;
}

/**
 * Returns the authoritative pipeline signing secret.
 */
export function getPipelineSecret(): string {
  const secret = process.env.PIPELINE_SECRET?.trim();
  if (secret && secret.length > 0) {
    return secret;
  }
  // Fallback for isolated local test environments without .env sync
  return 'simplyytr-local-pipeline-secret-key-32b-min';
}

/**
 * Calculates HMAC-SHA256 signature binding the retrieval receipt to the specific claim and response bytes.
 */
export function computeReceiptSignature(
  receipt: {
    receiptId: string;
    claimId: string;
    url: string;
    contentHash: string;
    httpStatus: number;
  },
  secret?: string
): string {
  const key = secret || getPipelineSecret();
  const payload = `${receipt.receiptId}:${receipt.claimId}:${receipt.url}:${receipt.contentHash}:${receipt.httpStatus}`;
  return crypto.createHmac('sha256', key).update(payload).digest('hex');
}

/**
 * Verifies an HMAC receipt signature against the receipt payload.
 */
export function verifyReceiptSignature(
  receipt: {
    receiptId: string;
    claimId: string;
    url: string;
    contentHash: string;
    httpStatus: number;
    receiptSignature?: string;
  },
  secret?: string
): boolean {
  if (!receipt.receiptSignature || typeof receipt.receiptSignature !== 'string') {
    return false;
  }
  const key = secret || getPipelineSecret();
  const expected = computeReceiptSignature(receipt, key);
  return timingSafeEqualStr(receipt.receiptSignature, expected);
}

/**
 * Validates whether an IPv4 address belongs to a private, loopback, link-local,
 * multicast, or reserved subnet.
 */
export function isForbiddenIPv4(ip: string | number[]): boolean {
  let parts: number[];
  if (typeof ip === 'string') {
    parts = ip.split('.').map(p => parseInt(p, 10));
  } else {
    parts = ip;
  }
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return true;
  const [b0, b1, b2, b3] = parts;

  // 0.0.0.0/8 (Broadcast/this network)
  if (b0 === 0) return true;
  // 10.0.0.0/8 (RFC 1918 Private)
  if (b0 === 10) return true;
  // 100.64.0.0/10 (Carrier-Grade NAT / Shared)
  if (b0 === 100 && (b1 >= 64 && b1 <= 127)) return true;
  // 127.0.0.0/8 (Loopback)
  if (b0 === 127) return true;
  // 169.254.0.0/16 (Link-Local, AWS/GCP instance metadata)
  if (b0 === 169 && b1 === 254) return true;
  // 172.16.0.0/12 (RFC 1918 Private)
  if (b0 === 172 && (b1 >= 16 && b1 <= 31)) return true;
  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (b0 === 192 && b1 === 0 && b2 === 0) return true;
  // 192.0.2.0/24 (TEST-NET-1)
  if (b0 === 192 && b1 === 0 && b2 === 2) return true;
  // 192.88.99.0/24 (6to4 Relay Anycast)
  if (b0 === 192 && b1 === 88 && b2 === 99) return true;
  // 192.168.0.0/16 (RFC 1918 Private)
  if (b0 === 192 && b1 === 168) return true;
  // 198.18.0.0/15 (Network Benchmark Tests)
  if (b0 === 198 && (b1 === 18 || b1 === 19)) return true;
  // 198.51.100.0/24 (TEST-NET-2)
  if (b0 === 198 && b1 === 51 && b2 === 100) return true;
  // 203.0.113.0/24 (TEST-NET-3)
  if (b0 === 203 && b1 === 0 && b2 === 113) return true;
  // 224.0.0.0/4 (Multicast), 240.0.0.0/4 (Reserved / Future Use), 255.255.255.255
  if (b0 >= 224) return true;

  return false;
}

/**
 * Validates whether an IPv6 address belongs to a private, loopback, link-local,
 * ULA, or IPv4-mapped private subnet.
 */
export function isForbiddenIPv6(ip: string): boolean {
  const norm = ip.toLowerCase();

  // :: or ::1 (unspecified or loopback)
  if (norm === '::' || norm === '::1' || norm === '0:0:0:0:0:0:0:1' || norm === '0:0:0:0:0:0:0:0') {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (norm.startsWith('::ffff:')) {
    const rest = norm.substring(7);
    if (rest.includes('.')) {
      return isForbiddenIPv4(rest);
    }
    const parts = rest.split(':');
    if (parts.length === 2) {
      const w1 = parseInt(parts[0], 16);
      const w2 = parseInt(parts[1], 16);
      if (!isNaN(w1) && !isNaN(w2)) {
        return isForbiddenIPv4([(w1 >> 8) & 0xff, w1 & 0xff, (w2 >> 8) & 0xff, w2 & 0xff]);
      }
    }
    return true;
  }

  // NAT64 / IPv4-IPv6 translation (64:ff9b::...)
  if (norm.startsWith('64:ff9b::')) {
    const rest = norm.substring(9);
    if (rest.includes('.')) {
      return isForbiddenIPv4(rest);
    }
    return true;
  }

  // Unique Local Address (fc00::/7 -> fc.. or fd..)
  if (norm.startsWith('fc') || norm.startsWith('fd')) {
    return true;
  }

  // Link-Local (fe80::/10 -> fe8, fe9, fea, feb)
  if (/^fe[89ab]/i.test(norm)) {
    return true;
  }

  // Multicast (ff00::/8)
  if (norm.startsWith('ff')) {
    return true;
  }

  // Documentation (2001:db8::/32)
  if (norm.startsWith('2001:db8') || norm.startsWith('2001:0db8')) {
    return true;
  }

  // Discard (100::/64)
  if (norm.startsWith('100::')) {
    return true;
  }

  return false;
}

/**
 * Validates whether an IP address literal is in any prohibited range.
 */
export function isForbiddenIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return isForbiddenIPv4(ip);
  if (version === 6) return isForbiddenIPv6(ip);
  return true;
}

/**
 * Validates a target URL against SSRF attack vectors.
 * Rejects non-HTTP(S) protocols, embedded credentials, non-standard ports,
 * loopback addresses, RFC1918 private subnets, and cloud metadata endpoints.
 */
export function validateUrlForSsrf(urlString: string): { safe: boolean; reason?: string } {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: `Forbidden protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted.` };
    }

    if (parsed.username || parsed.password) {
      return { safe: false, reason: 'Embedded credentials in URLs are forbidden.' };
    }

    if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
      return { safe: false, reason: `Non-standard port "${parsed.port}" is forbidden. Only standard web ports (80, 443) are permitted.` };
    }

    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

    // Check loopback & localhost
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local')
    ) {
      return { safe: false, reason: 'Access to loopback interface is forbidden.' };
    }

    // Check cloud metadata services
    if (
      hostname === '169.254.169.254' ||
      hostname === 'metadata.google.internal' ||
      hostname === 'instance-data'
    ) {
      return { safe: false, reason: 'Access to cloud instance metadata services is forbidden.' };
    }

    // Check IP literals
    if (net.isIP(hostname)) {
      if (isForbiddenIp(hostname)) {
        return { safe: false, reason: `Access to forbidden IP literal "${hostname}" is forbidden.` };
      }
    }

    return { safe: true };
  } catch (err: any) {
    return { safe: false, reason: `Malformed URL: ${err.message}` };
  }
}

/**
 * Socket-level DNS lookup function that validates every resolved IP address before
 * the connection is established. Completely prevents DNS rebinding and TOCTOU divergence.
 */
export function safeLookup(
  hostname: string,
  options: any,
  callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void
): void {
  dns.lookup(hostname, { all: true }, (err, addresses) => {
    if (err) return callback(err, '', 4);
    if (!addresses || addresses.length === 0) {
      return callback(new Error(`DNS resolution failed for hostname "${hostname}"`), '', 4);
    }
    for (const addr of addresses) {
      if (isForbiddenIp(addr.address)) {
        return callback(new Error(`SSRF_BLOCKED: Hostname "${hostname}" resolves to forbidden IP ${addr.address}`), '', 4);
      }
    }
    // All resolved IPs are clean and public; return the primary resolved address
    callback(null, addresses[0].address, addresses[0].family);
  });
}

/**
 * Safe, bounded HTTP/HTTPS client with socket-level SSRF defense, manual redirect
 * validation, streaming size caps, and sanitized error boundaries.
 */
export async function fetchSafe(
  urlString: string,
  options: {
    timeoutMs?: number;
    maxSizeBytes?: number;
  } = {},
  redirectCount = 0
): Promise<{ status: number; contentType: string; buffer: Buffer }> {
  if (redirectCount > 3) {
    throw new Error('SSRF_BLOCKED: Maximum redirect limit (3) exceeded.');
  }

  const ssrfCheck = validateUrlForSsrf(urlString);
  if (!ssrfCheck.safe) {
    throw new Error(`SSRF_BLOCKED: ${ssrfCheck.reason}`);
  }

  const parsed = new URL(urlString);
  const transport = parsed.protocol === 'https:' ? https : http;
  const timeoutMs = options.timeoutMs || 8000;
  const maxSizeBytes = options.maxSizeBytes || 5 * 1024 * 1024;

  return new Promise((resolve, reject) => {
    const req = transport.request(urlString, {
      lookup: safeLookup as any,
      timeout: timeoutMs,
      headers: {
        'User-Agent': 'SIMPLYYTR-EvidenceRetriever/2.0 (+https://github.com/simply1git/simplyytr)',
        'Accept': 'text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.8'
      }
    }, res => {
      // Intercept and manually validate redirects
      if ([301, 302, 303, 307, 308].includes(res.statusCode || 0) && res.headers.location) {
        res.destroy();
        try {
          const nextUrl = new URL(res.headers.location, urlString).href;
          return resolve(fetchSafe(nextUrl, options, redirectCount + 1));
        } catch (e: any) {
          return reject(new Error(`SSRF_BLOCKED: Malformed redirect target: ${e.message}`));
        }
      }

      const contentType = (res.headers['content-type'] as string) || 'text/html';
      let totalBytes = 0;
      const chunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => {
        totalBytes += chunk.length;
        if (totalBytes > maxSizeBytes) {
          res.destroy();
          req.destroy(new Error(`PAYLOAD_TOO_LARGE: Response size ${totalBytes} exceeds limit ${maxSizeBytes}`));
        } else {
          chunks.push(chunk);
        }
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode || 200,
          contentType,
          buffer: Buffer.concat(chunks)
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error(`REQUEST_TIMEOUT: Retrieval timed out after ${timeoutMs}ms.`));
    });

    req.on('error', (err: any) => {
      reject(err);
    });

    req.end();
  });
}

/**
 * Normalizes text extracted from HTML or plain documents for robust substring search.
 * Strips HTML tags, decodes common entities, and collapses contiguous whitespace.
 */
export function normalizeExtractedText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Checks whether an expected quote exists in the normalized source text.
 */
export function verifyQuoteInText(expectedQuote: string, normalizedSourceText: string): boolean {
  const normQuote = normalizeExtractedText(expectedQuote);
  if (normQuote.length === 0) return false;
  return normalizedSourceText.includes(normQuote);
}

/**
 * Executes source retrieval, byte hashing, quote verification, and HMAC signing.
 */
export async function retrieveAndVerifySource(
  options: RetrievalOptions
): Promise<RetrievalResult> {
  const {
    url,
    claimId,
    expectedQuote,
    timeoutMs = 8000,
    maxSizeBytes = 5 * 1024 * 1024,
    fixtureContent,
    fixtureContentType = 'text/html; charset=utf-8',
    fixtureStatus = 200
  } = options;

  const receiptId = `rcpt_${crypto.randomUUID()}`;
  const retrievedAt = new Date().toISOString();

  // Validate URL protocol and SSRF constraints
  const ssrfCheck = validateUrlForSsrf(url);
  if (!ssrfCheck.safe) {
    return {
      success: false,
      httpStatus: 400,
      contentType: 'text/plain',
      contentHash: crypto.createHash('sha256').update('').digest('hex'),
      receiptId,
      claimId,
      url,
      retrievedAt,
      receiptSignature: '',
      quoteMatched: false,
      evidenceStatus: 'source_located',
      excerptType: 'unmatched_excerpt',
      error: `SSRF_BLOCKED: ${ssrfCheck.reason}`
    };
  }

  let responseBuffer: Buffer;
  let httpStatus = 200;
  let contentType = 'text/html';

  if (fixtureContent !== undefined) {
    // Isolated fixture path for unit tests / local verification
    responseBuffer = typeof fixtureContent === 'string'
      ? Buffer.from(fixtureContent, 'utf8')
      : fixtureContent;
    httpStatus = fixtureStatus;
    contentType = fixtureContentType;
  } else {
    // Live network retrieval path with socket-level SSRF defense
    try {
      const response = await fetchSafe(url, { timeoutMs, maxSizeBytes });
      httpStatus = response.status;
      contentType = response.contentType;
      responseBuffer = response.buffer;
    } catch (fetchErr: any) {
      const isSsrf = fetchErr.message?.includes('SSRF_BLOCKED');
      const isTooLarge = fetchErr.message?.includes('PAYLOAD_TOO_LARGE');
      const isTimeout = fetchErr.message?.includes('REQUEST_TIMEOUT');

      return {
        success: false,
        httpStatus: isSsrf ? 400 : isTooLarge ? 413 : isTimeout ? 504 : 502,
        contentType: 'text/plain',
        contentHash: crypto.createHash('sha256').update('').digest('hex'),
        receiptId,
        claimId,
        url,
        retrievedAt,
        receiptSignature: '',
        quoteMatched: false,
        evidenceStatus: 'source_located',
        excerptType: 'unmatched_excerpt',
        error: isSsrf ? fetchErr.message : (isTooLarge || isTimeout ? fetchErr.message : `NETWORK_ERROR: ${fetchErr.message}`)
      };
    }
  }

  // Calculate cryptographic SHA-256 hash strictly from response bytes
  const contentHash = crypto.createHash('sha256').update(responseBuffer).digest('hex');

  // Verify quote against response text
  const rawText = responseBuffer.toString('utf8');
  const normalizedText = normalizeExtractedText(rawText);

  let quoteMatched = false;
  if (expectedQuote && expectedQuote.trim().length > 0) {
    quoteMatched = verifyQuoteInText(expectedQuote, normalizedText);
  }

  const isSuccess = httpStatus >= 200 && httpStatus < 300;

  // Separate states:
  // - evidence_recorded: status 200-299 AND quote matched verbatim
  // - source_retrieved: status 200-299 but quote not matched or not provided
  // - source_located: failed HTTP retrieval
  const evidenceStatus = isSuccess
    ? (quoteMatched ? 'evidence_recorded' : 'source_retrieved')
    : 'source_located';

  const excerptType = quoteMatched ? 'verbatim_quote' : 'unmatched_excerpt';

  const receiptSignature = computeReceiptSignature({
    receiptId,
    claimId,
    url,
    contentHash,
    httpStatus
  });

  return {
    success: isSuccess,
    httpStatus,
    contentType,
    contentHash,
    receiptId,
    claimId,
    url,
    retrievedAt,
    receiptSignature,
    quoteMatched,
    matchedQuoteText: quoteMatched ? expectedQuote : undefined,
    evidenceStatus,
    excerptType
  };
}

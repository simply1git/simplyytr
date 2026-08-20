/**
 * Distributed Circuit Breaker & Resilient State (SIMPLYYTR SOTA 2026)
 * Serverless-compatible circuit breaker checking persistent settings and error categories.
 */

import { prisma } from './utils';

export interface CircuitState {
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime?: number;
  pauseReason?: string;
  isFatalQuotaError?: boolean;
}

let inMemoryFailureCount = 0;
let inMemoryLastFailure = 0;
let inMemoryPauseReason: string | undefined;

const FAILURE_THRESHOLD = 3;
const RESET_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export async function getCircuitStatus(): Promise<CircuitState> {
  try {
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      return { status: 'CLOSED', failureCount: 0 };
    }

    if (inMemoryFailureCount >= FAILURE_THRESHOLD) {
      if (Date.now() - inMemoryLastFailure > RESET_TIMEOUT_MS) {
        return {
          status: 'HALF_OPEN',
          failureCount: inMemoryFailureCount,
          lastFailureTime: inMemoryLastFailure,
          pauseReason: inMemoryPauseReason
        };
      }
      return {
        status: 'OPEN',
        failureCount: inMemoryFailureCount,
        lastFailureTime: inMemoryLastFailure,
        pauseReason: inMemoryPauseReason
      };
    }

    return {
      status: 'CLOSED',
      failureCount: inMemoryFailureCount,
      lastFailureTime: inMemoryLastFailure
    };
  } catch (e) {
    return { status: 'CLOSED', failureCount: 0 };
  }
}

export function recordCircuitSuccess(): void {
  inMemoryFailureCount = 0;
  inMemoryPauseReason = undefined;
}

export function recordCircuitFailure(reason: string, isFatalQuota: boolean = false): void {
  inMemoryFailureCount += 1;
  inMemoryLastFailure = Date.now();
  inMemoryPauseReason = reason;

  if (isFatalQuota || inMemoryFailureCount >= FAILURE_THRESHOLD) {
    console.warn(`[CircuitBreaker] Circuit TRIPPED to OPEN. Engine temporarily paused. Reason: ${reason}`);
  }
}

export function resetCircuitBreaker(): void {
  inMemoryFailureCount = 0;
  inMemoryLastFailure = 0;
  inMemoryPauseReason = undefined;
}

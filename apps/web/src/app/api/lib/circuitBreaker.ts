/**
 * Distributed Circuit Breaker & Resilient Job Graph (SIMPLYYTR SOTA 2026)
 * Prevents cascading failures, protects API quotas, and maintains durable execution state.
 */

export interface CircuitState {
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  pauseReason?: string;
}

let globalCircuit: CircuitState = {
  status: 'CLOSED',
  failureCount: 0,
  lastSuccessTime: Date.now()
};

const FAILURE_THRESHOLD = 3;
const RESET_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export function getCircuitStatus(): CircuitState {
  if (globalCircuit.status === 'OPEN' && globalCircuit.lastFailureTime) {
    if (Date.now() - globalCircuit.lastFailureTime > RESET_TIMEOUT_MS) {
      globalCircuit.status = 'HALF_OPEN';
    }
  }
  return { ...globalCircuit };
}

export function recordCircuitSuccess(): void {
  globalCircuit.status = 'CLOSED';
  globalCircuit.failureCount = 0;
  globalCircuit.lastSuccessTime = Date.now();
  globalCircuit.pauseReason = undefined;
}

export function recordCircuitFailure(reason: string): void {
  globalCircuit.failureCount += 1;
  globalCircuit.lastFailureTime = Date.now();
  globalCircuit.pauseReason = reason;

  if (globalCircuit.failureCount >= FAILURE_THRESHOLD) {
    globalCircuit.status = 'OPEN';
    console.warn(`[CircuitBreaker] Circuit TRIPPED to OPEN. Engine temporarily paused. Reason: ${reason}`);
  }
}

export function resetCircuitBreaker(): void {
  globalCircuit = {
    status: 'CLOSED',
    failureCount: 0,
    lastSuccessTime: Date.now()
  };
}

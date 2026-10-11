const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export type FailureType =
  | "LATENCY"
  | "SERVICE_FAILURE"
  | "ERROR_INJECTION";

export interface ServiceNode {
  id: string;
  name: string;
  type: string;
  status: string;
  endpoint: string;
  baseLatencyMs: number;
  currentLatencyMs: number;
  errorRate: number;
}

export interface Experiment {
  id: string;
  targetServiceId: string;
  failureType: FailureType;
  intensity: number;
  durationSeconds: number;
  completedAt: string | null;
  startedAt: string;
  message: string;
  status: "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
}

export type CircuitBreakerState =
  | "CLOSED"
  | "OPEN"
  | "HALF_OPEN";

export interface CircuitBreaker {
  serviceId: string;
  state: CircuitBreakerState;
  failureThreshold: number;
  consecutiveFailures: number;
  openDurationMillis: number;
  openedAt: string | null;
  totalRequests: number;
  blockedRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

export interface SimulatedRequestResult {
  serviceId: string;
  allowed: boolean;
  state: CircuitBreakerState;
  message: string;
}
export interface FailureAnalysis {
  experimentId: string;
  serviceId: string;
  serviceName: string;
  failureType: string;
  experimentStatus: string;
  summary: string;
  rootCause: string;
  impact: string;
  severity: string;
  findings: string[];
  recommendations: string[];
}
async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      message || `Backend request failed: HTTP ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export const chaosApi = {
  getServices(): Promise<ServiceNode[]> {
    return request<ServiceNode[]>("/api/services");
  },

  getExperiments(): Promise<Experiment[]> {
  return request<Experiment[]>("/api/experiments");
},

  getExperiment(id: string): Promise<Experiment> {
    return request<Experiment>(
      `/api/experiments/${encodeURIComponent(id)}`,
    );
  },

  startExperiment(configuration: {
    targetServiceId: string;
    failureType: FailureType;
    intensity: number;
    durationSeconds: number;
  }): Promise<Experiment> {
    return request<Experiment>("/api/experiments", {
      method: "POST",
      body: JSON.stringify(configuration),
    });
  },

  cancelExperiment(id: string): Promise<Experiment> {
    return request<Experiment>(
      `/api/experiments/${encodeURIComponent(id)}/cancel`,
      {
        method: "POST",
      },
    );
  },

  getCircuitBreakers(): Promise<CircuitBreaker[]> {
    return request<CircuitBreaker[]>("/api/circuit-breakers");
  },

  getCircuitBreaker(
    serviceId: string,
  ): Promise<CircuitBreaker> {
    return request<CircuitBreaker>(
      `/api/circuit-breakers/${encodeURIComponent(serviceId)}`,
    );
  },

  simulateRequest(
    serviceId: string,
  ): Promise<SimulatedRequestResult> {
    return request<SimulatedRequestResult>(
      `/api/circuit-breakers/${encodeURIComponent(serviceId)}/request`,
      {
        method: "POST",
      },
    );
  },

  resetCircuitBreakers(): Promise<{
    status: string;
    message: string;
  }> {
    return request<{
      status: string;
      message: string;
    }>("/api/circuit-breakers/reset", {
      method: "POST",
    });
  },
    getFailureAnalysis(
    experimentId: string,
  ): Promise<FailureAnalysis> {
    return request<FailureAnalysis>(
      `/api/analysis/${encodeURIComponent(experimentId)}`,
    );
  },
};
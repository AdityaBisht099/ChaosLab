"use client";

import { useCallback, useEffect, useState } from "react";
import {
  chaosApi,
  type CircuitBreaker,
  type CircuitBreakerState,
  type ServiceNode,
} from "@/lib/chaos-api";

const STATE_STYLES: Record<
  CircuitBreakerState,
  { color: string; background: string; description: string }
> = {
  CLOSED: {
    color: "text-emerald-400",
    background: "border-emerald-500/30 bg-emerald-500/10",
    description: "Requests are allowed",
  },
  OPEN: {
    color: "text-red-400",
    background: "border-red-500/30 bg-red-500/10",
    description: "Requests are blocked",
  },
  HALF_OPEN: {
    color: "text-amber-400",
    background: "border-amber-500/30 bg-amber-500/10",
    description: "Testing service recovery",
  },
};

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-100">
        {value}
      </p>
    </div>
  );
}

export default function CircuitBreakerPanel() {
  const [breakers, setBreakers] = useState<CircuitBreaker[]>([]);
  const [services, setServices] = useState<ServiceNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyService, setBusyService] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [breakerData, serviceData] = await Promise.all([
        chaosApi.getCircuitBreakers(),
        chaosApi.getServices(),
      ]);

      setBreakers(breakerData);
      setServices(serviceData);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load circuit breakers.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const interval = window.setInterval(() => {
      void refresh();
    }, 2000);

    return () => window.clearInterval(interval);
  }, [refresh]);

  async function handleSimulateRequest(serviceId: string) {
    setBusyService(serviceId);
    setNotice(null);
    setError(null);

    try {
      const result = await chaosApi.simulateRequest(serviceId);

      setNotice(
        `${serviceId}: ${result.message} Current state: ${result.state}.`,
      );

      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not simulate the request.",
      );
    } finally {
      setBusyService(null);
    }
  }

  async function handleReset() {
    const confirmed = window.confirm(
      "Reset all circuit breakers and their request counters?",
    );

    if (!confirmed) return;

    setResetting(true);
    setNotice(null);
    setError(null);

    try {
      const result = await chaosApi.resetCircuitBreakers();

      setNotice(result.message);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not reset circuit breakers.",
      );
    } finally {
      setResetting(false);
    }
  }

  const totalRequests = breakers.reduce(
    (sum, breaker) => sum + breaker.totalRequests,
    0,
  );

  const totalBlocked = breakers.reduce(
    (sum, breaker) => sum + breaker.blockedRequests,
    0,
  );

  const openBreakers = breakers.filter(
    (breaker) => breaker.state === "OPEN",
  ).length;

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[#11100f] p-6">
        <p className="text-sm text-zinc-400">
          Loading circuit breakers...
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-2xl border border-white/10 bg-[#11100f] p-5 text-zinc-100 sm:p-7">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
              Resilience Engineering
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            Circuit Breakers
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
            Simulate requests, observe failure thresholds, and
            inspect how each service responds to failures.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={resetting || busyService !== null}
          className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-orange-400/50 hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resetting ? "Resetting..." : "Reset Breakers"}
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-200"
        >
          {notice}
        </div>
      )}

      {/* Summary metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="Services monitored" value={breakers.length} />
        <Metric label="Requests admitted" value={totalRequests} />
        <Metric label="Requests blocked" value={totalBlocked} />
      </div>

      {openBreakers > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="font-semibold text-red-300">
            {openBreakers} circuit breaker
            {openBreakers === 1 ? "" : "s"} currently OPEN
          </p>
          <p className="mt-1 text-sm text-red-200/70">
            Requests to these services may be rejected by the
            circuit-breaker simulation.
          </p>
        </div>
      )}

      {/* Individual circuit breakers */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {breakers.map((breaker) => {
          const style = STATE_STYLES[breaker.state];

          const service = services.find(
            (item) => item.id === breaker.serviceId,
          );

          return (
            <article
              key={breaker.serviceId}
              className="rounded-2xl border border-white/10 bg-black/20 p-5"
            >
              {/* Service name and state */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    {service?.name ?? breaker.serviceId}
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    ID: {breaker.serviceId}
                  </p>
                </div>

                <span
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold tracking-wide ${style.background} ${style.color}`}
                >
                  {breaker.state.replace("_", " ")}
                </span>
              </div>

              <p className={`mt-3 text-sm ${style.color}`}>
                {style.description}
              </p>

              {/* Service status */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5">
                <span className="text-sm text-zinc-400">
                  Service health
                </span>

                <span
                  className={
                    service?.status === "HEALTHY"
                      ? "text-sm font-medium text-emerald-400"
                      : "text-sm font-medium text-red-400"
                  }
                >
                  {service?.status ?? "UNKNOWN"}
                </span>
              </div>

              {/* Request metrics */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric
                  label="Successful"
                  value={breaker.successfulRequests}
                />

                <Metric
                  label="Failed"
                  value={breaker.failedRequests}
                />

                <Metric
                  label="Blocked"
                  value={breaker.blockedRequests}
                />

                <Metric
                  label="Consecutive failures"
                  value={breaker.consecutiveFailures}
                />
              </div>

              {/* Breaker configuration */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">
                    Failure threshold
                  </span>

                  <span className="text-zinc-300">
                    {breaker.failureThreshold} failures
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">
                    Recovery cooldown
                  </span>

                  <span className="text-zinc-300">
                    {(breaker.openDurationMillis / 1000).toFixed(1)}s
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">
                    Total admitted requests
                  </span>

                  <span className="text-zinc-300">
                    {breaker.totalRequests}
                  </span>
                </div>
              </div>

              {/* Request simulation */}
              <button
                type="button"
                onClick={() =>
                  void handleSimulateRequest(breaker.serviceId)
                }
                disabled={
                  busyService !== null ||
                  resetting
                }
                className="mt-5 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyService === breaker.serviceId
                  ? "Simulating Request..."
                  : "Simulate Request"}
              </button>
            </article>
          );
        })}
      </div>

      {breakers.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 p-8 text-center">
          <p className="text-zinc-400">
            No circuit breakers are registered.
          </p>
        </div>
      )}

      {/* Explanation */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h3 className="font-semibold text-zinc-200">
          Understanding the states
        </h3>

        <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
          <div>
            <p className="font-semibold text-emerald-400">CLOSED</p>
            <p className="mt-1 leading-5 text-zinc-500">
              Requests are admitted and failures are counted.
            </p>
          </div>

          <div>
            <p className="font-semibold text-red-400">OPEN</p>
            <p className="mt-1 leading-5 text-zinc-500">
              Requests are blocked until the cooldown expires.
            </p>
          </div>

          <div>
            <p className="font-semibold text-amber-400">HALF OPEN</p>
            <p className="mt-1 leading-5 text-zinc-500">
              A trial request checks whether the service has recovered.
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-zinc-600">
          Requests are simulated through the ChaosLab backend;
          this component does not intercept real service traffic.
        </p>
      </div>
    </section>
  );
}
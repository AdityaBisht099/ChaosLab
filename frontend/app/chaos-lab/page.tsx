"use client";

import CircuitBreakerPanel from "@/components/CircuitBreakerPanel";
import FailureAnalysisPanel from "@/components/FailureAnalysisPanel";
import ServiceTopology from "@/components/ServiceTopology";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  chaosApi,
  type Experiment,
  type FailureType,
  type ServiceNode,
} from "@/lib/chaos-api";

function getServiceName(
  id: string,
  services: ServiceNode[],
): string {
  const service = services.find((item) => item.id === id);

  if (service) {
    return service.name;
  }

  const fallbackNames: Record<string, string> = {
    gateway: "API Gateway",
    payments: "Payment Service",
    database: "Primary Database",
  };

  return fallbackNames[id] ?? id;
}

function getFailureLabel(type: FailureType): string {
  switch (type) {
    case "LATENCY":
      return "Latency injection";
    case "SERVICE_FAILURE":
      return "Service failure";
    case "ERROR_INJECTION":
      return "Error injection";
    default:
      return "Unknown failure";
  }
}

function getFailureDescription(type: FailureType): string {
  switch (type) {
    case "LATENCY":
      return "Simulate increased response times and observe the impact on dependent services.";
    case "SERVICE_FAILURE":
      return "Simulate a service becoming unavailable and observe the resulting disruption.";
    case "ERROR_INJECTION":
      return "Simulate failed requests and observe how the system handles errors.";
    default:
      return "Configure a controlled failure to observe its impact.";
  }
}

function formatError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

export default function ChaosLabPage() {
  const [services, setServices] = useState<ServiceNode[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);

  const [service, setService] = useState("payments");
  const [failureType, setFailureType] =
    useState<FailureType>("LATENCY");
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState(50);

  const [experiment, setExperiment] =
    useState<Experiment | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  // null until the client-side clock is initialized.
  const [now, setNow] = useState<number | null>(null);

  const isRunning = experiment?.status === "RUNNING";

  // Refresh service health and metrics.
  const refreshServices = useCallback(async () => {
    const data = await chaosApi.getServices();
    setServices(data);
  }, []);

  // Refresh experiment history.
  const refreshExperiments = useCallback(async () => {
    const data = await chaosApi.getExperiments();
    setExperiments(data);
  }, []);

  // Initialize and update the clock after mounting.
  useEffect(() => {
    setNow(Date.now());

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  // Load services when the page opens.
  useEffect(() => {
    let active = true;

    async function loadServices() {
      try {
        const data = await chaosApi.getServices();

        if (active) {
          setServices(data);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            `Could not connect to the backend. ${formatError(err)}`,
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadServices();

    return () => {
      active = false;
    };
  }, []);

  // Keep service health and metrics synchronized.
  useEffect(() => {
    let active = true;
    let polling = false;

    async function pollServices() {
      if (polling) return;

      polling = true;

      try {
        const data = await chaosApi.getServices();

        if (active) {
          setServices(data);
        }
      } catch (err) {
        if (active) {
          console.error(
            "Could not refresh service metrics:",
            err,
          );
        }
      } finally {
        polling = false;
      }
    }

    void pollServices();

    const interval = window.setInterval(() => {
      void pollServices();
    }, 2000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  // Load experiment history and refresh every three seconds.
  useEffect(() => {
    let active = true;
    let polling = false;

    async function pollExperiments() {
      if (polling) return;

      polling = true;

      try {
        const data = await chaosApi.getExperiments();

        if (active) {
          setExperiments(data);
        }
      } catch (err) {
        if (active) {
          console.error(
            "Could not refresh experiment history:",
            err,
          );
        }
      } finally {
        polling = false;
      }
    }

    void pollExperiments();

    const interval = window.setInterval(() => {
      void pollExperiments();
    }, 3000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  // Poll the active experiment and its service metrics.
  useEffect(() => {
    if (!experiment || experiment.status !== "RUNNING") {
      return;
    }

    let active = true;
    let polling = false;

    async function pollExperiment() {
      if (polling) return;

      polling = true;

      try {
        const [updatedExperiment, updatedServices] =
          await Promise.all([
            chaosApi.getExperiment(experiment!.id),
            chaosApi.getServices(),
          ]);

        if (active) {
          setExperiment(updatedExperiment);
          setServices(updatedServices);
          setError("");

          if (updatedExperiment.status !== "RUNNING") {
            void refreshExperiments().catch((err) => {
              console.error(
                "Could not refresh experiment history:",
                err,
              );
            });
          }
        }
      } catch (err) {
        if (active) {
          setError(
            `Could not refresh experiment status. ${formatError(err)}`,
          );
        }
      } finally {
        polling = false;
      }
    }

    void pollExperiment();

    const interval = window.setInterval(() => {
      void pollExperiment();
    }, 1000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [
    experiment?.id,
    experiment?.status,
    refreshExperiments,
  ]);

  // Start a new chaos experiment.
  async function startExperiment() {
    setSubmitting(true);
    setError("");

    try {
      const result = await chaosApi.startExperiment({
        targetServiceId: service,
        failureType,
        intensity,
        durationSeconds: duration,
      });

      setExperiment(result);

      await Promise.all([
        refreshServices(),
        refreshExperiments(),
      ]);
    } catch (err) {
      setError(
        `Could not start experiment. ${formatError(err)}`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Cancel the currently running experiment.
  async function cancelExperiment() {
    if (!experiment || !isRunning) return;

    setCancelling(true);
    setError("");

    try {
      const result = await chaosApi.cancelExperiment(
        experiment.id,
      );

      setExperiment(result);

      await Promise.all([
        refreshServices(),
        refreshExperiments(),
      ]);
    } catch (err) {
      setError(
        `Could not cancel experiment. ${formatError(err)}`,
      );
    } finally {
      setCancelling(false);
    }
  }

  // Calculate elapsed time only after now has a numeric value.
  const elapsedSeconds = (() => {
  if (!experiment || now === null) {
    return 0;
  }

  const startedAt = new Date(experiment.startedAt).getTime();

  return Math.max(
    0,
    Math.floor((now - startedAt) / 1000),
  );
})();

  const remainingSeconds = experiment
    ? Math.max(
        0,
        experiment.durationSeconds - elapsedSeconds,
      )
    : 0;

  const selectedService = services.find(
    (item) =>
      item.id === (experiment?.targetServiceId ?? service),
  );

  const displayedFailureType =
    experiment?.failureType ?? failureType;

  const displayedServiceId =
    experiment?.targetServiceId ?? service;

  const displayedIntensity =
    experiment?.intensity ?? intensity;

  const displayedDuration =
    experiment?.durationSeconds ?? duration;

  const experimentStatusLabel = isRunning
    ? "Experiment in progress"
    : experiment?.status === "COMPLETED"
      ? "Experiment completed"
      : experiment?.status === "CANCELLED"
        ? "Experiment cancelled"
        : experiment?.status === "FAILED"
          ? "Experiment failed"
          : loading
            ? "Connecting to backend"
            : "Ready to configure";

  return (
    <main className="chaos-workspace">
      <header className="chaos-header">
        <Link href="/" className="chaos-back">
          ← Back to Overview
        </Link>

        <span className="chaos-demo-badge">
          <span />
          SIMULATION MODE
        </span>
      </header>

      <section className="chaos-intro">
        <div className="eyebrow">
          <span className="eyebrow-line" />
          CONTROLLED FAILURE ENVIRONMENT
        </div>

        <h1>
          Chaos <span>Lab.</span>
        </h1>

        <p>
          Introduce controlled failures. Understand the impact.
          Build systems that recover.
        </p>
      </section>

      {error && (
        <div className="experiment-notice" role="alert">
          <span className="notice-icon">!</span>
          <p>{error}</p>
        </div>
      )}

      {/* Experiment configuration and preview */}
      <section className="experiment-layout">
        <div className="experiment-form panel">
          <div className="panel-heading">
            <div>
              <h2>Configure experiment</h2>
              <p>
                Define the conditions for your next experiment.
              </p>
            </div>

            <span className="sample-label">
              CONFIGURATION
            </span>
          </div>

          <div className="form-field">
            <label htmlFor="target-service">
              Target service
            </label>

            <select
              id="target-service"
              value={service}
              disabled={loading || submitting || !!isRunning}
              onChange={(event) =>
                setService(event.target.value)
              }
            >
              {services.length > 0 ? (
                services.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="gateway">API Gateway</option>
                  <option value="payments">Payment Service</option>
                  <option value="database">Primary Database</option>
                </>
              )}
            </select>

            <span className="field-hint">
              Choose the service that will experience the fault.
            </span>
          </div>

          <div className="form-field">
            <label htmlFor="failure-type">
              Failure scenario
            </label>

            <select
              id="failure-type"
              value={failureType}
              disabled={loading || submitting || !!isRunning}
              onChange={(event) =>
                setFailureType(
                  event.target.value as FailureType,
                )
              }
            >
              <option value="LATENCY">Latency injection</option>
              <option value="SERVICE_FAILURE">Service failure</option>
              <option value="ERROR_INJECTION">Error injection</option>
            </select>

            <span className="field-hint">
              Select the type of failure to simulate.
            </span>
          </div>

          <div className="form-field">
            <div className="field-label-row">
              <label htmlFor="intensity">
                Failure intensity
              </label>

              <span className="range-value">
                {intensity}%
              </span>
            </div>

            <input
              id="intensity"
              type="range"
              min="10"
              max="100"
              step="10"
              value={intensity}
              disabled={loading || submitting || !!isRunning}
              onChange={(event) =>
                setIntensity(Number(event.target.value))
              }
            />

            <div className="range-labels">
              <span>Low impact</span>
              <span>High impact</span>
            </div>
          </div>

          <div className="form-field">
            <div className="field-label-row">
              <label htmlFor="duration">
                Experiment duration
              </label>

              <span className="range-value">
                {duration}s
              </span>
            </div>

            <input
              id="duration"
              type="range"
              min="10"
              max="120"
              step="10"
              value={duration}
              disabled={loading || submitting || !!isRunning}
              onChange={(event) =>
                setDuration(Number(event.target.value))
              }
            />

            <div className="range-labels">
              <span>10 seconds</span>
              <span>120 seconds</span>
            </div>
          </div>

          <div className="experiment-notice">
            <span className="notice-icon">ⓘ</span>

            <p>
              Experiments change simulated service state only.
              No real infrastructure is affected.
            </p>
          </div>

          <button
            type="button"
            className="primary-button experiment-submit"
            disabled={loading || submitting || !!isRunning}
            onClick={startExperiment}
          >
            {loading
              ? "Connecting..."
              : submitting
                ? "Starting experiment..."
                : isRunning
                  ? "Experiment running..."
                  : "Start experiment"}

            <span>→</span>
          </button>

          {isRunning && (
            <button
              type="button"
              className="primary-button experiment-submit"
              disabled={cancelling}
              onClick={cancelExperiment}
            >
              {cancelling
                ? "Cancelling..."
                : "Cancel experiment"}
            </button>
          )}
        </div>

        <aside className="experiment-summary panel">
          <div className="summary-top">
            <span className="summary-icon">⚡</span>

            <span className="summary-label">
              EXPERIMENT PREVIEW
            </span>
          </div>

          <h2>
            {isRunning
              ? "Experiment running"
              : getFailureLabel(displayedFailureType)}
          </h2>

          <p className="summary-description">
            {experiment?.message ??
              getFailureDescription(displayedFailureType)}
          </p>

          <div className="summary-divider" />

          <div className="summary-row">
            <span>Target</span>

            <strong>
              {getServiceName(displayedServiceId, services)}
            </strong>
          </div>

          <div className="summary-row">
            <span>Intensity</span>
            <strong>{displayedIntensity}%</strong>
          </div>

          <div className="summary-row">
            <span>Duration</span>
            <strong>{displayedDuration} seconds</strong>
          </div>

          {experiment && (
            <>
              <div className="summary-divider" />

              <div className="summary-row">
                <span>Experiment ID</span>

                <strong title={experiment.id}>
                  {experiment.id.slice(0, 8)}
                </strong>
              </div>

              <div className="summary-row">
                <span>Time remaining</span>

                <strong>
                  {isRunning
                    ? `${remainingSeconds}s`
                    : "0s"}
                </strong>
              </div>

              <div className="summary-row">
                <span>Service status</span>

                <strong>
                  {selectedService?.status ?? "Unknown"}
                </strong>
              </div>

              <div className="summary-row">
                <span>Service latency</span>

                <strong>
                  {selectedService?.currentLatencyMs ?? "—"} ms
                </strong>
              </div>

              <div className="summary-row">
                <span>Error rate</span>

                <strong>
                  {selectedService
                    ? `${selectedService.errorRate}%`
                    : "—"}
                </strong>
              </div>
            </>
          )}

          <div className="summary-divider" />

          <div className="summary-status">
            <span className="summary-status-dot" />

            <div>
              <strong>{experimentStatusLabel}</strong>

              <span>
                {experiment
                  ? experiment.message
                  : "No experiment is running."}
              </span>
            </div>
          </div>
        </aside>
      </section>

      {/* AI-assisted failure analysis */}
      <section className="mt-10">
        <FailureAnalysisPanel experiments={experiments} />
      </section>

      {/* Circuit breaker and resilience engineering */}
      <section className="mt-10">
        <CircuitBreakerPanel />
      </section>

      {/* Service topology */}
      <footer className="chaos-footer">
        <ServiceTopology services={services} />

        <span>ChaosLab · Grevix AfterCode</span>

        <span>
          Local simulation · No live infrastructure connected
        </span>
      </footer>
    </main>
  );
}
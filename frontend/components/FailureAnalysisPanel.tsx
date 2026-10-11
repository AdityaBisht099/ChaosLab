"use client";

import { useState } from "react";
import {
  chaosApi,
  type Experiment,
  type FailureAnalysis,
} from "@/lib/chaos-api";

interface FailureAnalysisPanelProps {
  experiments: Experiment[];
}

export default function FailureAnalysisPanel({
  experiments,
}: FailureAnalysisPanelProps) {
  const [selectedId, setSelectedId] = useState("");
  const [analysis, setAnalysis] = useState<FailureAnalysis | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateAnalysis() {
    if (!selectedId) {
      setError("Please select an experiment first.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const result =
        await chaosApi.getFailureAnalysis(selectedId);

      setAnalysis(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load failure analysis.",
      );
    } finally {
      setLoading(false);
    }
  }

  const severityStyles: Record<string, string> = {
    LOW: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    MEDIUM: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    HIGH: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    CRITICAL: "border-red-500/30 bg-red-500/10 text-red-400",
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#151310] p-6 md:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-400">
          Resilience Intelligence
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-[#f4ead8]">
          Failure Analysis
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">
          Investigate an experiment to understand its failure
          mechanism, potential impact, and recommended resilience
          improvements.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={selectedId}
          onChange={(event) => {
            setSelectedId(event.target.value);
            setAnalysis(null);
            setError("");
          }}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#201c17] px-4 py-3 text-sm text-[#f4ead8] outline-none focus:border-orange-500"
        >
          <option value="">Select an experiment</option>

          {experiments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id.slice(0, 8)} · {item.targetServiceId} ·{" "}
              {item.failureType} · {item.status}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={generateAnalysis}
          disabled={!selectedId || loading}
          className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Experiment"}
        </button>
      </div>

      {experiments.length === 0 && (
        <p className="mt-4 text-sm text-stone-500">
          No experiments found yet. Start an experiment to generate
          a report.
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {analysis && (
        <div className="mt-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-stone-400">
                Analyzed service
              </p>

              <h3 className="mt-1 text-xl font-semibold text-[#f4ead8]">
                {analysis.serviceName}
              </h3>
            </div>

            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-bold tracking-wider ${
                severityStyles[analysis.severity] ??
                "border-white/15 bg-white/5 text-stone-300"
              }`}
            >
              {analysis.severity} SEVERITY
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                What happened
              </p>

              <p className="mt-3 text-sm leading-6 text-stone-300">
                {analysis.summary}
              </p>
            </article>

            <article className="rounded-xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                Root cause
              </p>

              <p className="mt-3 text-sm leading-6 text-stone-300">
                {analysis.rootCause}
              </p>
            </article>

            <article className="rounded-xl border border-white/10 bg-black/20 p-5 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                Potential impact
              </p>

              <p className="mt-3 text-sm leading-6 text-stone-300">
                {analysis.impact}
              </p>
            </article>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <article className="rounded-xl border border-white/10 p-5">
              <h4 className="font-semibold text-[#f4ead8]">
                Findings
              </h4>

              <ul className="mt-4 space-y-3">
                {analysis.findings.map((finding, index) => (
                  <li
                    key={`${index}-${finding}`}
                    className="flex gap-3 text-sm leading-6 text-stone-300"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                    {finding}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-xl border border-white/10 p-5">
              <h4 className="font-semibold text-[#f4ead8]">
                Recommendations
              </h4>

              <ul className="mt-4 space-y-3">
                {analysis.recommendations.map(
                  (recommendation, index) => (
                    <li
                      key={`${index}-${recommendation}`}
                      className="flex gap-3 text-sm leading-6 text-stone-300"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs text-emerald-400">
                        {index + 1}
                      </span>

                      <span>{recommendation}</span>
                    </li>
                  ),
                )}
              </ul>
            </article>
          </div>

          <p className="text-xs text-stone-500">
            Experiment ID: {analysis.experimentId}
          </p>

          <p className="text-xs text-stone-500">
            {analysis.failureType} · {analysis.experimentStatus}
          </p>
        </div>
      )}
    </section>
  );
}
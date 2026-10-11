"use client";

import type { ServiceNode } from "@/lib/chaos-api";

interface ServiceTopologyProps {
  services: ServiceNode[];
}

export default function ServiceTopology({
  services,
}: ServiceTopologyProps) {
  const nodes = [
    {
      id: "gateway",
      label: "API Gateway",
      icon: "⇄",
    },
    {
      id: "payments",
      label: "Payment Service",
      icon: "◇",
    },
    {
      id: "database",
      label: "Primary Database",
      icon: "▤",
    },
  ];

  return (
    <section className="panel mt-6 w-full p-7">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Service topology
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Live health of your simulated infrastructure.
          </p>
        </div>

        <span className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold tracking-widest text-orange-300">
          LIVE TOPOLOGY
        </span>
      </div>

      <div className="mt-7 grid grid-cols-1 items-stretch gap-5 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {nodes.map((node, index) => {
          const service = services.find(
            (item) => item.id === node.id,
          );

          const isDown = service?.status === "DOWN";

          return (
            <div
              key={node.id}
              className="contents"
            >
              <article
                className={`min-w-0 rounded-xl border p-5 transition-colors ${
                  isDown
                    ? "border-red-400/60 bg-red-500/5"
                    : "border-white/10 bg-white/[0.025]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl text-orange-300">
                    {node.icon}
                  </span>

                  <span
                    className={`flex items-center gap-2 text-[10px] font-bold ${
                      isDown ? "text-red-400" : "text-emerald-300"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isDown ? "bg-red-400" : "bg-emerald-300"
                      }`}
                    />
                    {service?.status ?? "CONNECTING"}
                  </span>
                </div>

                <h3 className="mt-5 text-base font-semibold text-white">
                  {service?.name ?? node.label}
                </h3>

                <p className="mt-2 min-h-9 text-xs leading-5 text-white/50">
                  {service?.type ?? "Loading service information"}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                  <div>
                    <p className="text-xs text-white/50">Latency</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {service
                        ? `${service.currentLatencyMs} ms`
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/50">Error rate</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {service ? `${service.errorRate}%` : "—"}
                    </p>
                  </div>
                </div>
              </article>

              {index < nodes.length - 1 && (
                <div
                  className="hidden items-center justify-center text-xl text-orange-300 md:flex"
                  aria-hidden="true"
                >
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-5 border-t border-white/10 pt-5 text-xs text-white/60">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          Healthy
        </span>

        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          Service unavailable
        </span>
      </div>
    </section>
  );
}
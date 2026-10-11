"use client";

import { useState } from "react";

const navigation = [
  { icon: "◫", label: "Overview", active: true },
  { icon: "⌘", label: "Services", active: false },
  { icon: "⚡", label: "Chaos Lab", active: false },
  { icon: "◷", label: "Experiments", active: false },
  { icon: "⌁", label: "Observability", active: false },
  { icon: "◇", label: "Resilience", active: false },
];

type ServiceStatus = "Healthy" | "Degraded" | "Failed";

type Service = {
  id: string;
  name: string;
  endpoint: string;
  type: string;
  status: ServiceStatus;
  latency: number;
  dependencies: string[];
};

const initialServices: Service[] = [
  {
    id: "gateway",
    name: "API Gateway",
    endpoint: "gateway:8080",
    type: "Entry point",
    status: "Healthy",
    latency: 12,
    dependencies: ["payments"],
  },
  {
    id: "payments",
    name: "Payment Service",
    endpoint: "payments:8081",
    type: "Application service",
    status: "Healthy",
    latency: 84,
    dependencies: ["database"],
  },
  {
    id: "database",
    name: "Primary Database",
    endpoint: "postgres:5432",
    type: "Database",
    status: "Healthy",
    latency: 8,
    dependencies: [],
  },
];

export default function Home() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [selectedServiceId, setSelectedServiceId] = useState("gateway");

  const selectedService =
    services.find((service) => service.id === selectedServiceId) ??
    services[0];

  const serviceNodeClasses = (serviceId: string) =>
    `service-node ${
      selectedServiceId === serviceId ? "service-node-selected" : ""
    }`;

  const getDependencyNames = (service: Service) => {
    if (service.dependencies.length === 0) {
      return "No downstream dependencies";
    }

    return service.dependencies
      .map(
        (dependencyId) =>
          services.find((item) => item.id === dependencyId)?.name ??
          dependencyId
      )
      .join(", ");
  };

  return (
    <main className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <a className="brand" href="#">
          <span className="brand-mark">C</span>
          <span>
            Chaos<span className="brand-accent">Lab</span>
          </span>
        </a>

        <div className="workspace-label">WORKSPACE</div>

        <div className="workspace">
          <div className="workspace-icon">G</div>
          <div className="workspace-details">
            <strong>Grevix Systems</strong>
            <span>Development environment</span>
          </div>
          <span className="workspace-chevron">⌄</span>
        </div>

        <div className="nav-label">PLATFORM</div>

        <nav className="navigation" aria-label="Main navigation">
          {navigation.map((item) => (
            <a
              key={item.label}
              href="#"
              className={`nav-item ${item.active ? "nav-active" : ""}`}
              aria-current={item.active ? "page" : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>

              {item.label === "Chaos Lab" && (
                <span className="nav-badge">NEW</span>
              )}
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="environment-card">
            <span className="environment-dot" />
            <div>
              <strong>Sandbox environment</strong>
              <span>Sample data · Not connected</span>
            </div>
          </div>

          <div className="profile">
            <div className="avatar">A</div>
            <div className="profile-details">
              <strong>Aditya</strong>
              <span>Developer</span>
            </div>
            <span className="profile-menu">···</span>
          </div>
        </div>
      </aside>

      {/* Main workspace */}
      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <strong>Overview</strong>
          </div>

          <div className="topbar-right">
            <span className="demo-indicator">
              <span className="demo-dot" />
              DEMO MODE
            </span>

            <button
              type="button"
              className="icon-button"
              aria-label="Notifications"
            >
              ♧
            </button>

            <button type="button" className="help-button">
              Help ↗
            </button>
          </div>
        </header>

        <div className="page-content">
          {/* Hero */}
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="eyebrow-line" />
                CHAOS ENGINEERING, REIMAGINED
              </div>

              <h1 className="hero-title">
                Break things.
                <br />
                <span>Build resilience.</span>
              </h1>

              <p className="page-description hero-description">
                Your architecture will fail eventually.
                <br className="hero-line-break" />
                Discover how it behaves before production finds out.
              </p>

              <div className="hero-actions">
                <a
                  className="primary-button hero-primary"
                  href="/chaos-lab"
                >
                  <span className="hero-button-icon">⚡</span>
                  Run an experiment
                  <span className="hero-button-arrow">↗</span>
                </a>

                <a
                  className="secondary-button"
                  href="#service-topology"
                >
                  Explore architecture <span>↓</span>
                </a>
              </div>

              <div className="hero-footnote">
                <span className="hero-footnote-dot" />
                SAFE SANDBOX
                <span className="hero-footnote-divider">/</span>
                CONTROLLED FAILURE
                <span className="hero-footnote-divider">/</span>
                SAMPLE ENVIRONMENT
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />
              <div className="hero-orbit orbit-three" />

              <div className="hero-core-glow" />

              <div className="hero-core">
                <span className="hero-core-symbol">✳</span>
              </div>

              <span className="hero-node hero-node-one">
                <span />
                API
              </span>

              <span className="hero-node hero-node-two">
                <span />
                PAYMENTS
              </span>

              <span className="hero-node hero-node-three">
                <span />
                DATABASE
              </span>

              <span className="hero-signal signal-one">12 ms</span>
              <span className="hero-signal signal-two">99.6%</span>

              <div className="hero-visual-caption">
                <span className="hero-caption-indicator" />
                SYSTEM MODEL
                <span className="hero-caption-separator">·</span>
                03 NODES
              </div>
            </div>
          </section>

          {/* System status */}
          <section className="system-banner">
            <div className="system-status-icon">✓</div>

            <div className="system-status-copy">
              <strong>All systems operational</strong>
              <span>
                Your sample environment is ready for exploration.
              </span>
            </div>

            <div className="system-status-meta">
              <span className="status-dot" />
              SIMULATED STATUS
            </div>
          </section>

          {/* Metric cards */}
          <section className="section">
            <div className="section-heading">
              <div>
                <h2>At a glance</h2>
                <p>Key signals from your sample environment</p>
              </div>

              <span className="sample-label">SAMPLE DATA</span>
            </div>

            <div className="metrics-grid">
              <MetricCard
                label="Services"
                value={String(services.length).padStart(2, "0")}
                detail="Registered services"
                icon="◇"
                accent="orange"
              />

              <MetricCard
                label="Request throughput"
                value="1.2k"
                unit="req/min"
                detail="Simulated traffic"
                icon="↗"
                accent="green"
              />

              <MetricCard
                label="P95 latency"
                value="84"
                unit="ms"
                detail="Response time"
                icon="◷"
                accent="violet"
              />

              <MetricCard
                label="Error rate"
                value="0.4"
                unit="%"
                detail="Simulated failures"
                icon="⌁"
                accent="green"
              />
            </div>
          </section>

          {/* Architecture and activity */}
          <section className="content-grid">
            <div id="service-topology" className="panel topology-panel">
              <div className="panel-heading">
                <div>
                  <h2>Service topology</h2>
                  <p>How your services communicate</p>
                </div>

                <button
                  type="button"
                  className="text-button"
                  onClick={() => setSelectedServiceId("gateway")}
                >
                  Reset selection →
                </button>
              </div>

              <div className="topology-canvas">
                <div className="topology-glow" />

                {/* API Gateway */}
                <button
                  type="button"
                  className={serviceNodeClasses("gateway")}
                  onClick={() => setSelectedServiceId("gateway")}
                  aria-pressed={selectedServiceId === "gateway"}
                  aria-label="Select API Gateway"
                >
                  <span className="service-icon gateway-icon">⇄</span>

                  <span className="service-copy">
                    <strong>API Gateway</strong>
                    <span>gateway:8080</span>
                  </span>

                  <span className="service-status">
                    <span />
                    Healthy
                  </span>
                </button>

                <div className="connection">
                  <span className="connection-line" />
                  <span className="connection-label">HTTP · 12 ms</span>
                  <span className="connection-arrow">↓</span>
                </div>

                {/* Payment Service */}
                <button
                  type="button"
                  className={serviceNodeClasses("payments")}
                  onClick={() => setSelectedServiceId("payments")}
                  aria-pressed={selectedServiceId === "payments"}
                  aria-label="Select Payment Service"
                >
                  <span className="service-icon payment-icon">₹</span>

                  <span className="service-copy">
                    <strong>Payment Service</strong>
                    <span>payments:8081</span>
                  </span>

                  <span className="service-status">
                    <span />
                    Healthy
                  </span>
                </button>

                <div className="connection">
                  <span className="connection-line" />
                  <span className="connection-label">SQL · 8 ms</span>
                  <span className="connection-arrow">↓</span>
                </div>

                {/* Primary Database */}
                <button
                  type="button"
                  className={serviceNodeClasses("database")}
                  onClick={() => setSelectedServiceId("database")}
                  aria-pressed={selectedServiceId === "database"}
                  aria-label="Select Primary Database"
                >
                  <span className="service-icon database-icon">▤</span>

                  <span className="service-copy">
                    <strong>Primary Database</strong>
                    <span>postgres:5432</span>
                  </span>

                  <span className="service-status">
                    <span />
                    Healthy
                  </span>
                </button>
              </div>

              {/* Selected service details */}
              <div className="selected-service-panel" aria-live="polite">
                <div className="selected-service-heading">
                  <div>
                    <span className="selected-service-eyebrow">
                      SELECTED SERVICE
                    </span>

                    <h3>{selectedService.name}</h3>
                  </div>

                  <span
                    className={`selected-service-status status-${selectedService.status.toLowerCase()}`}
                  >
                    <span />
                    {selectedService.status}
                  </span>
                </div>

                <div className="selected-service-details">
                  <div>
                    <span>Endpoint</span>
                    <strong>{selectedService.endpoint}</strong>
                  </div>

                  <div>
                    <span>Service type</span>
                    <strong>{selectedService.type}</strong>
                  </div>

                  <div>
                    <span>Latency</span>
                    <strong>{selectedService.latency} ms</strong>
                  </div>

                  <div>
                    <span>Dependencies</span>
                    <strong>
                      {getDependencyNames(selectedService)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="topology-footer">
                <span>
                  <span className="legend-dot" />
                  {services.length} services
                </span>

                <span>
                  <span className="legend-line" />
                  {services.reduce(
                    (total, service) =>
                      total + service.dependencies.length,
                    0
                  )}{" "}
                  connections
                </span>

                <span className="topology-footer-note">
                  Illustrative architecture
                </span>
              </div>
            </div>

            {/* Recent activity */}
            <div className="panel activity-panel">
              <div className="panel-heading">
                <div>
                  <h2>Recent activity</h2>
                  <p>Latest events in your workspace</p>
                </div>

                <span className="activity-count">03</span>
              </div>

              <div className="activity-list">
                <ActivityItem
                  icon="✓"
                  tone="green"
                  title="Environment initialized"
                  description="Sample services are ready"
                  time="Just now"
                />

                <ActivityItem
                  icon="◇"
                  tone="orange"
                  title="Topology loaded"
                  description="3 services discovered"
                  time="2 min ago"
                />

                <ActivityItem
                  icon="↗"
                  tone="violet"
                  title="Baseline established"
                  description="Sample metrics generated"
                  time="5 min ago"
                />
              </div>

              <div className="activity-footer">
                <span className="activity-footer-dot" />
                Demonstration events · Not live telemetry
              </div>
            </div>
          </section>

          {/* Call to action */}
          <section id="chaos-lab" className="experiment-cta">
            <div className="cta-decoration">✳</div>

            <div className="cta-copy">
              <span className="cta-eyebrow">READY TO BREAK THINGS?</span>

              <h2>Healthy systems are only half the story.</h2>

              <p>
                Introduce controlled failures and discover how your
                architecture responds.
              </p>
            </div>

            <button
              type="button"
              className="primary-button cta-button"
              onClick={() => {
                document
                  .getElementById("service-topology")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Enter Chaos Lab <span>↗</span>
            </button>
          </section>

          <footer className="page-footer">
            <span>ChaosLab · Grevix AfterCode</span>

            <span>
              <span className="footer-dot" />
              Demonstration environment
            </span>
          </footer>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  unit,
  detail,
  icon,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  detail: string;
  icon: string;
  accent: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className={`metric-icon ${accent}`}>{icon}</span>
      </div>

      <div className="metric-value">
        {value}
        {unit && <span>{unit}</span>}
      </div>

      <div className="metric-detail">{detail}</div>
    </article>
  );
}

function ActivityItem({
  icon,
  tone,
  title,
  description,
  time,
}: {
  icon: string;
  tone: string;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <article className="activity-item">
      <div className={`activity-icon ${tone}`}>{icon}</div>

      <div className="activity-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <time>{time}</time>
    </article>
  );
}
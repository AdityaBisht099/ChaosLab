# ChaosLab — Chaos Engineering Simulator

**Break services. Observe failures. Understand resilience.**

ChaosLab is a full-stack chaos engineering simulator that allows developers to inject controlled failures into simulated services, observe their impact, test circuit breaker behavior, and generate failure analysis using a locally running AI model.

The project demonstrates how distributed systems can be tested for resilience without intentionally disrupting real production infrastructure.

## Features

### 1. Controlled Failure Injection
- Inject latency into simulated services.
- Simulate complete service failures.
- Inject errors at configurable rates.
- Configure failure intensity and duration.
- Cancel running experiments.
- Automatically recover services after an experiment ends.

### 2. Service Topology
- Monitor simulated services.
- Observe service health and latency.
- Track error rates.
- View service recovery after experiments.

### 3. Circuit Breaker Simulation
- CLOSED, OPEN, and HALF_OPEN states.
- Configurable failure threshold.
- Automatic cooldown and recovery.
- Simulated requests to observe circuit breaker behavior.
- Request success and failure statistics.

### 4. AI-Powered Failure Analysis
- Analyze completed experiments.
- Generate root-cause explanations.
- Summarize the simulated impact.
- Identify findings and recommendations.
- Use a locally running Ollama model when available.
- Provide rule-based fallback analysis when AI is unavailable.

### 5. Interactive Dashboard
- Monitor experiments and services.
- Start and cancel experiments.
- View service topology and circuit breaker states.
- Inspect failure analysis from the dashboard.

## Technology Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Java
- Spring Boot
- Spring MVC
- REST APIs
- Maven

### AI Integration
- Ollama
- Qwen3 8B

The AI integration is optional. The backend can use its rule-based analysis fallback when the local Ollama service is unavailable.

## Architecture

```text
                   ChaosLab Dashboard
                    Next.js / React
                           |
                           | REST API
                           v
                   Spring Boot Backend
                           |
            +--------------+--------------+
            |              |              |
            v              v              v
      Simulation      Circuit Breaker   Failure Analysis
         Engine          Logic             Service
            |                                |
            v                                v
      Simulated Services                   Ollama
      - API Gateway                   (optional local AI)
      - Payment Service
      - Primary Database
```

## Prerequisites

Install the following before running ChaosLab:

- Java Development Kit compatible with the project's configured Java release.
- Maven.
- Node.js and npm.
- Git.

For AI-powered analysis, install Ollama and download the configured model.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/AdityaBisht099/ChaosLab.git
cd ChaosLab
```

### 2. Start the backend

Open a terminal:

```bash
cd backend
mvn spring-boot:run
```

The backend runs at:

```text
http://localhost:8080
```

### 3. Start the frontend

Open another terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the dashboard:

```text
http://localhost:3000/chaos-lab
```

Keep both development servers running while using the dashboard.

## Optional: Enable AI Analysis

Install Ollama and download the configured model:

```bash
ollama pull qwen3:8b
```

Start Ollama if it is not already running:

```bash
ollama serve
```

The backend expects the Ollama API at:

```text
http://localhost:11434
```

If Ollama is unavailable, the application can use rule-based failure analysis instead.

## API Overview

The backend exposes REST endpoints for experiments, services, circuit breakers, and failure analysis.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/experiments` | List experiments |
| GET | `/api/experiments/{id}` | Retrieve an experiment |
| POST | `/api/experiments` | Start an experiment |
| POST | `/api/experiments/{id}/cancel` | Cancel an experiment |
| POST | `/api/simulation/reset` | Reset the simulation |
| GET | `/api/services` | List simulated services |
| GET | `/api/services/{id}` | Retrieve a service |
| GET | `/api/circuit-breakers` | List circuit breakers |
| GET | `/api/circuit-breakers/{serviceId}` | Retrieve a circuit breaker |
| POST | `/api/circuit-breakers/{serviceId}/request` | Simulate a request |
| POST | `/api/circuit-breakers/reset` | Reset circuit breakers |
| GET | `/api/analysis/{experimentId}` | Analyze an experiment |

Experiment creation requests use the backend's defined request model and validation rules.

## Testing

### Backend tests

From the project root:

```bash
cd backend
mvn clean test
```

### Frontend TypeScript validation

From the project root:

```bash
cd frontend
npx tsc --noEmit
```

### Frontend production build

```bash
npm run build
```

## Important Limitations

- Services are simulated; this project does not inject failures into real production infrastructure.
- Experiments and service state are stored in memory and are lost when the backend restarts.
- Circuit breakers protect simulated requests through the application API, not arbitrary network traffic.
- AI-generated analysis is based on experiment data and simulation parameters, not real production telemetry.
- AI analysis may use a rule-based fallback when Ollama is unavailable.

## Future Improvements

- Persistent experiment history.
- Custom service topologies.
- More failure injection strategies.
- Metrics visualization and experiment comparisons.
- Configurable circuit breaker policies.
- Exportable experiment reports.
- Support for additional local AI models.

## License

This project is available under the license specified in the repository. If no license has been added, all rights remain reserved by default.

---

**ChaosLab** — Experiment with failure to build a better understanding of system resilience.
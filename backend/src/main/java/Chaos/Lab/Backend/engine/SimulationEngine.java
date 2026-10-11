package Chaos.Lab.Backend.engine;

import Chaos.Lab.Backend.model.CircuitBreaker;
import Chaos.Lab.Backend.model.Experiment;
import Chaos.Lab.Backend.model.ServiceNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

@Component
public class SimulationEngine {

    private final Map<String, ServiceNode> services =
            new ConcurrentHashMap<>();

    private final Map<String, Experiment> experiments =
            new ConcurrentHashMap<>();

    private final Map<String, CircuitBreaker> circuitBreakers =

        new ConcurrentHashMap<>();

    private final Map<String, ScheduledFuture<?>> scheduledExperiments =
            new ConcurrentHashMap<>();

    private final ScheduledExecutorService scheduler =
            Executors.newScheduledThreadPool(4);

    public SimulationEngine() {
        initializeServices();
    }

    private void initializeServices() {
        services.put("gateway", new ServiceNode(
                "gateway",
                "API Gateway",
                "Entry point",
                "HEALTHY",
                "gateway:8080",
                12
        ));

        services.put("payments", new ServiceNode(
                "payments",
                "Payment Service",
                "Application service",
                "HEALTHY",
                "payments:8081",
                84
        ));

        services.put("database", new ServiceNode(
                "database",
                "Primary Database",
                "Database",
                "HEALTHY",
                "postgres:5432",
                8
        ));
        services.keySet().forEach(serviceId ->
        circuitBreakers.put(
                serviceId,
                new CircuitBreaker(serviceId)
        )
        );
    }

    public Collection<ServiceNode> getAllServices() {
        return new ArrayList<>(services.values());
    }

    public ServiceNode getService(String serviceId) {
        return services.get(serviceId);
    }

    public Collection<Experiment> getAllExperiments() {
        return new ArrayList<>(experiments.values());
    }

    public Experiment getExperiment(String experimentId) {
        return experiments.get(experimentId);
    }

    public synchronized Experiment startExperiment(
            String targetServiceId,
            Experiment.FailureType failureType,
            int intensity,
            int durationSeconds) {

        ServiceNode target = services.get(targetServiceId);

        if (target == null) {
            throw new IllegalArgumentException(
                    "Unknown service: " + targetServiceId
            );
        }

        if (failureType == null) {
            throw new IllegalArgumentException(
                    "Failure type is required."
            );
        }

        if (intensity < 1 || intensity > 100) {
            throw new IllegalArgumentException(
                    "Intensity must be between 1 and 100."
            );
        }

        if (durationSeconds < 1 || durationSeconds > 300) {
            throw new IllegalArgumentException(
                    "Duration must be between 1 and 300 seconds."
            );
        }

        boolean alreadyRunning = experiments.values().stream()
                .anyMatch(experiment ->
                        experiment.getStatus() == Experiment.Status.RUNNING
                                && experiment.getTargetServiceId()
                                .equals(targetServiceId));

        if (alreadyRunning) {
            throw new IllegalStateException(
                    "This service already has a running experiment."
            );
        }

        String experimentId = UUID.randomUUID().toString();

        Experiment experiment = new Experiment(
                experimentId,
                targetServiceId,
                failureType,
                intensity,
                durationSeconds
        );

        experiments.put(experimentId, experiment);

        try {
            applyFailure(target, failureType, intensity);

            ScheduledFuture<?> task = scheduler.schedule(
                    () -> finishExperiment(experimentId),
                    durationSeconds,
                    TimeUnit.SECONDS
            );

            scheduledExperiments.put(experimentId, task);

            return experiment;

        } catch (RuntimeException exception) {
            target.recover();
            experiment.fail("Experiment could not start safely.");
            throw exception;
        }
    }

    private void applyFailure(
            ServiceNode service,
            Experiment.FailureType failureType,
            int intensity) {

        switch (failureType) {
            case LATENCY -> {
                long additionalLatency = Math.round(
                        service.getBaseLatencyMs()
                                * (intensity / 100.0)
                                * 10
                );

                service.setCurrentLatencyMs(
                        service.getBaseLatencyMs() + additionalLatency
                );
            }

            case SERVICE_FAILURE ->
                    service.setStatus("DOWN");

            case ERROR_INJECTION ->
                    service.setErrorRate(intensity);
        }
    }

    private synchronized void finishExperiment(String experimentId) {
        Experiment experiment = experiments.get(experimentId);

        if (experiment == null
                || experiment.getStatus() != Experiment.Status.RUNNING) {
            return;
        }

        ServiceNode target =
                services.get(experiment.getTargetServiceId());

        if (target != null) {
            target.recover();
        }

        experiment.complete(
                "Experiment finished. Service state restored."
        );

        scheduledExperiments.remove(experimentId);
    }

    public synchronized Experiment cancelExperiment(String experimentId) {
        Experiment experiment = experiments.get(experimentId);

        if (experiment == null) {
            throw new IllegalArgumentException(
                    "Experiment not found: " + experimentId
            );
        }

        if (experiment.getStatus() != Experiment.Status.RUNNING) {
            throw new IllegalStateException(
                    "Only running experiments can be cancelled."
            );
        }

        ScheduledFuture<?> task =
                scheduledExperiments.remove(experimentId);

        if (task != null) {
            task.cancel(false);
        }

        ServiceNode target =
                services.get(experiment.getTargetServiceId());

        if (target != null) {
            target.recover();
        }

        experiment.cancel(
                "Experiment cancelled. Service state restored."
        );

        return experiment;
    }

    public synchronized void resetSimulation() {
        for (ScheduledFuture<?> task : scheduledExperiments.values()) {
            task.cancel(false);
        }

        scheduledExperiments.clear();

        for (ServiceNode service : services.values()) {
            service.recover();
        }

        for (Experiment experiment : experiments.values()) {
            if (experiment.getStatus() == Experiment.Status.RUNNING) {
                experiment.cancel(
                        "Simulation reset. Service state restored."
                );
            }
        }
    }
    public Collection<CircuitBreaker> getAllCircuitBreakers() {
    return new ArrayList<>(circuitBreakers.values());
}

public CircuitBreaker getCircuitBreaker(String serviceId) {
    return circuitBreakers.get(serviceId);
}

public synchronized boolean allowServiceRequest(String serviceId) {
    CircuitBreaker breaker = circuitBreakers.get(serviceId);
    ServiceNode service = services.get(serviceId);

    if (breaker == null || service == null) {
        throw new IllegalArgumentException(
                "Unknown service: " + serviceId
        );
    }

    // Ask the circuit breaker whether the request is allowed.
    if (!breaker.allowRequest()) {
        return false;
    }

    // A down service produces a simulated failure.
    if ("DOWN".equals(service.getStatus())) {
        breaker.recordFailure();
        return false;
    }

    // Simulate failed requests when error injection is active.
    if (service.getErrorRate() > 0) {
        double simulatedFailure = Math.random() * 100;

        if (simulatedFailure < service.getErrorRate()) {
            breaker.recordFailure();
            return false;
        }
    }

    // The simulated request succeeded.
    breaker.recordSuccess();
    return true;
}

public synchronized void resetCircuitBreakers() {
    circuitBreakers.values().forEach(CircuitBreaker::reset);
}
}

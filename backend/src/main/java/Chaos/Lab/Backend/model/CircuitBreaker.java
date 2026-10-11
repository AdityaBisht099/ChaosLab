package Chaos.Lab.Backend.model;

import java.time.Instant;

public class CircuitBreaker {

    public enum State {
        CLOSED,
        OPEN,
        HALF_OPEN
    }

    private final String serviceId;

    private State state = State.CLOSED;

    private int failureThreshold = 3;
    private int consecutiveFailures = 0;

    private long openDurationMillis = 10_000;
    private Instant openedAt;

    private long totalRequests = 0;
    private long blockedRequests = 0;
    private long successfulRequests = 0;
    private long failedRequests = 0;

    public CircuitBreaker(String serviceId) {
        this.serviceId = serviceId;
    }

    public synchronized boolean allowRequest() {
        if (state == State.OPEN) {
            boolean cooldownFinished =
                    openedAt != null
                    && Instant.now().toEpochMilli() - openedAt.toEpochMilli()
                    >= openDurationMillis;

            if (!cooldownFinished) {
                blockedRequests++;
                return false;
            }

            state = State.HALF_OPEN;
        }

        totalRequests++;
        return true;
    }

    public synchronized void recordSuccess() {
        successfulRequests++;
        consecutiveFailures = 0;

        if (state == State.HALF_OPEN) {
            state = State.CLOSED;
            openedAt = null;
        }
    }

    public synchronized void recordFailure() {
        failedRequests++;
        consecutiveFailures++;

        if (state == State.HALF_OPEN
                || consecutiveFailures >= failureThreshold) {
            openCircuit();
        }
    }

    public synchronized void openCircuit() {
        state = State.OPEN;
        openedAt = Instant.now();
    }

    public synchronized void reset() {
        state = State.CLOSED;
        consecutiveFailures = 0;
        openedAt = null;
        totalRequests = 0;
        blockedRequests = 0;
        successfulRequests = 0;
        failedRequests = 0;
    }

    public synchronized String getServiceId() {
        return serviceId;
    }

    public synchronized State getState() {
        return state;
    }

    public synchronized int getFailureThreshold() {
        return failureThreshold;
    }

    public synchronized int getConsecutiveFailures() {
        return consecutiveFailures;
    }

    public synchronized long getOpenDurationMillis() {
        return openDurationMillis;
    }

    public synchronized Instant getOpenedAt() {
        return openedAt;
    }

    public synchronized long getTotalRequests() {
        return totalRequests;
    }

    public synchronized long getBlockedRequests() {
        return blockedRequests;
    }

    public synchronized long getSuccessfulRequests() {
        return successfulRequests;
    }

    public synchronized long getFailedRequests() {
        return failedRequests;
    }
}
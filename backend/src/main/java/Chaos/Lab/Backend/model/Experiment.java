package Chaos.Lab.Backend.model;

import java.time.Instant;

public class Experiment {

    public enum FailureType {
        LATENCY,
        SERVICE_FAILURE,
        ERROR_INJECTION
    }

    public enum Status {
        RUNNING,
        COMPLETED,
        FAILED,
        CANCELLED
    }

    private String id;
    private String targetServiceId;
    private FailureType failureType;
    private int intensity;
    private int durationSeconds;

    private Status status;
    private Instant startedAt;
    private Instant completedAt;
    private String message;

    public Experiment(
            String id,
            String targetServiceId,
            FailureType failureType,
            int intensity,
            int durationSeconds) {

        this.id = id;
        this.targetServiceId = targetServiceId;
        this.failureType = failureType;
        this.intensity = intensity;
        this.durationSeconds = durationSeconds;

        this.status = Status.RUNNING;
        this.startedAt = Instant.now();
        this.message = "Experiment started.";
    }

    public String getId() {
        return id;
    }

    public String getTargetServiceId() {
        return targetServiceId;
    }

    public FailureType getFailureType() {
        return failureType;
    }

    public int getIntensity() {
        return intensity;
    }

    public int getDurationSeconds() {
        return durationSeconds;
    }

    public Status getStatus() {
        return status;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public String getMessage() {
        return message;
    }

    public void complete(String message) {
        this.status = Status.COMPLETED;
        this.completedAt = Instant.now();
        this.message = message;
    }

    public void fail(String message) {
        this.status = Status.FAILED;
        this.completedAt = Instant.now();
        this.message = message;
    }

    public void cancel(String message) {
        this.status = Status.CANCELLED;
        this.completedAt = Instant.now();
        this.message = message;
    }
}
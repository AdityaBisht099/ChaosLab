package Chaos.Lab.Backend.model;

public class ServiceNode {

    private String id;
    private String name;
    private String type;
    private String status;
    private String endpoint;

    private long baseLatencyMs;
    private long currentLatencyMs;
    private double errorRate;

    public ServiceNode(
            String id,
            String name,
            String type,
            String status,
            String endpoint,
            long baseLatencyMs) {

        this.id = id;
        this.name = name;
        this.type = type;
        this.status = status;
        this.endpoint = endpoint;
        this.baseLatencyMs = baseLatencyMs;
        this.currentLatencyMs = baseLatencyMs;
        this.errorRate = 0.0;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getType() {
        return type;
    }

    public String getStatus() {
        return status;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public long getBaseLatencyMs() {
        return baseLatencyMs;
    }

    public long getCurrentLatencyMs() {
        return currentLatencyMs;
    }

    public double getErrorRate() {
        return errorRate;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setCurrentLatencyMs(long latencyMs) {
        this.currentLatencyMs = Math.max(0, latencyMs);
    }

    public void setErrorRate(double errorRate) {
        this.errorRate = Math.max(0.0, Math.min(100.0, errorRate));
    }

    public void recover() {
        this.status = "HEALTHY";
        this.currentLatencyMs = baseLatencyMs;
        this.errorRate = 0.0;
    }
}
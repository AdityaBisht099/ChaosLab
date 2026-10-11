package Chaos.Lab.Backend.model;

import java.util.List;

public class FailureAnalysis {

    private String experimentId;
    private String serviceId;
    private String serviceName;
    private String failureType;
    private String experimentStatus;

    private String summary;
    private String rootCause;
    private String impact;
    private String severity;

    private List<String> findings;
    private List<String> recommendations;

    public FailureAnalysis(
            String experimentId,
            String serviceId,
            String serviceName,
            String failureType,
            String experimentStatus,
            String summary,
            String rootCause,
            String impact,
            String severity,
            List<String> findings,
            List<String> recommendations) {

        this.experimentId = experimentId;
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.failureType = failureType;
        this.experimentStatus = experimentStatus;
        this.summary = summary;
        this.rootCause = rootCause;
        this.impact = impact;
        this.severity = severity;
        this.findings = findings;
        this.recommendations = recommendations;
    }

    public String getExperimentId() {
        return experimentId;
    }

    public String getServiceId() {
        return serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public String getFailureType() {
        return failureType;
    }

    public String getExperimentStatus() {
        return experimentStatus;
    }

    public String getSummary() {
        return summary;
    }

    public String getRootCause() {
        return rootCause;
    }

    public String getImpact() {
        return impact;
    }

    public String getSeverity() {
        return severity;
    }

    public List<String> getFindings() {
        return findings;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }
}
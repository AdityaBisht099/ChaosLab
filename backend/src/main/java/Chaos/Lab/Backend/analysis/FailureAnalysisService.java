package Chaos.Lab.Backend.analysis;

import Chaos.Lab.Backend.ai.OllamaService;
import Chaos.Lab.Backend.engine.SimulationEngine;
import Chaos.Lab.Backend.model.Experiment;
import Chaos.Lab.Backend.model.FailureAnalysis;
import Chaos.Lab.Backend.model.ServiceNode;

import org.springframework.stereotype.Service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class FailureAnalysisService {

    private final SimulationEngine simulationEngine;
    private final OllamaService ollamaService;
    private final JsonMapper jsonMapper;

    public FailureAnalysisService(
            SimulationEngine simulationEngine,
            OllamaService ollamaService,
            JsonMapper jsonMapper) {

        this.simulationEngine = simulationEngine;
        this.ollamaService = ollamaService;
        this.jsonMapper = jsonMapper;
    }

    public FailureAnalysis analyzeExperiment(String experimentId) {

        Experiment experiment =
                simulationEngine.getExperiment(experimentId);

        if (experiment == null) {
            throw new IllegalArgumentException(
                    "Experiment not found: " + experimentId
            );
        }

        ServiceNode service =
                simulationEngine.getService(
                        experiment.getTargetServiceId()
                );

        if (service == null) {
            throw new IllegalStateException(
                    "Target service no longer exists."
            );
        }

        FailureAnalysis fallback =
                createRuleBasedAnalysis(experiment, service);

        try {
            String prompt = buildPrompt(experiment, service);

            String response =
                    ollamaService.generateAnalysis(prompt);

            return parseAiResponse(
                    response,
                    experiment,
                    service
            );

        } catch (Exception exception) {

            System.err.println(
                    "AI analysis unavailable; using rule-based fallback: "
                            + exception.getMessage()
            );

            return fallback;
        }
    }

    private String buildPrompt(
            Experiment experiment,
            ServiceNode service) {

        return """
                You are a senior site reliability engineer analyzing
                a chaos engineering experiment.

                Analyze only the supplied simulation data.

                Do not invent metrics, logs, dependencies, or events.
                Clearly distinguish configured parameters from measured
                observations and potential risks.

                IMPORTANT ANALYSIS RULES:

                1. The current service status does not establish its
                   status during the entire experiment.

                2. SERVICE_FAILURE deliberately marks the target service
                   unavailable while the injected failure is active.

                3. Never claim that the service remained healthy during
                   the experiment merely because it is healthy now.

                4. A SERVICE_FAILURE experiment with intensity of 75%
                   or higher must have HIGH severity at minimum.

                5. Explain the potential impact on requests targeting
                   an unavailable service.

                6. Do not invent latency changes, error counts,
                   logs, or production measurements.

                7. ChaosLab is a simulator. Never claim that production
                   impact was measured.

                8. Distinguish injected failures from recovery afterward.

                9. Recommendations must be specific to the failure type.

                EXPERIMENT DATA

                Experiment ID: %s
                Service: %s
                Service ID: %s
                Failure type: %s
                Intensity: %d%%
                Duration: %d seconds
                Experiment status: %s
                Service status at analysis time: %s
                Baseline latency: %d ms
                Current latency at analysis time: %d ms
                Configured error rate at analysis time: %.2f%%

                Return ONLY valid JSON with this exact structure:

                {
                  "summary": "Brief explanation",
                  "rootCause": "Explanation of the injected failure",
                  "impact": "Simulated or potential impact",
                  "severity": "LOW, MEDIUM, HIGH, or CRITICAL",
                  "findings": [
                    "Finding 1",
                    "Finding 2"
                  ],
                  "recommendations": [
                    "Recommendation 1",
                    "Recommendation 2",
                    "Recommendation 3"
                  ]
                }

                OUTPUT RULES:

                - Keep the summary concise.
                - Base the root cause on the configured failure type.
                - Never claim production impact was measured.
                - Never describe configured values as measured results.
                - Severity must be one of the four specified values.
                - Findings and recommendations must be JSON arrays.
                - Include at least two findings.
                - Include at least two recommendations.
                - Do not include Markdown fences or commentary outside JSON.
                """.formatted(
                experiment.getId(),
                service.getName(),
                service.getId(),
                experiment.getFailureType().name(),
                experiment.getIntensity(),
                experiment.getDurationSeconds(),
                experiment.getStatus().name(),
                service.getStatus(),
                service.getBaseLatencyMs(),
                service.getCurrentLatencyMs(),
                service.getErrorRate()
        );
    }

    private FailureAnalysis parseAiResponse(
            String response,
            Experiment experiment,
            ServiceNode service) throws Exception {

        String json = extractJson(response);

        JsonNode root = jsonMapper.readTree(json);

        if (root == null || !root.isObject()) {
            throw new IllegalStateException(
                    "AI response is not a JSON object."
            );
        }

        String summary =
                requiredText(root, "summary");

        String rootCause =
                requiredText(root, "rootCause");

        String impact =
                requiredText(root, "impact");

        String severity =
                requiredText(root, "severity")
                        .toUpperCase(Locale.ROOT);

        List<String> findings =
                readStringArray(root, "findings");

        List<String> recommendations =
                readStringArray(root, "recommendations");

        if (findings.size() < 2) {
            throw new IllegalStateException(
                    "AI response must contain at least two findings."
            );
        }

        if (recommendations.size() < 2) {
            throw new IllegalStateException(
                    "AI response must contain at least two recommendations."
            );
        }

        if (!List.of(
                "LOW",
                "MEDIUM",
                "HIGH",
                "CRITICAL"
        ).contains(severity)) {

            throw new IllegalStateException(
                    "AI returned an invalid severity."
            );
        }

        severity = enforceSeverityPolicy(
                severity,
                experiment
        );

        return new FailureAnalysis(
                experiment.getId(),
                service.getId(),
                service.getName(),
                experiment.getFailureType().name(),
                experiment.getStatus().name(),
                summary,
                rootCause,
                impact,
                severity,
                findings,
                recommendations
        );
    }

    private String extractJson(String response) {

        if (response == null || response.isBlank()) {
            throw new IllegalStateException(
                    "AI returned an empty response."
            );
        }

        String trimmed = response.trim();

        if (trimmed.startsWith("{")
                && trimmed.endsWith("}")) {
            return trimmed;
        }

        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');

        if (start < 0 || end <= start) {
            throw new IllegalStateException(
                    "AI did not return a JSON object."
            );
        }

        return trimmed.substring(start, end + 1);
    }

    private String requiredText(
            JsonNode root,
            String field) {

        JsonNode node = root.get(field);

        if (node == null
                || !node.isString()
                || node.asString().isBlank()) {

            throw new IllegalStateException(
                    "AI response is missing required text field: "
                            + field
            );
        }

        return node.asString().trim();
    }

    private List<String> readStringArray(
            JsonNode root,
            String field) {

        JsonNode node = root.get(field);

        if (node == null || !node.isArray()) {
            throw new IllegalStateException(
                    "AI response field must be an array: "
                            + field
            );
        }

        List<String> values = new ArrayList<>();

        for (JsonNode item : node) {

            if (!item.isString()
                    || item.asString().isBlank()) {

                throw new IllegalStateException(
                        "AI response contains an invalid item in "
                                + field
                );
            }

            values.add(item.asString().trim());
        }

        return values;
    }

    private String enforceSeverityPolicy(
            String severity,
            Experiment experiment) {

        if (experiment.getFailureType()
                == Experiment.FailureType.SERVICE_FAILURE
                && experiment.getIntensity() >= 75) {

            if ("LOW".equals(severity)
                    || "MEDIUM".equals(severity)) {
                return "HIGH";
            }
        }

        return severity;
    }

    private FailureAnalysis createRuleBasedAnalysis(
            Experiment experiment,
            ServiceNode service) {

        List<String> findings = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();

        String failureType =
                experiment.getFailureType().name();

        int intensity =
                experiment.getIntensity();

        String summary;
        String rootCause;
        String impact;
        String severity;

        switch (experiment.getFailureType()) {

            case LATENCY -> {

                summary =
                        "Elevated latency was injected into "
                                + service.getName() + ".";

                rootCause =
                        "The experiment increased the service's "
                                + "configured response latency.";

                impact =
                        "Simulated requests may take longer to complete. "
                                + "Actual response-time impact was not "
                                + "measured by this analysis.";

                severity = intensity >= 75
                        ? "HIGH"
                        : intensity >= 40
                        ? "MEDIUM"
                        : "LOW";

                findings.add(
                        "Configured latency intensity: "
                                + intensity + "%."
                );

                findings.add(
                        "Baseline latency: "
                                + service.getBaseLatencyMs()
                                + " ms."
                );

                recommendations.add(
                        "Configure response-time limits and latency alerts."
                );

                recommendations.add(
                        "Use timeouts to protect against slow dependencies."
                );

                recommendations.add(
                        "Consider bounded retries with backoff and jitter."
                );
            }

            case SERVICE_FAILURE -> {

                summary =
                        service.getName()
                                + " was deliberately marked unavailable.";

                rootCause =
                        "The experiment injected a service failure.";

                impact =
                        "Requests targeting the unavailable service may "
                                + "fail. Dependent operations may also be "
                                + "affected. This is simulated impact, "
                                + "not a production measurement.";

                severity = intensity >= 75
                        ? "HIGH"
                        : intensity >= 40
                        ? "MEDIUM"
                        : "LOW";

                findings.add(
                        "Configured service-failure intensity: "
                                + intensity + "%."
                );

                findings.add(
                        "The experiment used SERVICE_FAILURE mode."
                );

                recommendations.add(
                        "Use circuit breakers to limit repeated calls."
                );

                recommendations.add(
                        "Define health checks and recovery procedures."
                );

                recommendations.add(
                        "Test graceful degradation for dependent services."
                );
            }

            case ERROR_INJECTION -> {

                summary =
                        "Errors were injected into "
                                + service.getName() + ".";

                rootCause =
                        "The experiment configured a simulated request "
                                + "error rate of " + intensity + "%.";

                impact =
                        "Some simulated requests may fail while the "
                                + "experiment is active. The configured "
                                + "percentage is not a measured production "
                                + "failure rate.";

                severity = intensity >= 75
                        ? "HIGH"
                        : intensity >= 40
                        ? "MEDIUM"
                        : "LOW";

                findings.add(
                        "Configured error rate: " + intensity + "%."
                );

                recommendations.add(
                        "Track simulated request failures and error codes."
                );

                recommendations.add(
                        "Use bounded retries for transient failures."
                );

                recommendations.add(
                        "Alert when observed error rates exceed a threshold."
                );
            }

            default -> throw new IllegalStateException(
                    "Unsupported failure type: " + failureType
            );
        }

        findings.add(
                "Experiment status at analysis time: "
                        + experiment.getStatus() + "."
        );

        findings.add(
                "Configured experiment duration: "
                        + experiment.getDurationSeconds()
                        + " seconds."
        );

        severity = enforceSeverityPolicy(
                severity,
                experiment
        );

        return new FailureAnalysis(
                experiment.getId(),
                service.getId(),
                service.getName(),
                failureType,
                experiment.getStatus().name(),
                summary,
                rootCause,
                impact,
                severity,
                findings,
                recommendations
        );
    }
}
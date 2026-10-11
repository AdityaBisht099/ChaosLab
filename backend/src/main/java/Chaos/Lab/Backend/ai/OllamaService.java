package Chaos.Lab.Backend.ai;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class OllamaService {

    private final RestClient restClient;

    public OllamaService() {
        this.restClient = RestClient.builder()
                .baseUrl("http://localhost:11434")
                .build();
    }

    public String generateAnalysis(String prompt) {

        Map<String, Object> requestBody = Map.of(
                "model", "qwen3:8b",
                "prompt", prompt,
                "stream", false,
                "think", false,
                "options", Map.of(
                        "temperature", 0.3,
                        "num_predict", 700
                )
        );

        Map<?, ?> response = restClient.post()
                .uri("/api/generate")
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null || response.get("response") == null) {
            throw new IllegalStateException(
                    "Ollama returned an empty response."
            );
        }

        return response.get("response").toString().trim();
    }
}
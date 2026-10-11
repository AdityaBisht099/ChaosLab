package Chaos.Lab.Backend.controller;

import Chaos.Lab.Backend.analysis.FailureAnalysisService;
import Chaos.Lab.Backend.model.FailureAnalysis;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analysis")
public class FailureAnalysisController {

    private final FailureAnalysisService analysisService;

    public FailureAnalysisController(
            FailureAnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @GetMapping("/{experimentId}")
    public ResponseEntity<?> analyzeExperiment(
            @PathVariable String experimentId) {

        try {
            FailureAnalysis analysis =
                    analysisService.analyzeExperiment(experimentId);

            return ResponseEntity.ok(analysis);

        } catch (IllegalArgumentException exception) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error",
                            exception.getMessage()
                    ));

        } catch (IllegalStateException exception) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "error",
                            exception.getMessage()
                    ));
        }
    }
}
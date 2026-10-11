package Chaos.Lab.Backend.controller;

import Chaos.Lab.Backend.engine.SimulationEngine;
import Chaos.Lab.Backend.model.Experiment;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ExperimentController {

    private final SimulationEngine simulationEngine;

    public ExperimentController(SimulationEngine simulationEngine) {
        this.simulationEngine = simulationEngine;
    }

    @GetMapping("/experiments")
    public Collection<Experiment> getAllExperiments() {
        return simulationEngine.getAllExperiments();
    }

    @GetMapping("/experiments/{id}")
    public Experiment getExperiment(@PathVariable String id) {
        Experiment experiment = simulationEngine.getExperiment(id);

        if (experiment == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Experiment not found: " + id
            );
        }

        return experiment;
    }

    @PostMapping("/experiments")
    public Experiment startExperiment(
            @RequestBody StartExperimentRequest request) {

        if (request == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Experiment configuration is required."
            );
        }

        if (request.targetServiceId() == null
                || request.failureType() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Target service and failure type are required."
            );
        }

        try {
            return simulationEngine.startExperiment(
                    request.targetServiceId(),
                    request.failureType(),
                    request.intensity(),
                    request.durationSeconds()
            );
        } catch (IllegalArgumentException exception) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    exception.getMessage()
            );
        } catch (IllegalStateException exception) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.CONFLICT,
                    exception.getMessage()
            );
        }
    }

    @PostMapping("/experiments/{id}/cancel")
    public Experiment cancelExperiment(@PathVariable String id) {
        try {
            return simulationEngine.cancelExperiment(id);
        } catch (IllegalArgumentException exception) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    exception.getMessage()
            );
        } catch (IllegalStateException exception) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.CONFLICT,
                    exception.getMessage()
            );
        }
    }

    @PostMapping("/simulation/reset")
    public Map<String, String> resetSimulation() {
        simulationEngine.resetSimulation();

        return Map.of(
                "status", "success",
                "message", "Simulation reset successfully."
        );
    }

    public record StartExperimentRequest(
            String targetServiceId,
            Experiment.FailureType failureType,
            int intensity,
            int durationSeconds
    ) {}
}
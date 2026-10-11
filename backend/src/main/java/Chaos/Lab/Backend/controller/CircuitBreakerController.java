package Chaos.Lab.Backend.controller;

import Chaos.Lab.Backend.engine.SimulationEngine;
import Chaos.Lab.Backend.model.CircuitBreaker;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;
import java.util.Map;

@RestController
@RequestMapping("/api/circuit-breakers")
public class CircuitBreakerController {

    private final SimulationEngine simulationEngine;

    public CircuitBreakerController(SimulationEngine simulationEngine) {
        this.simulationEngine = simulationEngine;
    }

    // Get all circuit breakers.
    @GetMapping
    public Collection<CircuitBreaker> getAll() {
        return simulationEngine.getAllCircuitBreakers();
    }

    // Get the circuit breaker for one service.
    @GetMapping("/{serviceId}")
    public CircuitBreaker getOne(@PathVariable String serviceId) {
        CircuitBreaker breaker =
                simulationEngine.getCircuitBreaker(serviceId);

        if (breaker == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Circuit breaker not found: " + serviceId
            );
        }

        return breaker;
    }

    // Simulate a request through the circuit breaker.
    @PostMapping("/{serviceId}/request")
    public Map<String, Object> simulateRequest(
            @PathVariable String serviceId) {

        try {
            boolean allowed =
                    simulationEngine.allowServiceRequest(serviceId);

            CircuitBreaker breaker =
                    simulationEngine.getCircuitBreaker(serviceId);

            return Map.of(
                    "serviceId", serviceId,
                    "allowed", allowed,
                    "state", breaker.getState(),
                    "message", allowed
                            ? "Simulated request succeeded."
                            : "Simulated request failed or was blocked."
            );

        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    exception.getMessage()
            );
        }
    }

    // Reset circuit breakers.
    @PostMapping("/reset")
    public Map<String, String> reset() {
        simulationEngine.resetCircuitBreakers();

        return Map.of(
                "status", "success",
                "message", "Circuit breakers reset."
        );
    }
}
package Chaos.Lab.Backend.controller;

import Chaos.Lab.Backend.engine.SimulationEngine;
import Chaos.Lab.Backend.model.ServiceNode;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    private final SimulationEngine simulationEngine;

    public ServiceController(SimulationEngine simulationEngine) {
        this.simulationEngine = simulationEngine;
    }

    @GetMapping
    public Collection<ServiceNode> getAllServices() {
        return simulationEngine.getAllServices();
    }

    @GetMapping("/{id}")
    public ServiceNode getService(@PathVariable String id) {
        ServiceNode service = simulationEngine.getService(id);

        if (service == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Service not found: " + id
            );
        }

        return service;
    }
}
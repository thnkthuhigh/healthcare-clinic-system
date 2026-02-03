package com.clinic.backend.modules.health;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {
  @GetMapping
  public Map<String, Object> health() {
    return Map.of("ok", true);
  }
}

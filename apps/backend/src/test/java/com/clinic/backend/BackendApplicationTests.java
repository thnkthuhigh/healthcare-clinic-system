package com.clinic.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.clinic.backend.modules.health.HealthController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = HealthController.class)
class BackendApplicationTests {
  @Autowired private MockMvc mockMvc;

  @Test
  void health_returnsOk() throws Exception {
    mockMvc
      .perform(get("/api/v1/health"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.ok").value(true));
  }
}

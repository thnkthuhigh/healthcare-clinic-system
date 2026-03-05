package com.clinic.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.clinic.backend.modules.health.HealthController;
import com.clinic.backend.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = HealthController.class)
@AutoConfigureMockMvc(addFilters = false)
class BackendApplicationTests {
  @Autowired private MockMvc mockMvc;

  @MockBean private JwtUtil jwtUtil;

  @Test
  void health_returnsOk() throws Exception {
    mockMvc
      .perform(get("/api/v1/health"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.ok").value(true));
  }
}

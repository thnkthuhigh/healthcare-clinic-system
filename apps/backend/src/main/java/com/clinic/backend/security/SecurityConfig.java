package com.clinic.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/health").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Customer booking browsing - public (no login required)
                .requestMatchers(HttpMethod.GET, "/api/customer/doctors").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/customer/doctors/*/shifts").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/customer/services").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/customer/bookings").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/customer/bookings/*/pay").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/customer/bookings/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/customer/patients/lookup").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/customer/patients/*/bookings").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/customer/bookings/*/cancel").permitAll()

                // OWNER has access to everything
                .requestMatchers("/api/**").hasAnyRole("OWNER", "ADMIN", "DOCTOR", "RECEPTIONIST", "CASHIER", "PATIENT")

                // Catch-all: must be authenticated
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

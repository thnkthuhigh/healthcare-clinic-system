package com.clinic.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

/**
 * CORS Configuration - Cho phép frontend gọi API backend.
 *
 * Dev:  http://localhost:3000 (Vite default)
 * Prod: Set biến CORS_ALLOWED_ORIGINS=https://yourdomain.com
 */
@Configuration
public class CorsConfig {

  @Value("${app.cors.allowed-origins:http://localhost:3000}")
  private String allowedOrigins;

  @Bean
  public FilterRegistrationBean<CorsFilter> corsFilterRegistration() {
    CorsConfiguration config = new CorsConfiguration();

    // Chỉ cho phép origins được cấu hình (không dùng "*")
    Arrays.stream(allowedOrigins.split(","))
        .map(String::trim)
        .forEach(config::addAllowedOrigin);

    // Chỉ cho phép methods cần thiết
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

    // Cho phép tất cả headers (Authorization, Content-Type, etc.)
    config.addAllowedHeader("*");

    // Cho phép gửi cookies/token
    config.setAllowCredentials(true);

    // Cache preflight 1 giờ - giảm số OPTIONS request
    config.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);

    // Đặt priority cao nhất - chạy trước mọi filter khác
    FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source));
    bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
    return bean;
  }
}

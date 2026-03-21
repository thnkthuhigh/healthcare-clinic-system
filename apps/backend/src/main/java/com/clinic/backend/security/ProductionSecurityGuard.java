package com.clinic.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class ProductionSecurityGuard implements ApplicationRunner {

    private static final String DEFAULT_JWT_SECRET = "hc-clinic-super-secret-key-must-be-at-least-64-bytes-long-for-hs512!!";
    private static final String DEFAULT_OWNER_PASSWORD = "owner123";

    private final Environment environment;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.owner.password}")
    private String ownerPassword;

    public ProductionSecurityGuard(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!isProduction()) {
            return;
        }

        if (jwtSecret == null || jwtSecret.isBlank() || DEFAULT_JWT_SECRET.equals(jwtSecret)) {
            throw new IllegalStateException("Production requires non-default app.jwt.secret");
        }

        if (ownerPassword == null || ownerPassword.isBlank() || DEFAULT_OWNER_PASSWORD.equals(ownerPassword)) {
            throw new IllegalStateException("Production requires non-default app.owner.password");
        }
    }

    private boolean isProduction() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> "prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile));
    }
}

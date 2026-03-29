package com.clinic.backend.security;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TotpServiceTest {

    private final TotpService totpService = new TotpService("Clinic");

    @Test
    void generateSecretProducesBase32Key() {
        String secret = totpService.generateSecret();

        assertNotNull(secret);
        assertTrue(secret.matches("[A-Z2-7]+"));
        assertTrue(secret.length() >= 32);
    }

    @Test
    void verifyCodeAcceptsCurrentAndAdjacentWindow() {
        String secret = totpService.generateSecret();
        Instant now = Instant.parse("2026-03-29T10:15:30Z");
        String currentCode = totpService.generateCurrentCode(secret, now);

        assertTrue(totpService.verifyCode(secret, currentCode, now));
        assertTrue(totpService.verifyCode(secret, currentCode, now.plusSeconds(25)));
        assertFalse(totpService.verifyCode(secret, currentCode, now.plusSeconds(95)));
    }
}

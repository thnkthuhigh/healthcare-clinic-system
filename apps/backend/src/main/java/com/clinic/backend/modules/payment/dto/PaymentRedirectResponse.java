package com.clinic.backend.modules.payment.dto;

import java.time.Instant;

public record PaymentRedirectResponse(
        String gateway,
        String paymentUrl,
        Instant expiresAt
) {}

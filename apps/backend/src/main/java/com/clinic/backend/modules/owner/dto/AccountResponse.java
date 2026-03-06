package com.clinic.backend.modules.owner.dto;

import java.time.Instant;

public record AccountResponse(
    String id,
    String fullName,
    String phone,
    String role,
    String status,
    String specialty,
    Instant createdAt
) {}

package com.clinic.backend.modules.customer.dto;

import java.util.UUID;

public record DoctorSummaryDto(
    UUID id,
    String displayName,
    String specialty,
    String avatarUrl,
    Double averageStars
) {}

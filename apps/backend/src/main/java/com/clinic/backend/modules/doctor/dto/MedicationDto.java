package com.clinic.backend.modules.doctor.dto;

import java.util.UUID;

public record MedicationDto(
    UUID id,
    String name,
    String unit,
    String usage,
    String defaultDose,
    Integer priceCents,
    Integer availableStock
) {}

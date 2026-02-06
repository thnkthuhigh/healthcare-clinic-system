package com.clinic.backend.modules.doctor.dto;

import java.util.UUID;

public record PrescriptionItemDto(
    UUID id,
    UUID medicationId,
    String medicationName,
    String unit,
    Integer qty,
    String dosage,
    String note,
    Integer unitPriceCents,
    Integer totalCents
) {}

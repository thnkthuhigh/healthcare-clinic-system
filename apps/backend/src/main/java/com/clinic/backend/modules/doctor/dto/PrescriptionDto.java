package com.clinic.backend.modules.doctor.dto;

import com.clinic.backend.modules.doctor.entity.Prescription;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PrescriptionDto(
    UUID id,
    UUID bookingId,
    Prescription.PrescriptionStatus status,
    List<PrescriptionItemDto> items,
    Integer totalCents,
    Instant createdAt
) {}

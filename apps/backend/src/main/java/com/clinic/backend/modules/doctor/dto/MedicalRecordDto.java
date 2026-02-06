package com.clinic.backend.modules.doctor.dto;

import java.time.Instant;
import java.util.UUID;

public record MedicalRecordDto(
    UUID id,
    UUID bookingId,
    UUID patientId,
    String patientName,
    UUID doctorId,
    String doctorName,
    String symptoms,
    String diagnosis,
    String conclusion,
    String notes,
    String serviceName,
    Instant createdAt,
    Instant updatedAt
) {}

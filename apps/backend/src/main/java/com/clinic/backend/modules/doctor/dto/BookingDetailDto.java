package com.clinic.backend.modules.doctor.dto;

import java.time.Instant;
import java.util.UUID;

public record BookingDetailDto(
    UUID id,
    Integer queueNumber,
    PatientDto patient,
    ShiftDto shift,
    DoctorDto doctor,
    String serviceName,
    String status,
    String channel,
    String paymentStatus,
    Instant checkInAt,
    Instant startedAt,
    Instant completedAt,
    MedicalRecordDto medicalRecord,
    PrescriptionDto prescription
) {}

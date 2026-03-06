package com.clinic.backend.modules.customer.dto;

import com.clinic.backend.modules.doctor.dto.MedicalRecordDto;
import com.clinic.backend.modules.doctor.dto.PrescriptionDto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PatientBookingDto(
    UUID bookingId,
    Integer queueNumber,
    LocalDate date,
    String shiftType,
    String timeRange,
    String doctorName,
    String specialty,
    String serviceName,
    String status,
    String paymentStatus,
    Instant createdAt,
    MedicalRecordDto medicalRecord,
    PrescriptionDto prescription,
    Integer ratingStars,
    String ratingComment
) {}

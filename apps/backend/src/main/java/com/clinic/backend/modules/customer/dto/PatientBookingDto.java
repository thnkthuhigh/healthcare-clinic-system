package com.clinic.backend.modules.customer.dto;

import com.clinic.backend.modules.doctor.dto.MedicalRecordDto;
import com.clinic.backend.modules.doctor.dto.PrescriptionDto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PatientBookingDto(
    UUID bookingId,
    Integer queueNumber,
    Integer slotSequence,
    LocalDate date,
    String shiftType,
    String timeRange,
    String doctorName,
    String specialty,
    String serviceName,
    String status,
    String paymentStatus,
    Integer servicePriceCents,
    Integer labFeeCents,
    Integer prescriptionAmountCents,
    Integer totalBillCents,
    Integer bookingFeeCents,
    Boolean bookingFeePaid,
    Instant bookingFeePaidAt,
    String bookingFeePaymentMethod,
    Boolean followUp,
    UUID followUpSourceBookingId,
    Instant followUpScheduledAt,
    String followUpNote,
    Instant createdAt,
    Instant appointmentTime,
    Instant checkInAt,
    Instant completedAt,
    Integer currentServingQueueNumber,
    Instant estimatedTurnAt,
    MedicalRecordDto medicalRecord,
    PrescriptionDto prescription,
    Integer ratingStars,
    String ratingComment
) {}

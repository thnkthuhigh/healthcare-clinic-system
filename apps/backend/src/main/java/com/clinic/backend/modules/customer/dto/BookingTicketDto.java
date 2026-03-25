package com.clinic.backend.modules.customer.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record BookingTicketDto(
    UUID bookingId,
    Integer queueNumber,
    Integer slotSequence,
    String patientName,
    String patientPhone,
    String doctorName,
    String specialty,
    LocalDate date,
    String shiftType,
    String timeRange,
    String serviceName,
    String status,
    String paymentStatus,
    Instant createdAt,
    Instant appointmentTime,
    Integer currentServingQueueNumber,
    Instant estimatedTurnAt,
    Integer bookingFeeCents,
    Boolean bookingFeePaid,
    Instant bookingFeePaidAt,
    String bookingFeePaymentMethod
) {}

package com.clinic.backend.modules.customer.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record BookingTicketDto(
    UUID bookingId,
    Integer queueNumber,
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
    Instant createdAt
) {}

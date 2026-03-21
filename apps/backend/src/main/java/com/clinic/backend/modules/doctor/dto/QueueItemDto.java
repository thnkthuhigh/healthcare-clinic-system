package com.clinic.backend.modules.doctor.dto;

import com.clinic.backend.modules.doctor.entity.Booking;
import java.time.Instant;
import java.util.UUID;

public record QueueItemDto(
    UUID id,
    Integer queueNumber,
    Instant appointmentTime,
    Integer slotSequence,
    PatientDto patient,
    String serviceName,
    Booking.BookingStatus status,
    Booking.BookingChannel channel,
    Instant checkInAt,
    Integer priorityScore,
    Integer skipCount
) {}

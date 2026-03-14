package com.clinic.backend.modules.doctor.dto;

import com.clinic.backend.modules.doctor.entity.Booking;
import com.clinic.backend.modules.doctor.entity.Slot;

import java.time.Instant;
import java.util.UUID;

public record ScheduleBookingDto(
        UUID id,
        Integer queueNumber,
        Instant appointmentTime,
        Integer slotSequence,
        Slot.SlotPool slotPool,
        PatientDto patient,
        String serviceName,
        Booking.BookingStatus status,
        Booking.BookingChannel channel,
        Instant checkInAt) {
}

package com.clinic.backend.modules.doctor.dto;

import com.clinic.backend.modules.doctor.entity.Shift;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ScheduleShiftDto(
        UUID id,
        LocalDate date,
        Shift.ShiftType type,
        Instant startTime,
        Instant endTime,
        String timeRange,
        Shift.ShiftStatus status,
        long totalPatients,
        long bookedCount,
        long waitingCount,
        long checkedInCount,
        long inConsultationCount,
        long completedCount,
        List<ScheduleBookingDto> bookings) {
}

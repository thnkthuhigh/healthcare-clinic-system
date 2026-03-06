package com.clinic.backend.modules.customer.dto;

import com.clinic.backend.modules.doctor.entity.Shift;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AvailableShiftDto(
    UUID id,
    LocalDate date,
    Shift.ShiftType type,
    Instant startTime,
    Instant endTime,
    String timeRange,
    Shift.ShiftStatus status,
    long availableSlots,
    boolean isFull
) {}

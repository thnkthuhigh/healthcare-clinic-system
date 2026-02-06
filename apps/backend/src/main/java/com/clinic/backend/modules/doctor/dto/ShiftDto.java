package com.clinic.backend.modules.doctor.dto;

import com.clinic.backend.modules.doctor.entity.Shift;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ShiftDto(
    UUID id,
    LocalDate date,
    Shift.ShiftType type,
    Instant startTime,
    Instant endTime,
    String timeRange,
    Shift.ShiftStatus status,
    // Statistics
    long totalPatients,
    long waitingCount,
    long checkedInCount,
    long inConsultationCount,
    long completedCount
) {}

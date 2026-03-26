package com.clinic.backend.modules.doctor.dto;

import java.time.LocalDate;
import java.util.UUID;

public record FollowUpBookingDto(
        UUID bookingId,
        UUID sourceBookingId,
        LocalDate date,
        String shiftType,
        String timeRange,
        String doctorName,
        String serviceName,
        String status,
        String note
) {
}

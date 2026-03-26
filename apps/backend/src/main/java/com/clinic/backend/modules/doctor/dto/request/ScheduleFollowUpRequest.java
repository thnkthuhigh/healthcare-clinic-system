package com.clinic.backend.modules.doctor.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ScheduleFollowUpRequest(
        @NotNull(message = "Ngày tái khám là bắt buộc")
        @FutureOrPresent(message = "Ngày tái khám không hợp lệ")
        LocalDate followUpDate,
        String note) {
}

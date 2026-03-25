package com.clinic.backend.modules.doctor.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CompleteLabResultRequest(
        @NotBlank(message = "Kết quả xét nghiệm là bắt buộc")
        String resultSummary,
        String impression) {
}

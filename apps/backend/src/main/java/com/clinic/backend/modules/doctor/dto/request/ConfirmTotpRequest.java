package com.clinic.backend.modules.doctor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ConfirmTotpRequest(
        @NotBlank(message = "Ma xac thuc la bat buoc")
        @Pattern(regexp = "\\d{6}", message = "Ma xac thuc phai gom 6 chu so")
        String code
) {
}

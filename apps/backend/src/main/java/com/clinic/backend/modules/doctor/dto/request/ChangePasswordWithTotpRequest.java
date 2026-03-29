package com.clinic.backend.modules.doctor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordWithTotpRequest(
        @NotBlank(message = "Mat khau hien tai la bat buoc")
        String currentPassword,

        @NotBlank(message = "Mat khau moi la bat buoc")
        @Size(min = 6, message = "Mat khau moi phai co it nhat 6 ky tu")
        String newPassword,

        @NotBlank(message = "Ma xac thuc la bat buoc")
        @Pattern(regexp = "\\d{6}", message = "Ma xac thuc phai gom 6 chu so")
        String code
) {
}

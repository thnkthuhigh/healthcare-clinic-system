package com.clinic.backend.modules.owner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateAccountRequest(
    @NotBlank(message = "Họ tên không được trống")
    String fullName,

    @NotBlank(message = "Số điện thoại không được trống")
    @Pattern(regexp = "^0[0-9]{9}$", message = "Số điện thoại không hợp lệ")
    String phone,

    @NotBlank(message = "Mật khẩu không được trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    String password,

    @NotNull(message = "Vai trò không được trống")
    Role role,

    // Only for DOCTOR role
    String specialty
) {
    public enum Role {
        ADMIN, DOCTOR, RECEPTIONIST, CASHIER
    }
}

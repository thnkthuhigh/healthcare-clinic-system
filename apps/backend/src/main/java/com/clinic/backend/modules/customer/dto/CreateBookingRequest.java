package com.clinic.backend.modules.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateBookingRequest(
    @NotNull UUID shiftId,
    UUID serviceId,
    @NotBlank String fullName,
    @NotBlank String phone,
    String nationalId,
    LocalDate dateOfBirth,
    String gender,
    String notes
) {}

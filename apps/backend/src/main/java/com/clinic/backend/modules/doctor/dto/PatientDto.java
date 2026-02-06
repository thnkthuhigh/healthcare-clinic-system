package com.clinic.backend.modules.doctor.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PatientDto(
    UUID id,
    String fullName,
    String phone,
    String nationalId,
    LocalDate dateOfBirth,
    Integer age,
    String gender,
    BigDecimal weightKg,
    BigDecimal heightCm,
    String allergies,
    String address
) {}

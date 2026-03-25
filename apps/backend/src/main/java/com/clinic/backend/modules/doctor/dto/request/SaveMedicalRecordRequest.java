package com.clinic.backend.modules.doctor.dto.request;

import java.math.BigDecimal;

public record SaveMedicalRecordRequest(
    String symptoms,
    String diagnosis,
    String conclusion,
    String notes,
    BigDecimal weightKg,
    BigDecimal heightCm
) {}

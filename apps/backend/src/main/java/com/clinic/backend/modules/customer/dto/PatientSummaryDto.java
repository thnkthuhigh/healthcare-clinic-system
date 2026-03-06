package com.clinic.backend.modules.customer.dto;

import java.util.UUID;

public record PatientSummaryDto(
    UUID id,
    String fullName,
    String phone,
    String nationalId
) {}

package com.clinic.backend.modules.doctor.dto.request;

public record SaveMedicalRecordRequest(
    String symptoms,
    String diagnosis,
    String conclusion,
    String notes
) {}

package com.clinic.backend.modules.doctor.dto;

public record DoctorTotpStatusDto(
        boolean configured,
        boolean confirmed,
        String issuer,
        String accountName
) {
}

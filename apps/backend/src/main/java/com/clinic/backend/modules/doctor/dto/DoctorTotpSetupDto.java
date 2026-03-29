package com.clinic.backend.modules.doctor.dto;

public record DoctorTotpSetupDto(
        String secret,
        String manualEntryKey,
        String otpAuthUri,
        boolean confirmed,
        String issuer,
        String accountName
) {
}

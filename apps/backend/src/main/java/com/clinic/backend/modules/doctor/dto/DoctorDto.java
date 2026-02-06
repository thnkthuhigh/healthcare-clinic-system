package com.clinic.backend.modules.doctor.dto;

import java.util.UUID;

public record DoctorDto(
    UUID id,
    String displayName,
    String specialty,
    String avatarUrl,
    String phone
) {}

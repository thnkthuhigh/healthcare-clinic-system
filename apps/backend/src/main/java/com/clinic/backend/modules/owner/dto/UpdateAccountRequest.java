package com.clinic.backend.modules.owner.dto;

public record UpdateAccountRequest(
    String fullName,
    String specialty
) {}

package com.clinic.backend.modules.doctor.dto;

import java.util.List;
import java.util.UUID;

public record PrescriptionTemplateDto(
        UUID id,
        String name,
        String note,
        List<ItemDto> items) {

    public record ItemDto(
            UUID medicationId,
            String medicationName,
            String unit,
            int qty,
            String dosage,
            String note,
            int priceCents) {
    }
}

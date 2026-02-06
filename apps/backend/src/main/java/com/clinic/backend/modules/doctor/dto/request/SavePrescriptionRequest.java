package com.clinic.backend.modules.doctor.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record SavePrescriptionRequest(
    List<PrescriptionItemRequest> items
) {
    public record PrescriptionItemRequest(
        @NotNull(message = "Medication ID is required")
        UUID medicationId,
        
        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        Integer qty,
        
        String dosage,
        String note
    ) {}
}

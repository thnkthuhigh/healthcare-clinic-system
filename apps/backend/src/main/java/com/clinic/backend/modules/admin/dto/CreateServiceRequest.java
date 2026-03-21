package com.clinic.backend.modules.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class CreateServiceRequest {

    @NotBlank
    private String name;

    @Min(0)
    private int priceCents;

    private String specialtyId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getPriceCents() { return priceCents; }
    public void setPriceCents(int priceCents) { this.priceCents = priceCents; }

    public String getSpecialtyId() {
        return specialtyId;
    }

    public void setSpecialtyId(String specialtyId) {
        this.specialtyId = specialtyId;
    }
}

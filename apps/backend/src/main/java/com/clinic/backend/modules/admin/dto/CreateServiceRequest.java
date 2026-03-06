package com.clinic.backend.modules.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class CreateServiceRequest {

    @NotBlank
    private String name;

    @Min(1)
    private int durationMin;

    @Min(0)
    private int priceCents;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getDurationMin() { return durationMin; }
    public void setDurationMin(int durationMin) { this.durationMin = durationMin; }

    public int getPriceCents() { return priceCents; }
    public void setPriceCents(int priceCents) { this.priceCents = priceCents; }
}

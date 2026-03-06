package com.clinic.backend.modules.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class CreateMedicationRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String unit;

    private String usage;
    private String defaultDose;

    @Min(0)
    private int priceCents;

    @Min(0)
    private int initialStock = 0;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getUsage() { return usage; }
    public void setUsage(String usage) { this.usage = usage; }

    public String getDefaultDose() { return defaultDose; }
    public void setDefaultDose(String defaultDose) { this.defaultDose = defaultDose; }

    public int getPriceCents() { return priceCents; }
    public void setPriceCents(int priceCents) { this.priceCents = priceCents; }

    public int getInitialStock() { return initialStock; }
    public void setInitialStock(int initialStock) { this.initialStock = initialStock; }
}

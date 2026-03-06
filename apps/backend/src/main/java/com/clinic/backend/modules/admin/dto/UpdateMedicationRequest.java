package com.clinic.backend.modules.admin.dto;

public class UpdateMedicationRequest {

    private String name;
    private String unit;
    private String usage;
    private String defaultDose;
    private Integer priceCents;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getUsage() { return usage; }
    public void setUsage(String usage) { this.usage = usage; }

    public String getDefaultDose() { return defaultDose; }
    public void setDefaultDose(String defaultDose) { this.defaultDose = defaultDose; }

    public Integer getPriceCents() { return priceCents; }
    public void setPriceCents(Integer priceCents) { this.priceCents = priceCents; }
}

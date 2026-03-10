package com.clinic.backend.modules.admin.dto;

public class UpdateServiceRequest {

    private String name;
    private Integer durationMin;
    private Integer priceCents;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getDurationMin() { return durationMin; }
    public void setDurationMin(Integer durationMin) { this.durationMin = durationMin; }

    public Integer getPriceCents() { return priceCents; }
    public void setPriceCents(Integer priceCents) { this.priceCents = priceCents; }
}

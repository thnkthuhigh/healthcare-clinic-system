package com.clinic.backend.modules.admin.dto;

public class UpdateServiceRequest {

    private String name;
    private Integer priceCents;
    private String specialtyId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getPriceCents() { return priceCents; }
    public void setPriceCents(Integer priceCents) { this.priceCents = priceCents; }

    public String getSpecialtyId() {
        return specialtyId;
    }

    public void setSpecialtyId(String specialtyId) {
        this.specialtyId = specialtyId;
    }
}

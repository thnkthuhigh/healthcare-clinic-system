package com.clinic.backend.modules.admin.dto;

public class AdminServiceDto {

    private String id;
    private String name;
    private int durationMin;
    private int priceCents;
    private boolean isActive;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getDurationMin() { return durationMin; }
    public void setDurationMin(int durationMin) { this.durationMin = durationMin; }

    public int getPriceCents() { return priceCents; }
    public void setPriceCents(int priceCents) { this.priceCents = priceCents; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}

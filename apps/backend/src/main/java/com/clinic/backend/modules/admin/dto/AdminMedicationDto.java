package com.clinic.backend.modules.admin.dto;

public class AdminMedicationDto {

    private String id;
    private String name;
    private String unit;
    private String usage;
    private String defaultDose;
    private int priceCents;
    private int stockReal;
    private int stockHold;
    private int availableStock;
    private boolean isActive;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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

    public int getStockReal() { return stockReal; }
    public void setStockReal(int stockReal) { this.stockReal = stockReal; }

    public int getStockHold() { return stockHold; }
    public void setStockHold(int stockHold) { this.stockHold = stockHold; }

    public int getAvailableStock() { return availableStock; }
    public void setAvailableStock(int availableStock) { this.availableStock = availableStock; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}

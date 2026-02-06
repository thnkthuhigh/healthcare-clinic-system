package com.clinic.backend.modules.doctor.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "medications")
public class Medication {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    @Column(nullable = false)
    private String unit;
    
    @Column(name = "usage")
    private String usage;
    
    @Column(name = "default_dose")
    private String defaultDose;
    
    @Column(name = "price_cents", nullable = false)
    private Integer priceCents;
    
    @Column(name = "stock_real", nullable = false)
    private Integer stockReal = 0;
    
    @Column(name = "stock_hold", nullable = false)
    private Integer stockHold = 0;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
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
    
    public Integer getStockReal() { return stockReal; }
    public void setStockReal(Integer stockReal) { this.stockReal = stockReal; }
    
    public Integer getStockHold() { return stockHold; }
    public void setStockHold(Integer stockHold) { this.stockHold = stockHold; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    // Available stock = real - hold
    public Integer getAvailableStock() {
        return stockReal - stockHold;
    }
}

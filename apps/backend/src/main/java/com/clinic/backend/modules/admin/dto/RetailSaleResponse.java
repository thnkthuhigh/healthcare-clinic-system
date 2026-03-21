package com.clinic.backend.modules.admin.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class RetailSaleResponse {

    private String invoiceCode;
    private String customerName;
    private String customerPhone;
    private long totalCents;
    private Instant createdAt;
    private List<RetailSaleItemDto> items;

    public String getInvoiceCode() {
        return invoiceCode;
    }

    public void setInvoiceCode(String invoiceCode) {
        this.invoiceCode = invoiceCode;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public long getTotalCents() {
        return totalCents;
    }

    public void setTotalCents(long totalCents) {
        this.totalCents = totalCents;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public List<RetailSaleItemDto> getItems() {
        return items;
    }

    public void setItems(List<RetailSaleItemDto> items) {
        this.items = items;
    }

    public static class RetailSaleItemDto {
        private UUID medicationId;
        private String medicationName;
        private String unit;
        private int qty;
        private int unitPriceCents;
        private int lineTotalCents;

        public UUID getMedicationId() {
            return medicationId;
        }

        public void setMedicationId(UUID medicationId) {
            this.medicationId = medicationId;
        }

        public String getMedicationName() {
            return medicationName;
        }

        public void setMedicationName(String medicationName) {
            this.medicationName = medicationName;
        }

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
        }

        public int getQty() {
            return qty;
        }

        public void setQty(int qty) {
            this.qty = qty;
        }

        public int getUnitPriceCents() {
            return unitPriceCents;
        }

        public void setUnitPriceCents(int unitPriceCents) {
            this.unitPriceCents = unitPriceCents;
        }

        public int getLineTotalCents() {
            return lineTotalCents;
        }

        public void setLineTotalCents(int lineTotalCents) {
            this.lineTotalCents = lineTotalCents;
        }
    }
}


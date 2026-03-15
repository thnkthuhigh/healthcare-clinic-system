package com.clinic.backend.modules.admin.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public class RetailSaleRequest {

    private String customerName;
    private String customerPhone;

    @Valid
    @NotEmpty
    @NotNull
    private List<RetailSaleItemRequest> items;

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

    public List<RetailSaleItemRequest> getItems() {
        return items;
    }

    public void setItems(List<RetailSaleItemRequest> items) {
        this.items = items;
    }

    public static class RetailSaleItemRequest {
        @NotNull
        private UUID medicationId;

        @NotNull
        @Min(1)
        private Integer qty;

        public UUID getMedicationId() {
            return medicationId;
        }

        public void setMedicationId(UUID medicationId) {
            this.medicationId = medicationId;
        }

        public Integer getQty() {
            return qty;
        }

        public void setQty(Integer qty) {
            this.qty = qty;
        }
    }
}

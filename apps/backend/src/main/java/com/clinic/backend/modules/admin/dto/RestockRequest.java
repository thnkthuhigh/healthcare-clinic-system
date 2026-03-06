package com.clinic.backend.modules.admin.dto;

import jakarta.validation.constraints.Min;

public class RestockRequest {

    @Min(1)
    private int qty;

    public int getQty() { return qty; }
    public void setQty(int qty) { this.qty = qty; }
}

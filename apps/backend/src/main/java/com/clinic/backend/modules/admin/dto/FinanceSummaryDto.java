package com.clinic.backend.modules.admin.dto;

public class FinanceSummaryDto {

    private long totalIncomeCents;
    private long totalExpenseCents;
    private long balanceCents;

    public long getTotalIncomeCents() {
        return totalIncomeCents;
    }

    public void setTotalIncomeCents(long totalIncomeCents) {
        this.totalIncomeCents = totalIncomeCents;
    }

    public long getTotalExpenseCents() {
        return totalExpenseCents;
    }

    public void setTotalExpenseCents(long totalExpenseCents) {
        this.totalExpenseCents = totalExpenseCents;
    }

    public long getBalanceCents() {
        return balanceCents;
    }

    public void setBalanceCents(long balanceCents) {
        this.balanceCents = balanceCents;
    }
}


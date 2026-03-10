package com.clinic.backend.modules.admin.dto;

/**
 * DTO for report summary — consultation stats, revenue, channel breakdown.
 */
public class ReportSummaryDto {

    private long totalBookings;
    private long completedBookings;
    private long canceledBookings;
    private long noShowBookings;
    private long webBookings;
    private long walkInBookings;
    private long paidBookings;
    private long unpaidBookings;
    private long totalRevenueCents;
    private long serviceRevenueCents;
    private long prescriptionRevenueCents;
    private long overrideCount;

    // Getters and Setters
    public long getTotalBookings() { return totalBookings; }
    public void setTotalBookings(long totalBookings) { this.totalBookings = totalBookings; }

    public long getCompletedBookings() { return completedBookings; }
    public void setCompletedBookings(long completedBookings) { this.completedBookings = completedBookings; }

    public long getCanceledBookings() { return canceledBookings; }
    public void setCanceledBookings(long canceledBookings) { this.canceledBookings = canceledBookings; }

    public long getNoShowBookings() { return noShowBookings; }
    public void setNoShowBookings(long noShowBookings) { this.noShowBookings = noShowBookings; }

    public long getWebBookings() { return webBookings; }
    public void setWebBookings(long webBookings) { this.webBookings = webBookings; }

    public long getWalkInBookings() { return walkInBookings; }
    public void setWalkInBookings(long walkInBookings) { this.walkInBookings = walkInBookings; }

    public long getPaidBookings() { return paidBookings; }
    public void setPaidBookings(long paidBookings) { this.paidBookings = paidBookings; }

    public long getUnpaidBookings() { return unpaidBookings; }
    public void setUnpaidBookings(long unpaidBookings) { this.unpaidBookings = unpaidBookings; }

    public long getTotalRevenueCents() { return totalRevenueCents; }
    public void setTotalRevenueCents(long totalRevenueCents) { this.totalRevenueCents = totalRevenueCents; }

    public long getServiceRevenueCents() { return serviceRevenueCents; }
    public void setServiceRevenueCents(long serviceRevenueCents) { this.serviceRevenueCents = serviceRevenueCents; }

    public long getPrescriptionRevenueCents() { return prescriptionRevenueCents; }
    public void setPrescriptionRevenueCents(long prescriptionRevenueCents) { this.prescriptionRevenueCents = prescriptionRevenueCents; }

    public long getOverrideCount() { return overrideCount; }
    public void setOverrideCount(long overrideCount) { this.overrideCount = overrideCount; }
}

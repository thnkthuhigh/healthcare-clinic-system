package com.clinic.backend.modules.admin.dto;

public class DashboardStatsResponse {
    private long todayPatients;
    private long waitingCount;
    private long inConsultationCount;
    private long completedCount;
    private long unpaidCount;
    private long revenue;
    private long webBookings;
    private long walkInBookings;

    public DashboardStatsResponse() {}

    public DashboardStatsResponse(long todayPatients, long waitingCount, long inConsultationCount,
                                   long completedCount, long unpaidCount, long revenue,
                                   long webBookings, long walkInBookings) {
        this.todayPatients = todayPatients;
        this.waitingCount = waitingCount;
        this.inConsultationCount = inConsultationCount;
        this.completedCount = completedCount;
        this.unpaidCount = unpaidCount;
        this.revenue = revenue;
        this.webBookings = webBookings;
        this.walkInBookings = walkInBookings;
    }

    public long getTodayPatients() { return todayPatients; }
    public void setTodayPatients(long todayPatients) { this.todayPatients = todayPatients; }

    public long getWaitingCount() { return waitingCount; }
    public void setWaitingCount(long waitingCount) { this.waitingCount = waitingCount; }

    public long getInConsultationCount() { return inConsultationCount; }
    public void setInConsultationCount(long inConsultationCount) { this.inConsultationCount = inConsultationCount; }

    public long getCompletedCount() { return completedCount; }
    public void setCompletedCount(long completedCount) { this.completedCount = completedCount; }

    public long getUnpaidCount() { return unpaidCount; }
    public void setUnpaidCount(long unpaidCount) { this.unpaidCount = unpaidCount; }

    public long getRevenue() { return revenue; }
    public void setRevenue(long revenue) { this.revenue = revenue; }

    public long getWebBookings() { return webBookings; }
    public void setWebBookings(long webBookings) { this.webBookings = webBookings; }

    public long getWalkInBookings() { return walkInBookings; }
    public void setWalkInBookings(long walkInBookings) { this.walkInBookings = walkInBookings; }
}

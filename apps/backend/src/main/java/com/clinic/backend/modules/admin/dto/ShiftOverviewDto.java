package com.clinic.backend.modules.admin.dto;

public class ShiftOverviewDto {
    private String id;
    private String doctorName;
    private String date;
    private String type;
    private String startTime;
    private String endTime;
    private int totalSlots;
    private int bookedSlots;
    private int commonAvailable;
    private int reserveAvailable;
    private String status;

    public ShiftOverviewDto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public int getTotalSlots() { return totalSlots; }
    public void setTotalSlots(int totalSlots) { this.totalSlots = totalSlots; }

    public int getBookedSlots() { return bookedSlots; }
    public void setBookedSlots(int bookedSlots) { this.bookedSlots = bookedSlots; }

    public int getCommonAvailable() { return commonAvailable; }
    public void setCommonAvailable(int commonAvailable) { this.commonAvailable = commonAvailable; }

    public int getReserveAvailable() { return reserveAvailable; }
    public void setReserveAvailable(int reserveAvailable) { this.reserveAvailable = reserveAvailable; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

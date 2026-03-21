package com.clinic.backend.modules.admin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class CreateVisitResponse {

    private String bookingId;
    private String patientId;
    private String patientName;
    private int queueNumber;
    private String doctorName;
    private String roomName;
    private String shiftType;
    private boolean isOverride;
    private String poolUsed;
    private boolean isNewPatient;

    public String getBookingId() {
        return bookingId;
    }

    public void setBookingId(String bookingId) {
        this.bookingId = bookingId;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public int getQueueNumber() {
        return queueNumber;
    }

    public void setQueueNumber(int queueNumber) {
        this.queueNumber = queueNumber;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public String getShiftType() {
        return shiftType;
    }

    public void setShiftType(String shiftType) {
        this.shiftType = shiftType;
    }

    @JsonProperty("isOverride")
    public boolean isOverride() {
        return isOverride;
    }

    public void setOverride(boolean override) {
        isOverride = override;
    }

    public String getPoolUsed() {
        return poolUsed;
    }

    public void setPoolUsed(String poolUsed) {
        this.poolUsed = poolUsed;
    }

    @JsonProperty("isNewPatient")
    public boolean isNewPatient() {
        return isNewPatient;
    }

    public void setNewPatient(boolean newPatient) {
        isNewPatient = newPatient;
    }
}

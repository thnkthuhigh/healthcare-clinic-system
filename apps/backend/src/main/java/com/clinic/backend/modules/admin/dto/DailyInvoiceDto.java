package com.clinic.backend.modules.admin.dto;

import java.time.Instant;
import java.util.UUID;

public class DailyInvoiceDto {

    private UUID bookingId;
    private Integer queueNumber;
    private String patientName;
    private String patientPhone;
    private String doctorName;
    private String serviceName;
    private String roomName;
    private String shiftType;
    private String channel;
    private String status;
    private String paymentStatus;
    private Instant invoiceAt;
    private long serviceAmountCents;
    private long medicationAmountCents;
    private long totalAmountCents;

    public UUID getBookingId() {
        return bookingId;
    }

    public void setBookingId(UUID bookingId) {
        this.bookingId = bookingId;
    }

    public Integer getQueueNumber() {
        return queueNumber;
    }

    public void setQueueNumber(Integer queueNumber) {
        this.queueNumber = queueNumber;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public String getPatientPhone() {
        return patientPhone;
    }

    public void setPatientPhone(String patientPhone) {
        this.patientPhone = patientPhone;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
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

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public Instant getInvoiceAt() {
        return invoiceAt;
    }

    public void setInvoiceAt(Instant invoiceAt) {
        this.invoiceAt = invoiceAt;
    }

    public long getServiceAmountCents() {
        return serviceAmountCents;
    }

    public void setServiceAmountCents(long serviceAmountCents) {
        this.serviceAmountCents = serviceAmountCents;
    }

    public long getMedicationAmountCents() {
        return medicationAmountCents;
    }

    public void setMedicationAmountCents(long medicationAmountCents) {
        this.medicationAmountCents = medicationAmountCents;
    }

    public long getTotalAmountCents() {
        return totalAmountCents;
    }

    public void setTotalAmountCents(long totalAmountCents) {
        this.totalAmountCents = totalAmountCents;
    }
}

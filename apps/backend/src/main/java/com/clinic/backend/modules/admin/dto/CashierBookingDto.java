package com.clinic.backend.modules.admin.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO for cashier view — COMPLETED bookings with prescription + bill breakdown.
 */
public class CashierBookingDto {

    private UUID bookingId;
    private Integer queueNumber;
    private String patientName;
    private String patientPhone;
    private String doctorName;
    private String serviceName;
    private Integer servicePriceCents;
    private Integer labFeeCents;
    private String status;
    private String channel;
    private String paymentStatus;
    private Instant completedAt;
    private String paymentMethod;
    private Instant paidAt;
    private UUID billedByUserId;
    private String billedByName;
    private Integer bookingFeeCents;
    private Instant bookingFeePaidAt;
    private String bookingFeePaymentMethod;

    // Prescription info
    private UUID prescriptionId;
    private String prescriptionStatus;
    private List<PrescriptionItemDto> prescriptionItems;
    private Integer prescriptionTotalCents;

    // Bill breakdown
    private Integer totalBillCents;

    // Getters and Setters
    public UUID getBookingId() { return bookingId; }
    public void setBookingId(UUID bookingId) { this.bookingId = bookingId; }

    public Integer getQueueNumber() { return queueNumber; }
    public void setQueueNumber(Integer queueNumber) { this.queueNumber = queueNumber; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public Integer getServicePriceCents() { return servicePriceCents; }
    public void setServicePriceCents(Integer servicePriceCents) { this.servicePriceCents = servicePriceCents; }

    public Integer getLabFeeCents() { return labFeeCents; }
    public void setLabFeeCents(Integer labFeeCents) { this.labFeeCents = labFeeCents; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public Instant getPaidAt() { return paidAt; }
    public void setPaidAt(Instant paidAt) { this.paidAt = paidAt; }

    public UUID getBilledByUserId() { return billedByUserId; }
    public void setBilledByUserId(UUID billedByUserId) { this.billedByUserId = billedByUserId; }

    public String getBilledByName() { return billedByName; }
    public void setBilledByName(String billedByName) { this.billedByName = billedByName; }

    public Integer getBookingFeeCents() { return bookingFeeCents; }
    public void setBookingFeeCents(Integer bookingFeeCents) { this.bookingFeeCents = bookingFeeCents; }

    public Instant getBookingFeePaidAt() { return bookingFeePaidAt; }
    public void setBookingFeePaidAt(Instant bookingFeePaidAt) { this.bookingFeePaidAt = bookingFeePaidAt; }

    public String getBookingFeePaymentMethod() { return bookingFeePaymentMethod; }
    public void setBookingFeePaymentMethod(String bookingFeePaymentMethod) {
        this.bookingFeePaymentMethod = bookingFeePaymentMethod;
    }

    public UUID getPrescriptionId() { return prescriptionId; }
    public void setPrescriptionId(UUID prescriptionId) { this.prescriptionId = prescriptionId; }

    public String getPrescriptionStatus() { return prescriptionStatus; }
    public void setPrescriptionStatus(String prescriptionStatus) { this.prescriptionStatus = prescriptionStatus; }

    public List<PrescriptionItemDto> getPrescriptionItems() { return prescriptionItems; }
    public void setPrescriptionItems(List<PrescriptionItemDto> prescriptionItems) { this.prescriptionItems = prescriptionItems; }

    public Integer getPrescriptionTotalCents() { return prescriptionTotalCents; }
    public void setPrescriptionTotalCents(Integer prescriptionTotalCents) { this.prescriptionTotalCents = prescriptionTotalCents; }

    public Integer getTotalBillCents() { return totalBillCents; }
    public void setTotalBillCents(Integer totalBillCents) { this.totalBillCents = totalBillCents; }

    /**
     * Nested DTO for prescription items in the cashier view.
     */
    public static class PrescriptionItemDto {
        private UUID id;
        private String medicationName;
        private String unit;
        private Integer qty;
        private String dosage;
        private String note;
        private Integer unitPriceCents;
        private Integer totalCents;

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }

        public String getMedicationName() { return medicationName; }
        public void setMedicationName(String medicationName) { this.medicationName = medicationName; }

        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }

        public Integer getQty() { return qty; }
        public void setQty(Integer qty) { this.qty = qty; }

        public String getDosage() { return dosage; }
        public void setDosage(String dosage) { this.dosage = dosage; }

        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }

        public Integer getUnitPriceCents() { return unitPriceCents; }
        public void setUnitPriceCents(Integer unitPriceCents) { this.unitPriceCents = unitPriceCents; }

        public Integer getTotalCents() { return totalCents; }
        public void setTotalCents(Integer totalCents) { this.totalCents = totalCents; }
    }
}

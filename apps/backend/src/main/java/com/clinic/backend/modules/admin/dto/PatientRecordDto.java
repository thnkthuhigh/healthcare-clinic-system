package com.clinic.backend.modules.admin.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO for patient medical records view — patient info + list of visit records.
 */
public class PatientRecordDto {

    private UUID patientId;
    private String fullName;
    private String phone;
    private String nationalId;
    private String dateOfBirth;
    private String gender;
    private String allergies;
    private String address;

    private List<VisitRecordDto> records;

    // Getters and Setters
    public UUID getPatientId() { return patientId; }
    public void setPatientId(UUID patientId) { this.patientId = patientId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getNationalId() { return nationalId; }
    public void setNationalId(String nationalId) { this.nationalId = nationalId; }

    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public List<VisitRecordDto> getRecords() { return records; }
    public void setRecords(List<VisitRecordDto> records) { this.records = records; }

    /**
     * Nested DTO for a single visit/consultation record.
     */
    public static class VisitRecordDto {
        private UUID recordId;
        private UUID bookingId;
        private String doctorName;
        private String serviceName;
        private String symptoms;
        private String diagnosis;
        private String conclusion;
        private String notes;
        private String bookingStatus;
        private String paymentStatus;
        private Instant visitDate;

        private List<PrescriptionItemDto> prescriptionItems;
        private String prescriptionStatus;

        public UUID getRecordId() { return recordId; }
        public void setRecordId(UUID recordId) { this.recordId = recordId; }

        public UUID getBookingId() { return bookingId; }
        public void setBookingId(UUID bookingId) { this.bookingId = bookingId; }

        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

        public String getServiceName() { return serviceName; }
        public void setServiceName(String serviceName) { this.serviceName = serviceName; }

        public String getSymptoms() { return symptoms; }
        public void setSymptoms(String symptoms) { this.symptoms = symptoms; }

        public String getDiagnosis() { return diagnosis; }
        public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

        public String getConclusion() { return conclusion; }
        public void setConclusion(String conclusion) { this.conclusion = conclusion; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }

        public String getBookingStatus() { return bookingStatus; }
        public void setBookingStatus(String bookingStatus) { this.bookingStatus = bookingStatus; }

        public String getPaymentStatus() { return paymentStatus; }
        public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

        public Instant getVisitDate() { return visitDate; }
        public void setVisitDate(Instant visitDate) { this.visitDate = visitDate; }

        public List<PrescriptionItemDto> getPrescriptionItems() { return prescriptionItems; }
        public void setPrescriptionItems(List<PrescriptionItemDto> prescriptionItems) { this.prescriptionItems = prescriptionItems; }

        public String getPrescriptionStatus() { return prescriptionStatus; }
        public void setPrescriptionStatus(String prescriptionStatus) { this.prescriptionStatus = prescriptionStatus; }
    }

    public static class PrescriptionItemDto {
        private String medicationName;
        private String unit;
        private Integer qty;
        private String dosage;
        private String note;

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
    }
}

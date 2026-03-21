package com.clinic.backend.modules.admin.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateVisitRequest {

    @NotBlank
    private String patientName;

    @NotBlank
    private String patientPhone;

    private String patientDob;
    private String patientGender;
    private String patientNationalId;
    private String patientInsuranceCode;

    @NotBlank
    private String serviceId;

    private String preferredDoctorId;

    private Boolean forceOverride;

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

    public String getPatientDob() {
        return patientDob;
    }

    public void setPatientDob(String patientDob) {
        this.patientDob = patientDob;
    }

    public String getPatientGender() {
        return patientGender;
    }

    public void setPatientGender(String patientGender) {
        this.patientGender = patientGender;
    }

    public String getPatientNationalId() {
        return patientNationalId;
    }

    public void setPatientNationalId(String patientNationalId) {
        this.patientNationalId = patientNationalId;
    }

    public String getPatientInsuranceCode() {
        return patientInsuranceCode;
    }

    public void setPatientInsuranceCode(String patientInsuranceCode) {
        this.patientInsuranceCode = patientInsuranceCode;
    }

    public String getServiceId() {
        return serviceId;
    }

    public void setServiceId(String serviceId) {
        this.serviceId = serviceId;
    }

    public Boolean getForceOverride() {
        return forceOverride;
    }

    public void setForceOverride(Boolean forceOverride) {
        this.forceOverride = forceOverride;
    }

    public String getPreferredDoctorId() {
        return preferredDoctorId;
    }

    public void setPreferredDoctorId(String preferredDoctorId) {
        this.preferredDoctorId = preferredDoctorId;
    }
}

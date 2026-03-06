package com.clinic.backend.modules.admin.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateShiftRequest {

    @NotBlank
    private String doctorId;

    @NotBlank
    private String date; // ISO: YYYY-MM-DD

    @NotBlank
    private String type; // MORNING | AFTERNOON

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}

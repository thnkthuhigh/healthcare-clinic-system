package com.clinic.backend.modules.admin.dto;

import java.util.UUID;

public class DoctorVisitStatsDto {

    private UUID doctorId;
    private String doctorName;
    private String specialty;
    private long morningVisits;
    private long afternoonVisits;
    private long totalVisits;

    public UUID getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(UUID doctorId) {
        this.doctorId = doctorId;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getSpecialty() {
        return specialty;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public long getMorningVisits() {
        return morningVisits;
    }

    public void setMorningVisits(long morningVisits) {
        this.morningVisits = morningVisits;
    }

    public long getAfternoonVisits() {
        return afternoonVisits;
    }

    public void setAfternoonVisits(long afternoonVisits) {
        this.afternoonVisits = afternoonVisits;
    }

    public long getTotalVisits() {
        return totalVisits;
    }

    public void setTotalVisits(long totalVisits) {
        this.totalVisits = totalVisits;
    }
}

package com.clinic.backend.modules.admin.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.ArrayList;
import java.util.List;

public class SyncWeekShiftRequest {

    @NotBlank
    private String doctorId;

    @NotBlank
    private String weekStartDate;

    @NotBlank
    private String note;

    private List<BulkShiftRequest.DayShiftConfig> dayConfigs = new ArrayList<>();

    public String getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }

    public String getWeekStartDate() {
        return weekStartDate;
    }

    public void setWeekStartDate(String weekStartDate) {
        this.weekStartDate = weekStartDate;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public List<BulkShiftRequest.DayShiftConfig> getDayConfigs() {
        return dayConfigs;
    }

    public void setDayConfigs(List<BulkShiftRequest.DayShiftConfig> dayConfigs) {
        this.dayConfigs = dayConfigs;
    }
}

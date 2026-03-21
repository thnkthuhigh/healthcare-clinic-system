package com.clinic.backend.modules.admin.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.ArrayList;
import java.util.List;

public class BulkShiftRequest {

    @NotBlank
    private String doctorId;

    @NotBlank
    private String weekStartDate;

    private List<String> shiftTypes;

    private List<Integer> daysOfWeek;

    private List<DayShiftConfig> dayConfigs = new ArrayList<>();

    private Integer repeatWeeks;

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

    public List<String> getShiftTypes() {
        return shiftTypes;
    }

    public void setShiftTypes(List<String> shiftTypes) {
        this.shiftTypes = shiftTypes;
    }

    public List<Integer> getDaysOfWeek() {
        return daysOfWeek;
    }

    public void setDaysOfWeek(List<Integer> daysOfWeek) {
        this.daysOfWeek = daysOfWeek;
    }

    public List<DayShiftConfig> getDayConfigs() {
        return dayConfigs;
    }

    public void setDayConfigs(List<DayShiftConfig> dayConfigs) {
        this.dayConfigs = dayConfigs;
    }

    public Integer getRepeatWeeks() {
        return repeatWeeks;
    }

    public void setRepeatWeeks(Integer repeatWeeks) {
        this.repeatWeeks = repeatWeeks;
    }

    public static class DayShiftConfig {
        private Integer dayOfWeek;
        private List<String> shiftTypes = new ArrayList<>();

        public Integer getDayOfWeek() {
            return dayOfWeek;
        }

        public void setDayOfWeek(Integer dayOfWeek) {
            this.dayOfWeek = dayOfWeek;
        }

        public List<String> getShiftTypes() {
            return shiftTypes;
        }

        public void setShiftTypes(List<String> shiftTypes) {
            this.shiftTypes = shiftTypes;
        }
    }
}

package com.clinic.backend.modules.admin.dto;

import java.util.ArrayList;
import java.util.List;

public class BulkShiftResponse {

    private String doctorId;
    private String weekStartDate;
    private Integer repeatWeeks;
    private List<AdminShiftDto> created = new ArrayList<>();
    private List<SkippedShiftDto> skipped = new ArrayList<>();

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

    public Integer getRepeatWeeks() {
        return repeatWeeks;
    }

    public void setRepeatWeeks(Integer repeatWeeks) {
        this.repeatWeeks = repeatWeeks;
    }

    public List<AdminShiftDto> getCreated() {
        return created;
    }

    public void setCreated(List<AdminShiftDto> created) {
        this.created = created;
    }

    public List<SkippedShiftDto> getSkipped() {
        return skipped;
    }

    public void setSkipped(List<SkippedShiftDto> skipped) {
        this.skipped = skipped;
    }

    public static class SkippedShiftDto {
        private String date;
        private String type;
        private String reason;

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }
}

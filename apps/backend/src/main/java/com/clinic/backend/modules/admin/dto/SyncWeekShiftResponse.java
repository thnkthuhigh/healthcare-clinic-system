package com.clinic.backend.modules.admin.dto;

import java.util.ArrayList;
import java.util.List;

public class SyncWeekShiftResponse {

    private String doctorId;
    private String weekStartDate;
    private List<AdminShiftDto> created = new ArrayList<>();
    private List<ChangedShiftDto> deleted = new ArrayList<>();
    private List<BulkShiftResponse.SkippedShiftDto> skipped = new ArrayList<>();

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

    public List<AdminShiftDto> getCreated() {
        return created;
    }

    public void setCreated(List<AdminShiftDto> created) {
        this.created = created;
    }

    public List<ChangedShiftDto> getDeleted() {
        return deleted;
    }

    public void setDeleted(List<ChangedShiftDto> deleted) {
        this.deleted = deleted;
    }

    public List<BulkShiftResponse.SkippedShiftDto> getSkipped() {
        return skipped;
    }

    public void setSkipped(List<BulkShiftResponse.SkippedShiftDto> skipped) {
        this.skipped = skipped;
    }

    public static class ChangedShiftDto {
        private String date;
        private String type;

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
    }
}

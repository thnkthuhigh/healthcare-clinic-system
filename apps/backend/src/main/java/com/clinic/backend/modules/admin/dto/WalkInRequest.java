package com.clinic.backend.modules.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * Request body for walk-in patient registration at reception.
 */
public class WalkInRequest {

    @NotBlank(message = "Tên bệnh nhân không được để trống")
    private String patientName;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String patientPhone;

    @NotNull(message = "Phải chọn ca khám")
    private UUID shiftId;

    private UUID serviceId;

    // Getters and Setters
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }

    public UUID getShiftId() { return shiftId; }
    public void setShiftId(UUID shiftId) { this.shiftId = shiftId; }

    public UUID getServiceId() { return serviceId; }
    public void setServiceId(UUID serviceId) { this.serviceId = serviceId; }
}

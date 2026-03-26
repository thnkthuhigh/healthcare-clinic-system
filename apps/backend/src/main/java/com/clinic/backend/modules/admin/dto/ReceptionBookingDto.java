package com.clinic.backend.modules.admin.dto;

import java.time.Instant;

/**
 * DTO for displaying a booking in the reception board.
 */
public class ReceptionBookingDto {
    private String id;
    private Integer queueNumber;
    private String patientName;
    private String patientPhone;
    private String doctorName;
    private String shiftId;
    private String shiftType;
    private String serviceName;
    private String status;
    private String channel;
    private String paymentStatus;
    private Instant checkInAt;
    private Instant createdAt;
    private int priorityScore;
    private String roomName;
    private String slotPool;
    private boolean followUp;
    private String followUpSourceBookingId;
    private Instant followUpScheduledAt;
    private String followUpNote;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Integer getQueueNumber() { return queueNumber; }
    public void setQueueNumber(Integer queueNumber) { this.queueNumber = queueNumber; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getShiftId() { return shiftId; }
    public void setShiftId(String shiftId) { this.shiftId = shiftId; }

    public String getShiftType() { return shiftType; }
    public void setShiftType(String shiftType) { this.shiftType = shiftType; }

    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public Instant getCheckInAt() { return checkInAt; }
    public void setCheckInAt(Instant checkInAt) { this.checkInAt = checkInAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public int getPriorityScore() { return priorityScore; }
    public void setPriorityScore(int priorityScore) { this.priorityScore = priorityScore; }

    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public String getSlotPool() { return slotPool; }
    public void setSlotPool(String slotPool) { this.slotPool = slotPool; }

    public boolean isFollowUp() { return followUp; }
    public void setFollowUp(boolean followUp) { this.followUp = followUp; }

    public String getFollowUpSourceBookingId() { return followUpSourceBookingId; }
    public void setFollowUpSourceBookingId(String followUpSourceBookingId) {
        this.followUpSourceBookingId = followUpSourceBookingId;
    }

    public Instant getFollowUpScheduledAt() { return followUpScheduledAt; }
    public void setFollowUpScheduledAt(Instant followUpScheduledAt) { this.followUpScheduledAt = followUpScheduledAt; }

    public String getFollowUpNote() { return followUpNote; }
    public void setFollowUpNote(String followUpNote) { this.followUpNote = followUpNote; }
}

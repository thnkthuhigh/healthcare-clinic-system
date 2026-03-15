package com.clinic.backend.modules.doctor.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "shifts")
public class Shift {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShiftType type;
    
    @Column(name = "start_time", nullable = false)
    private Instant startTime;
    
    @Column(name = "end_time", nullable = false)
    private Instant endTime;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShiftStatus status = ShiftStatus.OPEN;

    @Column(name = "is_makeup", nullable = false)
    private Boolean isMakeup = false;

    @Column(name = "adjustment_note")
    private String adjustmentNote;
    
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
    
    public enum ShiftType {
        MORNING, AFTERNOON
    }
    
    public enum ShiftStatus {
        OPEN, CLOSED
    }
    
    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }
    
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    
    public ShiftType getType() { return type; }
    public void setType(ShiftType type) { this.type = type; }
    
    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    
    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }
    
    public ShiftStatus getStatus() { return status; }
    public void setStatus(ShiftStatus status) { this.status = status; }

    public Boolean getIsMakeup() { return isMakeup; }
    public void setIsMakeup(Boolean isMakeup) { this.isMakeup = isMakeup; }

    public String getAdjustmentNote() { return adjustmentNote; }
    public void setAdjustmentNote(String adjustmentNote) { this.adjustmentNote = adjustmentNote; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    
    // Utility method for display
    public String getTimeRange() {
        // Format: "07:00 - 09:00"
        java.time.format.DateTimeFormatter formatter = 
            java.time.format.DateTimeFormatter.ofPattern("HH:mm")
                .withZone(java.time.ZoneId.systemDefault());
        return formatter.format(startTime) + " - " + formatter.format(endTime);
    }
}

package com.clinic.backend.modules.admin.dto;

import java.time.Instant;
import java.util.UUID;

/** Admin view of a doctor account (doctor profile + user info combined). */
public class AdminDoctorDto {

    private UUID id;          // doctor.id
    private UUID userId;
    private String phone;
    private String displayName;
    private String specialty;
    private String status;    // ACTIVE | LOCKED
    private Instant createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

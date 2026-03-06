package com.clinic.backend.modules.admin.dto;

public class AdminSlotDto {

    private String id;
    private int sequence;
    private String pool;   // COMMON | RESERVE | OVERRIDE
    private String status; // OPEN | LOCKED

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public int getSequence() { return sequence; }
    public void setSequence(int sequence) { this.sequence = sequence; }

    public String getPool() { return pool; }
    public void setPool(String pool) { this.pool = pool; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

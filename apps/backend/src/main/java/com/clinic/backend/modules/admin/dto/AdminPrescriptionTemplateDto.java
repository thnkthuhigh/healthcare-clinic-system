package com.clinic.backend.modules.admin.dto;

import java.util.List;

public class AdminPrescriptionTemplateDto {

    private String id;
    private String name;
    private String note;
    private boolean isActive;
    private String createdAt;
    private int itemCount;
    private List<TemplateItemDto> items;

    public static class TemplateItemDto {
        private String id;
        private String medicationId;
        private String medicationName;
        private String unit;
        private int qty;
        private String dosage;
        private String note;
        private int priceCents;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getMedicationId() { return medicationId; }
        public void setMedicationId(String medicationId) { this.medicationId = medicationId; }

        public String getMedicationName() { return medicationName; }
        public void setMedicationName(String medicationName) { this.medicationName = medicationName; }

        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }

        public int getQty() { return qty; }
        public void setQty(int qty) { this.qty = qty; }

        public String getDosage() { return dosage; }
        public void setDosage(String dosage) { this.dosage = dosage; }

        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }

        public int getPriceCents() { return priceCents; }
        public void setPriceCents(int priceCents) { this.priceCents = priceCents; }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public int getItemCount() { return itemCount; }
    public void setItemCount(int itemCount) { this.itemCount = itemCount; }

    public List<TemplateItemDto> getItems() { return items; }
    public void setItems(List<TemplateItemDto> items) { this.items = items; }
}

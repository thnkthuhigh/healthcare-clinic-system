package com.clinic.backend.modules.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class SavePrescriptionTemplateRequest {

    @NotBlank
    private String name;

    private String note;

    @NotEmpty
    private List<TemplateItemRequest> items;

    public static class TemplateItemRequest {
        private String medicationId;
        private int qty;
        private String dosage;
        private String note;

        public String getMedicationId() { return medicationId; }
        public void setMedicationId(String medicationId) { this.medicationId = medicationId; }

        public int getQty() { return qty; }
        public void setQty(int qty) { this.qty = qty; }

        public String getDosage() { return dosage; }
        public void setDosage(String dosage) { this.dosage = dosage; }

        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public List<TemplateItemRequest> getItems() { return items; }
    public void setItems(List<TemplateItemRequest> items) { this.items = items; }
}

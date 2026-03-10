package com.clinic.backend.modules.doctor.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "prescription_template_items")
public class PrescriptionTemplateItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private PrescriptionTemplate template;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medication_id", nullable = false)
    private Medication medication;

    @Column(nullable = false)
    private Integer qty;

    @Column
    private String dosage;

    @Column
    private String note;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public PrescriptionTemplate getTemplate() { return template; }
    public void setTemplate(PrescriptionTemplate template) { this.template = template; }

    public Medication getMedication() { return medication; }
    public void setMedication(Medication medication) { this.medication = medication; }

    public Integer getQty() { return qty; }
    public void setQty(Integer qty) { this.qty = qty; }

    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}

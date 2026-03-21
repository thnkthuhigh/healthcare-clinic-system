package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.AdminMedicationDto;
import com.clinic.backend.modules.admin.dto.CreateMedicationRequest;
import com.clinic.backend.modules.admin.dto.RestockRequest;
import com.clinic.backend.modules.admin.dto.UpdateMedicationRequest;
import com.clinic.backend.modules.doctor.entity.Medication;
import com.clinic.backend.modules.doctor.repository.MedicationRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MedicationManagementService {

    @PersistenceContext
    private EntityManager em;

    private final MedicationRepository medicationRepository;
    private final AuditLogService auditLogService;

    public MedicationManagementService(MedicationRepository medicationRepository,
                                       AuditLogService auditLogService) {
        this.medicationRepository = medicationRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<AdminMedicationDto> getAllMedications(String q) {
        List<Medication> meds = (q != null && !q.isBlank())
            ? medicationRepository.searchByName(q)
            : medicationRepository.findAll();

        // searchByName only returns active; for all we want both active/inactive
        if (q == null || q.isBlank()) {
            meds = medicationRepository.findAll(org.springframework.data.domain.Sort.by("name"));
        }

        return meds.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public AdminMedicationDto createMedication(CreateMedicationRequest request) {
        if (medicationRepository.findAll().stream()
            .anyMatch(m -> m.getName().equalsIgnoreCase(request.getName()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ten thuoc da ton tai");
        }

        Medication med = new Medication();
        med.setName(request.getName().trim());
        med.setUnit(request.getUnit().trim());
        med.setUsage(request.getUsage());
        med.setDefaultDose(request.getDefaultDose());
        med.setPriceCents(request.getPriceCents());
        med.setStockReal(request.getInitialStock());
        med.setStockHold(0);
        med.setIsActive(true);

        Medication saved = medicationRepository.save(med);

        // Initial stock also counts as an expense entry for Thu-Chi reporting.
        if (saved.getStockReal() > 0) {
            em.createNativeQuery("""
                    INSERT INTO finance_ledger (
                        id, entry_date, entry_type, category, ref_type, ref_id,
                        description, qty, unit, amount_cents, actor_user_id, created_at
                    ) VALUES (
                        gen_random_uuid(), CURRENT_DATE, 'EXPENSE', 'MEDICATION_PURCHASE', 'MEDICATION', :refId,
                        :description, :qty, :unit, :amount, :actorUserId, now()
                    )
                    """)
                .setParameter("refId", saved.getId())
                .setParameter("description", "Nhap kho thuoc ban dau: " + saved.getName())
                .setParameter("qty", saved.getStockReal())
                .setParameter("unit", saved.getUnit())
                .setParameter("amount", (long) saved.getStockReal() * saved.getPriceCents())
                .setParameter("actorUserId", auditLogService.getCurrentActorUserIdOrNull())
                .executeUpdate();
        }

        return toDto(saved);
    }

    @Transactional
    public AdminMedicationDto updateMedication(UUID id, UpdateMedicationRequest request) {
        Medication med = medicationRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay thuoc"));

        if (request.getName() != null && !request.getName().isBlank()) {
            boolean duplicate = medicationRepository.findAll().stream()
                .anyMatch(m -> !m.getId().equals(id) && m.getName().equalsIgnoreCase(request.getName()));
            if (duplicate) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Ten thuoc da ton tai");
            }
            med.setName(request.getName().trim());
        }

        if (request.getUnit() != null && !request.getUnit().isBlank()) med.setUnit(request.getUnit());
        if (request.getUsage() != null) med.setUsage(request.getUsage());
        if (request.getDefaultDose() != null) med.setDefaultDose(request.getDefaultDose());
        if (request.getPriceCents() != null) med.setPriceCents(request.getPriceCents());

        return toDto(medicationRepository.save(med));
    }

    @Transactional
    public AdminMedicationDto toggleActive(UUID id) {
        Medication med = medicationRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay thuoc"));
        med.setIsActive(!med.getIsActive());
        return toDto(medicationRepository.save(med));
    }

    @Transactional
    public AdminMedicationDto restock(UUID id, RestockRequest request) {
        Medication med = medicationRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay thuoc"));

        int oldQty = med.getStockReal();
        int newQty = oldQty + request.getQty();
        med.setStockReal(newQty);

        Medication saved = medicationRepository.save(med);

        auditLogService.log(
            "STOCK_EDIT",
            "MEDICATION",
            saved.getId(),
            Map.of(
                "medicationName", saved.getName(),
                "oldQty", oldQty,
                "newQty", newQty,
                "type", "RESTOCK"
            )
        );

        return toDto(saved);
    }

    private AdminMedicationDto toDto(Medication med) {
        AdminMedicationDto dto = new AdminMedicationDto();
        dto.setId(med.getId().toString());
        dto.setName(med.getName());
        dto.setUnit(med.getUnit());
        dto.setUsage(med.getUsage());
        dto.setDefaultDose(med.getDefaultDose());
        dto.setPriceCents(med.getPriceCents());
        dto.setStockReal(med.getStockReal());
        dto.setStockHold(med.getStockHold());
        dto.setAvailableStock(med.getAvailableStock());
        dto.setActive(med.getIsActive());
        return dto;
    }
}

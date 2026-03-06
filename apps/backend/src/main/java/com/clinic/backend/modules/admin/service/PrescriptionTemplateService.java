package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.AdminPrescriptionTemplateDto;
import com.clinic.backend.modules.admin.dto.AdminPrescriptionTemplateDto.TemplateItemDto;
import com.clinic.backend.modules.admin.dto.SavePrescriptionTemplateRequest;
import com.clinic.backend.modules.doctor.entity.Medication;
import com.clinic.backend.modules.doctor.entity.PrescriptionTemplate;
import com.clinic.backend.modules.doctor.entity.PrescriptionTemplateItem;
import com.clinic.backend.modules.doctor.repository.MedicationRepository;
import com.clinic.backend.modules.doctor.repository.PrescriptionTemplateRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PrescriptionTemplateService {

    private final PrescriptionTemplateRepository templateRepository;
    private final MedicationRepository medicationRepository;

    public PrescriptionTemplateService(PrescriptionTemplateRepository templateRepository,
                                       MedicationRepository medicationRepository) {
        this.templateRepository = templateRepository;
        this.medicationRepository = medicationRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminPrescriptionTemplateDto> getAllTemplates() {
        return templateRepository.findAllByOrderByNameAsc().stream()
            .map(t -> toDtoSummary(t))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminPrescriptionTemplateDto getTemplate(UUID id) {
        PrescriptionTemplate t = templateRepository.findByIdWithItems(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy mẫu"));
        return toDtoFull(t);
    }

    @Transactional
    public AdminPrescriptionTemplateDto createTemplate(SavePrescriptionTemplateRequest request) {
        if (templateRepository.existsByName(request.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên mẫu đã tồn tại");
        }
        PrescriptionTemplate template = new PrescriptionTemplate();
        template.setName(request.getName().trim());
        template.setNote(request.getNote());
        applyItems(template, request);
        return toDtoFull(templateRepository.save(template));
    }

    @Transactional
    public AdminPrescriptionTemplateDto updateTemplate(UUID id, SavePrescriptionTemplateRequest request) {
        PrescriptionTemplate template = templateRepository.findByIdWithItems(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy mẫu"));
        if (!template.getName().equals(request.getName()) &&
                templateRepository.existsByName(request.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên mẫu đã tồn tại");
        }
        template.setName(request.getName().trim());
        template.setNote(request.getNote());
        template.getItems().clear();
        templateRepository.saveAndFlush(template);  // flush orphan deletes before re-adding
        applyItems(template, request);
        return toDtoFull(templateRepository.save(template));
    }

    @Transactional
    public AdminPrescriptionTemplateDto toggleActive(UUID id) {
        PrescriptionTemplate template = templateRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy mẫu"));
        template.setIsActive(!template.getIsActive());
        return toDtoSummary(templateRepository.save(template));
    }

    @Transactional
    public void deleteTemplate(UUID id) {
        if (!templateRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy mẫu");
        }
        templateRepository.deleteById(id);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private void applyItems(PrescriptionTemplate template, SavePrescriptionTemplateRequest request) {
        for (SavePrescriptionTemplateRequest.TemplateItemRequest itemReq : request.getItems()) {
            UUID medId = UUID.fromString(itemReq.getMedicationId());
            Medication med = medicationRepository.findById(medId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Không tìm thấy thuốc: " + itemReq.getMedicationId()));
            PrescriptionTemplateItem item = new PrescriptionTemplateItem();
            item.setTemplate(template);
            item.setMedication(med);
            item.setQty(itemReq.getQty());
            item.setDosage(itemReq.getDosage());
            item.setNote(itemReq.getNote());
            template.getItems().add(item);
        }
    }

    private AdminPrescriptionTemplateDto toDtoSummary(PrescriptionTemplate t) {
        AdminPrescriptionTemplateDto dto = new AdminPrescriptionTemplateDto();
        dto.setId(t.getId().toString());
        dto.setName(t.getName());
        dto.setNote(t.getNote());
        dto.setActive(t.getIsActive());
        dto.setCreatedAt(t.getCreatedAt().toString());
        dto.setItemCount(t.getItems().size());
        dto.setItems(List.of());
        return dto;
    }

    private AdminPrescriptionTemplateDto toDtoFull(PrescriptionTemplate t) {
        AdminPrescriptionTemplateDto dto = toDtoSummary(t);
        List<TemplateItemDto> items = t.getItems().stream().map(item -> {
            TemplateItemDto d = new TemplateItemDto();
            d.setId(item.getId().toString());
            d.setMedicationId(item.getMedication().getId().toString());
            d.setMedicationName(item.getMedication().getName());
            d.setUnit(item.getMedication().getUnit());
            d.setQty(item.getQty());
            d.setDosage(item.getDosage());
            d.setNote(item.getNote());
            d.setPriceCents(item.getMedication().getPriceCents());
            return d;
        }).collect(Collectors.toList());
        dto.setItemCount(items.size());
        dto.setItems(items);
        return dto;
    }
}

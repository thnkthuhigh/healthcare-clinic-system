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

import java.util.HashSet;
import java.util.List;
import java.util.Set;
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
            .map(this::toDtoSummary)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminPrescriptionTemplateDto getTemplate(UUID id) {
        PrescriptionTemplate template = templateRepository.findByIdWithItems(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy toa mẫu"));
        return toDtoFull(template);
    }

    @Transactional
    public AdminPrescriptionTemplateDto createTemplate(SavePrescriptionTemplateRequest request) {
        String normalizedName = normalizeRequiredName(request.getName());
        if (templateRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên toa mẫu đã tồn tại");
        }

        PrescriptionTemplate template = new PrescriptionTemplate();
        template.setName(normalizedName);
        template.setNote(normalizeOptionalText(request.getNote()));
        applyItems(template, request);

        return toDtoFull(templateRepository.saveAndFlush(template));
    }

    @Transactional
    public AdminPrescriptionTemplateDto updateTemplate(UUID id, SavePrescriptionTemplateRequest request) {
        String normalizedName = normalizeRequiredName(request.getName());

        PrescriptionTemplate template = templateRepository.findByIdWithItems(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy toa mẫu"));

        if (!template.getName().equalsIgnoreCase(normalizedName)
                && templateRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên toa mẫu đã tồn tại");
        }

        template.setName(normalizedName);
        template.setNote(normalizeOptionalText(request.getNote()));

        // Explicitly delete child rows first so update remains stable across DB variants.
        templateRepository.deleteItemsByTemplateId(id);
        template.getItems().clear();
        templateRepository.flush();

        applyItems(template, request);
        return toDtoFull(templateRepository.saveAndFlush(template));
    }

    @Transactional
    public AdminPrescriptionTemplateDto toggleActive(UUID id) {
        PrescriptionTemplate template = templateRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy toa mẫu"));
        template.setIsActive(!template.getIsActive());
        return toDtoSummary(templateRepository.save(template));
    }

    @Transactional
    public void deleteTemplate(UUID id) {
        PrescriptionTemplate template = templateRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy toa mẫu"));

        // Keep delete robust even if DB FK cascade differs between environments.
        templateRepository.deleteItemsByTemplateId(id);
        templateRepository.delete(template);
        templateRepository.flush();
    }

    private void applyItems(PrescriptionTemplate template, SavePrescriptionTemplateRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Toa mẫu phải có ít nhất 1 thuốc");
        }

        Set<UUID> seenMedicationIds = new HashSet<>();

        for (SavePrescriptionTemplateRequest.TemplateItemRequest itemReq : request.getItems()) {
            UUID medId = parseMedicationId(itemReq.getMedicationId());
            if (!seenMedicationIds.add(medId)) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mỗi thuốc chỉ được xuất hiện 1 lần trong toa mẫu"
                );
            }
            if (itemReq.getQty() < 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số lượng thuốc phải >= 1");
            }

            Medication medication = medicationRepository.findById(medId)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy thuốc: " + itemReq.getMedicationId()
                ));

            PrescriptionTemplateItem item = new PrescriptionTemplateItem();
            item.setTemplate(template);
            item.setMedication(medication);
            item.setQty(itemReq.getQty());
            item.setDosage(normalizeOptionalText(itemReq.getDosage()));
            item.setNote(normalizeOptionalText(itemReq.getNote()));
            template.getItems().add(item);
        }
    }

    private String normalizeRequiredName(String rawName) {
        if (rawName == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên toa mẫu là bắt buộc");
        }

        String normalized = rawName.trim();
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên toa mẫu là bắt buộc");
        }

        return normalized;
    }

    private String normalizeOptionalText(String rawText) {
        if (rawText == null) {
            return null;
        }

        String normalized = rawText.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private UUID parseMedicationId(String medicationId) {
        if (medicationId == null || medicationId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu medicationId");
        }

        try {
            return UUID.fromString(medicationId);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "medicationId không hợp lệ");
        }
    }

    private AdminPrescriptionTemplateDto toDtoSummary(PrescriptionTemplate template) {
        AdminPrescriptionTemplateDto dto = new AdminPrescriptionTemplateDto();
        dto.setId(template.getId().toString());
        dto.setName(template.getName());
        dto.setNote(template.getNote());
        dto.setActive(template.getIsActive());
        dto.setCreatedAt(template.getCreatedAt().toString());
        dto.setItemCount(template.getItems().size());
        dto.setItems(List.of());
        return dto;
    }

    private AdminPrescriptionTemplateDto toDtoFull(PrescriptionTemplate template) {
        AdminPrescriptionTemplateDto dto = toDtoSummary(template);
        List<TemplateItemDto> items = template.getItems().stream().map(item -> {
            TemplateItemDto itemDto = new TemplateItemDto();
            itemDto.setId(item.getId().toString());
            itemDto.setMedicationId(item.getMedication().getId().toString());
            itemDto.setMedicationName(item.getMedication().getName());
            itemDto.setUnit(item.getMedication().getUnit());
            itemDto.setQty(item.getQty());
            itemDto.setDosage(item.getDosage());
            itemDto.setNote(item.getNote());
            itemDto.setPriceCents(item.getMedication().getPriceCents());
            return itemDto;
        }).collect(Collectors.toList());
        dto.setItemCount(items.size());
        dto.setItems(items);
        return dto;
    }
}

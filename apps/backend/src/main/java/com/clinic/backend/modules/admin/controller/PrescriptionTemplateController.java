package com.clinic.backend.modules.admin.controller;

import com.clinic.backend.modules.admin.dto.AdminPrescriptionTemplateDto;
import com.clinic.backend.modules.admin.dto.SavePrescriptionTemplateRequest;
import com.clinic.backend.modules.admin.service.PrescriptionTemplateService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/prescription-templates")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class PrescriptionTemplateController {

    private final PrescriptionTemplateService prescriptionTemplateService;

    public PrescriptionTemplateController(PrescriptionTemplateService prescriptionTemplateService) {
        this.prescriptionTemplateService = prescriptionTemplateService;
    }

    /** GET /api/v1/admin/prescription-templates */
    @GetMapping
    public List<AdminPrescriptionTemplateDto> getTemplates() {
        return prescriptionTemplateService.getAllTemplates();
    }

    /** GET /api/v1/admin/prescription-templates/{id} */
    @GetMapping("/{id}")
    public AdminPrescriptionTemplateDto getTemplate(@PathVariable UUID id) {
        return prescriptionTemplateService.getTemplate(id);
    }

    /** POST /api/v1/admin/prescription-templates */
    @PostMapping
    public AdminPrescriptionTemplateDto createTemplate(
            @Valid @RequestBody SavePrescriptionTemplateRequest request) {
        return prescriptionTemplateService.createTemplate(request);
    }

    /** PUT /api/v1/admin/prescription-templates/{id} */
    @PutMapping("/{id}")
    public AdminPrescriptionTemplateDto updateTemplate(
            @PathVariable UUID id,
            @Valid @RequestBody SavePrescriptionTemplateRequest request) {
        return prescriptionTemplateService.updateTemplate(id, request);
    }

    /** POST /api/v1/admin/prescription-templates/{id}/toggle */
    @PostMapping("/{id}/toggle")
    public AdminPrescriptionTemplateDto toggleActive(@PathVariable UUID id) {
        return prescriptionTemplateService.toggleActive(id);
    }

    /** DELETE /api/v1/admin/prescription-templates/{id} */
    @DeleteMapping("/{id}")
    public void deleteTemplate(@PathVariable UUID id) {
        prescriptionTemplateService.deleteTemplate(id);
    }
}

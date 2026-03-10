package com.clinic.backend.modules.admin.controller;

import com.clinic.backend.modules.admin.dto.AdminMedicationDto;
import com.clinic.backend.modules.admin.dto.CreateMedicationRequest;
import com.clinic.backend.modules.admin.dto.RestockRequest;
import com.clinic.backend.modules.admin.dto.UpdateMedicationRequest;
import com.clinic.backend.modules.admin.service.MedicationManagementService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/medications")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class MedicationManagementController {

    private final MedicationManagementService medicationManagementService;

    public MedicationManagementController(MedicationManagementService medicationManagementService) {
        this.medicationManagementService = medicationManagementService;
    }

    /** GET /api/v1/admin/medications?q= */
    @GetMapping
    public List<AdminMedicationDto> getMedications(@RequestParam(required = false) String q) {
        return medicationManagementService.getAllMedications(q);
    }

    /** POST /api/v1/admin/medications */
    @PostMapping
    public AdminMedicationDto createMedication(@Valid @RequestBody CreateMedicationRequest request) {
        return medicationManagementService.createMedication(request);
    }

    /** PATCH /api/v1/admin/medications/{id} */
    @PatchMapping("/{id}")
    public AdminMedicationDto updateMedication(@PathVariable UUID id,
                                               @RequestBody UpdateMedicationRequest request) {
        return medicationManagementService.updateMedication(id, request);
    }

    /** POST /api/v1/admin/medications/{id}/toggle */
    @PostMapping("/{id}/toggle")
    public AdminMedicationDto toggleActive(@PathVariable UUID id) {
        return medicationManagementService.toggleActive(id);
    }

    /** POST /api/v1/admin/medications/{id}/restock */
    @PostMapping("/{id}/restock")
    public AdminMedicationDto restock(@PathVariable UUID id,
                                      @Valid @RequestBody RestockRequest request) {
        return medicationManagementService.restock(id, request);
    }
}

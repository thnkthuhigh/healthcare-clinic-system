package com.clinic.backend.modules.admin.controller;

import com.clinic.backend.modules.admin.dto.PatientRecordDto;
import com.clinic.backend.modules.admin.service.PatientRecordService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/patients")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class PatientRecordController {

    private final PatientRecordService patientRecordService;

    public PatientRecordController(PatientRecordService patientRecordService) {
        this.patientRecordService = patientRecordService;
    }

    /**
     * Get patient medical records (PRD §2.7).
     * GET /api/v1/admin/patients/{patientId}/records
     */
    @GetMapping("/{patientId}/records")
    public ResponseEntity<PatientRecordDto> getPatientRecords(@PathVariable UUID patientId) {
        return ResponseEntity.ok(patientRecordService.getPatientRecords(patientId));
    }
}

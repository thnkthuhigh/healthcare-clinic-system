package com.clinic.backend.modules.admin.controller;

import com.clinic.backend.modules.admin.dto.*;
import com.clinic.backend.modules.admin.service.UserManagementService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class UserManagementController {

    private final UserManagementService userManagementService;

    public UserManagementController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    // =========================================================================
    //  DOCTOR ENDPOINTS
    // =========================================================================

    /** GET /api/v1/admin/doctors — list all doctors */
    @GetMapping("/doctors")
    public ResponseEntity<List<AdminDoctorDto>> getAllDoctors() {
        return ResponseEntity.ok(userManagementService.getAllDoctors());
    }

    /** POST /api/v1/admin/doctors — create doctor account + profile */
    @PostMapping("/doctors")
    public ResponseEntity<AdminDoctorDto> createDoctor(@Valid @RequestBody CreateDoctorRequest req) {
        return ResponseEntity.ok(userManagementService.createDoctor(req));
    }

    /** PATCH /api/v1/admin/doctors/{id} — update display name / specialty / password */
    @PatchMapping("/doctors/{id}")
    public ResponseEntity<AdminDoctorDto> updateDoctor(
            @PathVariable UUID id, @RequestBody UpdateDoctorRequest req) {
        return ResponseEntity.ok(userManagementService.updateDoctor(id, req));
    }

    /** POST /api/v1/admin/doctors/{id}/lock — lock doctor account */
    @PostMapping("/doctors/{id}/lock")
    public ResponseEntity<AdminDoctorDto> lockDoctor(@PathVariable UUID id) {
        return ResponseEntity.ok(userManagementService.lockDoctor(id));
    }

    /** POST /api/v1/admin/doctors/{id}/unlock — unlock doctor account */
    @PostMapping("/doctors/{id}/unlock")
    public ResponseEntity<AdminDoctorDto> unlockDoctor(@PathVariable UUID id) {
        return ResponseEntity.ok(userManagementService.unlockDoctor(id));
    }

    // =========================================================================
    //  PATIENT ENDPOINTS
    // =========================================================================

    /** GET /api/v1/admin/patients?q=query — list or search patients */
    @GetMapping("/patients")
    public ResponseEntity<List<AdminPatientDto>> getPatients(
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(userManagementService.searchPatients(q));
    }

    /** POST /api/v1/admin/patients/{id}/reset-password — support patient who forgets password */
    @PostMapping("/patients/{id}/reset-password")
    public ResponseEntity<Map<String, String>> resetPatientPassword(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mật khẩu không được để trống"));
        }
        userManagementService.resetPatientPassword(id, newPassword);
        return ResponseEntity.ok(Map.of("message", "Đã đặt lại mật khẩu thành công"));
    }
}

package com.clinic.backend.modules.doctor.controller;

import com.clinic.backend.modules.doctor.dto.DoctorTotpSetupDto;
import com.clinic.backend.modules.doctor.dto.DoctorTotpStatusDto;
import com.clinic.backend.modules.doctor.dto.request.ChangePasswordWithTotpRequest;
import com.clinic.backend.modules.doctor.dto.request.ConfirmTotpRequest;
import com.clinic.backend.modules.doctor.service.DoctorSecurityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/doctor/security")
@PreAuthorize("hasRole('DOCTOR')")
public class DoctorSecurityController {

    private final DoctorSecurityService doctorSecurityService;

    public DoctorSecurityController(DoctorSecurityService doctorSecurityService) {
        this.doctorSecurityService = doctorSecurityService;
    }

    @GetMapping("/totp/status")
    public ResponseEntity<DoctorTotpStatusDto> getTotpStatus(Authentication authentication) {
        return ResponseEntity.ok(doctorSecurityService.getTotpStatus(requireUserId(authentication)));
    }

    @PostMapping("/totp/setup")
    public ResponseEntity<DoctorTotpSetupDto> issueTotpSetup(
            Authentication authentication,
            @RequestParam(defaultValue = "false") boolean regenerate) {
        return ResponseEntity.ok(doctorSecurityService.issueTotpSetup(requireUserId(authentication), regenerate));
    }

    @PostMapping("/totp/confirm")
    public ResponseEntity<DoctorTotpStatusDto> confirmTotp(
            Authentication authentication,
            @Valid @RequestBody ConfirmTotpRequest request) {
        return ResponseEntity.ok(
                doctorSecurityService.confirmTotp(requireUserId(authentication), request.code()));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordWithTotpRequest request) {
        doctorSecurityService.changePassword(
                requireUserId(authentication),
                request.currentPassword(),
                request.newPassword(),
                request.code());
        return ResponseEntity.ok(Map.of("message", "Da cap nhat mat khau"));
    }

    private UUID requireUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Thieu thong tin xac thuc");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UUID uuid) {
            return uuid;
        }
        if (principal instanceof String raw) {
            try {
                return UUID.fromString(raw);
            } catch (IllegalArgumentException ignored) {
                // Fall through to the shared error below.
            }
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Thong tin xac thuc khong hop le");
    }
}

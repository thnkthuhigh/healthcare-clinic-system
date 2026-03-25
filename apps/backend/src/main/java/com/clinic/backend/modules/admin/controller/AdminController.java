package com.clinic.backend.modules.admin.controller;

import com.clinic.backend.modules.admin.dto.DashboardStatsResponse;
import com.clinic.backend.modules.admin.dto.ShiftOverviewDto;
import com.clinic.backend.modules.admin.service.AdminService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class AdminController {
    private static final ZoneId CLINIC_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /**
     * Dashboard statistics for a given date (default: today)
     * GET /api/v1/admin/dashboard/stats?date=2026-03-05
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now(CLINIC_ZONE);
        return ResponseEntity.ok(adminService.getDashboardStats(date));
    }

    /**
     * Today's shift overview
     * GET /api/v1/admin/dashboard/shifts?date=2026-03-05
     */
    @GetMapping("/dashboard/shifts")
    public ResponseEntity<List<ShiftOverviewDto>> getTodayShifts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now(CLINIC_ZONE);
        return ResponseEntity.ok(adminService.getTodayShifts(date));
    }
}

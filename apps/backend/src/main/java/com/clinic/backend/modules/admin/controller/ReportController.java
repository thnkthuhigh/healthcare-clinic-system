package com.clinic.backend.modules.admin.controller;

import com.clinic.backend.modules.admin.dto.AuditLogDto;
import com.clinic.backend.modules.admin.dto.ReportSummaryDto;
import com.clinic.backend.modules.admin.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/reports")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * Get report summary (PRD §2.12).
     * GET /api/v1/admin/reports/summary?from=2026-03-01&to=2026-03-07
     */
    @GetMapping("/summary")
    public ResponseEntity<ReportSummaryDto> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from == null) from = LocalDate.now().withDayOfMonth(1);
        if (to == null) to = LocalDate.now();
        return ResponseEntity.ok(reportService.getSummary(from, to));
    }

    /**
     * Get audit logs (PRD §2.12).
     * GET /api/v1/admin/reports/audit?from=2026-03-01&to=2026-03-07&entityType=MEDICATION
     */
    @GetMapping("/audit")
    public ResponseEntity<List<AuditLogDto>> getAuditLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String entityType) {
        if (from == null) from = LocalDate.now().minusDays(7);
        if (to == null) to = LocalDate.now();
        return ResponseEntity.ok(reportService.getAuditLogs(from, to, entityType));
    }
}

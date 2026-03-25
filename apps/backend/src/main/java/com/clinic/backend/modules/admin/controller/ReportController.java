package com.clinic.backend.modules.admin.controller;

import com.clinic.backend.modules.admin.dto.AuditLogDto;
import com.clinic.backend.modules.admin.dto.DailyInvoiceDto;
import com.clinic.backend.modules.admin.dto.FinanceLedgerDto;
import com.clinic.backend.modules.admin.dto.FinanceSummaryDto;
import com.clinic.backend.modules.admin.dto.DoctorVisitStatsDto;
import com.clinic.backend.modules.admin.dto.ManualFinanceEntryRequest;
import com.clinic.backend.modules.admin.dto.ReportSummaryDto;
import com.clinic.backend.modules.admin.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/reports")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class ReportController {
    private static final ZoneId CLINIC_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    public ResponseEntity<ReportSummaryDto> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from == null) from = LocalDate.now(CLINIC_ZONE).withDayOfMonth(1);
        if (to == null) to = LocalDate.now(CLINIC_ZONE);
        return ResponseEntity.ok(reportService.getSummary(from, to));
    }

    @GetMapping("/finance")
    public ResponseEntity<List<FinanceLedgerDto>> getFinanceLedger(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String type) {
        if (from == null) from = LocalDate.now(CLINIC_ZONE).withDayOfMonth(1);
        if (to == null) to = LocalDate.now(CLINIC_ZONE);
        return ResponseEntity.ok(reportService.getFinanceLedger(from, to, category, type));
    }

    @GetMapping("/finance/summary")
    public ResponseEntity<FinanceSummaryDto> getFinanceSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from == null) from = LocalDate.now(CLINIC_ZONE).withDayOfMonth(1);
        if (to == null) to = LocalDate.now(CLINIC_ZONE);
        return ResponseEntity.ok(reportService.getFinanceSummary(from, to));
    }

    @PostMapping("/finance/manual")
    public ResponseEntity<FinanceLedgerDto> createManualFinanceEntry(@RequestBody ManualFinanceEntryRequest request) {
        return ResponseEntity.ok(reportService.createManualFinanceEntry(request));
    }

    @GetMapping("/daily-invoices")
    public ResponseEntity<List<DailyInvoiceDto>> getDailyInvoices(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now(CLINIC_ZONE);
        return ResponseEntity.ok(reportService.getDailyInvoices(date));
    }

    @GetMapping("/visits-by-doctor")
    public ResponseEntity<List<DoctorVisitStatsDto>> getVisitsByDoctor(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from == null) from = LocalDate.now(CLINIC_ZONE).withDayOfMonth(1);
        if (to == null) to = LocalDate.now(CLINIC_ZONE);
        return ResponseEntity.ok(reportService.getVisitsByDoctor(from, to));
    }

    @GetMapping("/audit")
    public ResponseEntity<List<AuditLogDto>> getAuditLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String action) {
        if (from == null) from = LocalDate.now(CLINIC_ZONE).minusDays(7);
        if (to == null) to = LocalDate.now(CLINIC_ZONE);
        return ResponseEntity.ok(reportService.getAuditLogs(from, to, entityType, action));
    }
}

package com.clinic.backend.modules.admin.controller;

import com.clinic.backend.modules.admin.dto.CheckInRequest;
import com.clinic.backend.modules.admin.dto.CreateVisitRequest;
import com.clinic.backend.modules.admin.dto.CreateVisitResponse;
import com.clinic.backend.modules.admin.dto.DispatchOptionDto;
import com.clinic.backend.modules.admin.dto.PatientLookupResponse;
import com.clinic.backend.modules.admin.dto.ReceptionBookingDto;
import com.clinic.backend.modules.admin.dto.WalkInRequest;
import com.clinic.backend.modules.admin.service.ReceptionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/reception")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class ReceptionController {
    private static final ZoneId CLINIC_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ReceptionService receptionService;

    public ReceptionController(ReceptionService receptionService) {
        this.receptionService = receptionService;
    }

    /**
     * Get all bookings for today (or given date), optionally filtered by shift.
     * GET /api/v1/admin/reception/bookings?date=2026-03-05&shiftId=xxx
     */
    @GetMapping("/bookings")
    public ResponseEntity<List<ReceptionBookingDto>> getTodayBookings(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) UUID shiftId) {
        if (date == null) date = LocalDate.now(CLINIC_ZONE);
        return ResponseEntity.ok(receptionService.getTodayBookings(date, shiftId));
    }

    /**
     * Search bookings by patient phone for check-in.
     * GET /api/v1/admin/reception/search?phone=0901234567&date=2026-03-05
     */
    @GetMapping("/search")
    public ResponseEntity<List<ReceptionBookingDto>> searchByPhone(
            @RequestParam String phone,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now(CLINIC_ZONE);
        return ResponseEntity.ok(receptionService.searchBookingsByPhone(phone, date));
    }

    /**
     * Lookup patient profile by phone for auto-dispatch reception form.
     * GET /api/v1/admin/reception/lookup?phone=0901234567
     */
    @GetMapping("/lookup")
    public ResponseEntity<PatientLookupResponse> lookupPatient(@RequestParam String phone) {
        return ResponseEntity.ok(receptionService.lookupPatient(phone));
    }

    /**
     * List dispatch options (doctor + shift + room) for selected service.
     * GET /api/v1/admin/reception/dispatch-options?serviceId=...
     */
    @GetMapping("/dispatch-options")
    public ResponseEntity<List<DispatchOptionDto>> getDispatchOptions(@RequestParam String serviceId) {
        return ResponseEntity.ok(receptionService.getDispatchOptions(serviceId));
    }

    /**
     * Check-in a web-booked patient: BOOKED → CHECKED_IN.
     * POST /api/v1/admin/reception/check-in
     */
    @PostMapping("/check-in")
    public ResponseEntity<ReceptionBookingDto> checkIn(@RequestBody CheckInRequest request) {
        if (request.getBookingId() == null || request.getBookingId().isBlank()) {
            throw new IllegalArgumentException("Thiếu mã lịch khám");
        }
        ReceptionBookingDto result = receptionService.checkIn(UUID.fromString(request.getBookingId()));
        return ResponseEntity.ok(result);
    }

    /**
     * Walk-in registration: create patient + booking with slot allocation (Logic A).
     * POST /api/v1/admin/reception/walk-in
     */
    @PostMapping("/walk-in")
    public ResponseEntity<Map<String, Object>> walkIn(@Valid @RequestBody WalkInRequest request) {
        Map<String, Object> result = receptionService.walkIn(
                request.getPatientName(),
                request.getPatientPhone(),
                request.getShiftId(),
                request.getServiceId());
        return ResponseEntity.ok(result);
    }

    /**
     * Auto dispatch reception flow by service.
     * POST /api/v1/admin/reception/create-visit
     */
    @PostMapping("/create-visit")
    public ResponseEntity<CreateVisitResponse> createVisit(@Valid @RequestBody CreateVisitRequest request) {
        return ResponseEntity.ok(receptionService.createVisit(request));
    }

    /**
     * Mark booking as NO_SHOW.
     * POST /api/v1/admin/reception/no-show/{bookingId}
     */
    @PostMapping("/no-show/{bookingId}")
    public ResponseEntity<Map<String, String>> markNoShow(@PathVariable UUID bookingId) {
        receptionService.markNoShow(bookingId);
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu NO_SHOW"));
    }
}

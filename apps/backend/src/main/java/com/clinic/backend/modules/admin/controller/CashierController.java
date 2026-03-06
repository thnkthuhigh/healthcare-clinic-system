package com.clinic.backend.modules.admin.controller;

import com.clinic.backend.modules.admin.dto.CashierBookingDto;
import com.clinic.backend.modules.admin.service.CashierService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/cashier")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class CashierController {

    private final CashierService cashierService;

    public CashierController(CashierService cashierService) {
        this.cashierService = cashierService;
    }

    /**
     * Get COMPLETED bookings for cashier queue.
     * GET /api/v1/admin/cashier/bookings?date=2026-03-06
     */
    @GetMapping("/bookings")
    public ResponseEntity<List<CashierBookingDto>> getCompletedBookings(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now();
        return ResponseEntity.ok(cashierService.getCompletedBookings(date));
    }

    /**
     * Get single booking detail for payment view.
     * GET /api/v1/admin/cashier/bookings/{bookingId}
     */
    @GetMapping("/bookings/{bookingId}")
    public ResponseEntity<CashierBookingDto> getBookingDetail(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(cashierService.getBookingForPayment(bookingId));
    }

    /**
     * Process payment — Logic C Step 2.
     * POST /api/v1/admin/cashier/pay/{bookingId}
     */
    @PostMapping("/pay/{bookingId}")
    public ResponseEntity<CashierBookingDto> processPayment(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(cashierService.processPayment(bookingId));
    }

    /**
     * Remove a prescription item before payment (cashier adjusts prescription).
     * DELETE /api/v1/admin/cashier/bookings/{bookingId}/items/{itemId}
     */
    @DeleteMapping("/bookings/{bookingId}/items/{itemId}")
    public ResponseEntity<CashierBookingDto> removePrescriptionItem(
            @PathVariable UUID bookingId, @PathVariable UUID itemId) {
        return ResponseEntity.ok(cashierService.removePrescriptionItem(bookingId, itemId));
    }

    /**
     * Manually trigger expiration of unpaid prescriptions (> 2 hours).
     * POST /api/v1/admin/cashier/expire-old
     */
    @PostMapping("/expire-old")
    public ResponseEntity<Map<String, Object>> expireOldPrescriptions() {
        int count = cashierService.expireOldPrescriptions();
        return ResponseEntity.ok(Map.of("expiredCount", count, "message", "Đã hủy " + count + " đơn thuốc quá hạn"));
    }
}

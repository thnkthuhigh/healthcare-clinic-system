package com.clinic.backend.modules.admin.controller;

import com.clinic.backend.modules.admin.dto.CashierBookingDto;
import com.clinic.backend.modules.admin.dto.RetailSaleRequest;
import com.clinic.backend.modules.admin.dto.RetailSaleResponse;
import com.clinic.backend.modules.admin.service.CashierService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping("/bookings")
    public ResponseEntity<List<CashierBookingDto>> getCompletedBookings(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now();
        return ResponseEntity.ok(cashierService.getCompletedBookings(date));
    }

    @GetMapping("/bookings/{bookingId}")
    public ResponseEntity<CashierBookingDto> getBookingDetail(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(cashierService.getBookingForPayment(bookingId));
    }

    @PostMapping("/pay/{bookingId}")
    public ResponseEntity<CashierBookingDto> processPayment(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(cashierService.processPayment(bookingId));
    }

    @DeleteMapping("/bookings/{bookingId}/items/{itemId}")
    public ResponseEntity<CashierBookingDto> removePrescriptionItem(
            @PathVariable UUID bookingId, @PathVariable UUID itemId) {
        return ResponseEntity.ok(cashierService.removePrescriptionItem(bookingId, itemId));
    }

    @PostMapping("/expire-old")
    public ResponseEntity<Map<String, Object>> expireOldPrescriptions() {
        int count = cashierService.expireOldPrescriptions();
        return ResponseEntity.ok(Map.of("expiredCount", count, "message", "Da huy " + count + " don thuoc qua han"));
    }

    @PostMapping("/retail-sale")
    public ResponseEntity<RetailSaleResponse> retailSale(@Valid @RequestBody RetailSaleRequest request) {
        return ResponseEntity.ok(cashierService.retailSale(request));
    }
}

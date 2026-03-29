package com.clinic.backend.modules.admin.controller;

import com.clinic.backend.modules.admin.dto.CashierBookingDto;
import com.clinic.backend.modules.admin.dto.ProcessPaymentRequest;
import com.clinic.backend.modules.admin.dto.RetailSaleRequest;
import com.clinic.backend.modules.admin.dto.RetailSaleResponse;
import com.clinic.backend.modules.admin.service.CashierService;
import com.clinic.backend.modules.payment.dto.PaymentRedirectResponse;
import com.clinic.backend.modules.payment.service.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/cashier")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'CASHIER')")
public class CashierController {
    private static final ZoneId CLINIC_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final CashierService cashierService;
    private final VnPayService vnPayService;

    public CashierController(CashierService cashierService, VnPayService vnPayService) {
        this.cashierService = cashierService;
        this.vnPayService = vnPayService;
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<CashierBookingDto>> getCompletedBookings(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now(CLINIC_ZONE);
        return ResponseEntity.ok(cashierService.getCompletedBookings(date));
    }

    @GetMapping("/bookings/{bookingId}")
    public ResponseEntity<CashierBookingDto> getBookingDetail(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(cashierService.getBookingForPayment(bookingId));
    }

    @PostMapping("/pay/{bookingId}")
    public ResponseEntity<CashierBookingDto> processPayment(
            @PathVariable UUID bookingId,
            @RequestBody(required = false) ProcessPaymentRequest request) {
        String method = request != null ? request.getMethod() : null;
        return ResponseEntity.ok(cashierService.processPayment(bookingId, method));
    }

    @PostMapping("/pay/{bookingId}/vnpay")
    public ResponseEntity<PaymentRedirectResponse> createVnpayPayment(
            @PathVariable UUID bookingId,
            HttpServletRequest request) {
        return ResponseEntity.ok(
                vnPayService.createCashierPayment(bookingId, resolveActorUserId(), resolveClientIp(request))
        );
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
    private UUID resolveActorUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UUID uuid) {
            return uuid;
        }
        if (principal instanceof String raw) {
            try {
                return UUID.fromString(raw);
            } catch (IllegalArgumentException ignored) {
                return null;
            }
        }
        return null;
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}

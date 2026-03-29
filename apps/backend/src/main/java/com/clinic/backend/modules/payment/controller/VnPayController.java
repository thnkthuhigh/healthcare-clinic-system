package com.clinic.backend.modules.payment.controller;

import com.clinic.backend.modules.payment.dto.VnPayMerchantResponse;
import com.clinic.backend.modules.payment.dto.VnPayQueryRequest;
import com.clinic.backend.modules.payment.dto.VnPayRefundRequest;
import com.clinic.backend.modules.payment.service.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments/vnpay")
public class VnPayController {

    private final VnPayService vnPayService;

    public VnPayController(VnPayService vnPayService) {
        this.vnPayService = vnPayService;
    }

    @GetMapping("/return")
    public ResponseEntity<Void> handleReturn(@RequestParam Map<String, String> params) {
        String redirectUrl = vnPayService.handleReturn(params);
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(redirectUrl));
        return ResponseEntity.status(302).headers(headers).build();
    }

    @GetMapping("/ipn")
    public ResponseEntity<Map<String, String>> handleIpn(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(new LinkedHashMap<>(vnPayService.handleIpn(params)));
    }

    @GetMapping("/mock/complete")
    public ResponseEntity<Void> handleMockComplete(@RequestParam Map<String, String> params) {
        String redirectUrl = vnPayService.handleMockComplete(params);
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(redirectUrl));
        return ResponseEntity.status(302).headers(headers).build();
    }

    @PostMapping("/transactions/query")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'CASHIER')")
    public ResponseEntity<VnPayMerchantResponse> queryTransaction(
            @Valid @RequestBody VnPayQueryRequest request,
            HttpServletRequest servletRequest) {
        return ResponseEntity.ok(vnPayService.queryTransaction(request, resolveClientIp(servletRequest)));
    }

    @PostMapping("/transactions/refund")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'CASHIER')")
    public ResponseEntity<VnPayMerchantResponse> refundTransaction(
            @Valid @RequestBody VnPayRefundRequest request,
            HttpServletRequest servletRequest,
            Authentication authentication) {
        return ResponseEntity.ok(
                vnPayService.refundTransaction(
                        request,
                        resolveClientIp(servletRequest),
                        resolveActorLabel(authentication, request.createBy())
                )
        );
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

    private String resolveActorLabel(Authentication authentication, String preferred) {
        if (preferred != null && !preferred.isBlank()) {
            return preferred;
        }
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return "system";
        }
        return authentication.getName();
    }
}

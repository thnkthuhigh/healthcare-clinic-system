package com.clinic.backend.modules.payment.dto;

import java.util.Map;

public record VnPayMerchantResponse(
        String command,
        boolean responseOk,
        boolean signatureValid,
        String responseCode,
        String transactionStatus,
        String message,
        Map<String, String> raw
) {}

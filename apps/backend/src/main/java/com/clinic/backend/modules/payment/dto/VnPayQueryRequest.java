package com.clinic.backend.modules.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record VnPayQueryRequest(
        @NotBlank(message = "TxnRef khong duoc de trong")
        @Size(max = 100, message = "TxnRef khong duoc vuot qua 100 ky tu")
        String txnRef,

        @Pattern(regexp = "\\d{14}", message = "TransactionDate phai theo dinh dang yyyyMMddHHmmss")
        String transactionDate,

        @Size(max = 15, message = "TransactionNo khong duoc vuot qua 15 ky tu")
        String transactionNo,

        @Size(max = 255, message = "OrderInfo khong duoc vuot qua 255 ky tu")
        String orderInfo
) {}

package com.clinic.backend.modules.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record VnPayRefundRequest(
        @NotBlank(message = "TxnRef khong duoc de trong")
        @Size(max = 100, message = "TxnRef khong duoc vuot qua 100 ky tu")
        String txnRef,

        @Pattern(regexp = "\\d{14}", message = "TransactionDate phai theo dinh dang yyyyMMddHHmmss")
        String transactionDate,

        @NotNull(message = "AmountCents khong duoc de trong")
        @Positive(message = "AmountCents phai lon hon 0")
        Integer amountCents,

        @NotBlank(message = "TransactionType khong duoc de trong")
        @Pattern(regexp = "0[23]", message = "TransactionType chi chap nhan 02 hoac 03")
        String transactionType,

        @Size(max = 15, message = "TransactionNo khong duoc vuot qua 15 ky tu")
        String transactionNo,

        @Size(max = 255, message = "OrderInfo khong duoc vuot qua 255 ky tu")
        String orderInfo,

        @Size(max = 245, message = "CreateBy khong duoc vuot qua 245 ky tu")
        String createBy
) {}

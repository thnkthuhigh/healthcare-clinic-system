package com.clinic.backend.modules.payment.service;

import com.clinic.backend.modules.admin.dto.CashierBookingDto;
import com.clinic.backend.modules.admin.service.CashierService;
import com.clinic.backend.modules.customer.dto.BookingTicketDto;
import com.clinic.backend.modules.customer.service.CustomerBookingService;
import com.clinic.backend.modules.doctor.entity.Booking;
import com.clinic.backend.modules.doctor.repository.BookingRepository;
import com.clinic.backend.modules.payment.dto.PaymentRedirectResponse;
import com.clinic.backend.modules.payment.dto.VnPayMerchantResponse;
import com.clinic.backend.modules.payment.dto.VnPayQueryRequest;
import com.clinic.backend.modules.payment.dto.VnPayRefundRequest;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

@Service
public class VnPayService {
    private static final ZoneId CLINIC_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VNPAY_DATE_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final int BOOKING_FEE_TXN_LENGTH = 48;
    private static final int CASHIER_TXN_LENGTH = 80;
    private static final String VNPAY_VERSION = "2.1.0";
    private static final TypeReference<LinkedHashMap<String, Object>> RAW_RESPONSE_TYPE = new TypeReference<>() {};

    private final BookingRepository bookingRepository;
    private final CustomerBookingService customerBookingService;
    private final CashierService cashierService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String tmnCode;
    private final String hashSecret;
    private final String paymentUrl;
    private final String apiUrl;
    private final String returnUrl;
    private final String frontendBaseUrl;
    private final int expireMinutes;
    private final boolean mockEnabled;

    public VnPayService(
            BookingRepository bookingRepository,
            CustomerBookingService customerBookingService,
            CashierService cashierService,
            ObjectMapper objectMapper,
            @Value("${app.vnpay.tmn-code:}") String tmnCode,
            @Value("${app.vnpay.hash-secret:}") String hashSecret,
            @Value("${app.vnpay.payment-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}") String paymentUrl,
            @Value("${app.vnpay.api-url:https://sandbox.vnpayment.vn/merchant_webapi/api/transaction}") String apiUrl,
            @Value("${app.vnpay.return-url:http://localhost:4000/api/v1/payments/vnpay/return}") String returnUrl,
            @Value("${app.vnpay.frontend-base-url:http://localhost:3000}") String frontendBaseUrl,
            @Value("${app.vnpay.expire-minutes:15}") int expireMinutes,
            @Value("${app.vnpay.mock-enabled:true}") boolean mockEnabled) {
        this.bookingRepository = bookingRepository;
        this.customerBookingService = customerBookingService;
        this.cashierService = cashierService;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
        this.tmnCode = tmnCode == null ? "" : tmnCode.trim();
        this.hashSecret = hashSecret == null ? "" : hashSecret.trim();
        this.paymentUrl = paymentUrl == null ? "" : paymentUrl.trim();
        this.apiUrl = apiUrl == null ? "" : apiUrl.trim();
        this.returnUrl = returnUrl == null ? "" : returnUrl.trim();
        this.frontendBaseUrl = normalizeBaseUrl(frontendBaseUrl);
        this.expireMinutes = expireMinutes <= 0 ? 15 : expireMinutes;
        this.mockEnabled = mockEnabled;
    }

    public boolean isConfigured() {
        return !tmnCode.isBlank()
                && !hashSecret.isBlank()
                && !paymentUrl.isBlank()
                && !apiUrl.isBlank()
                && !returnUrl.isBlank();
    }

    public PaymentRedirectResponse createBookingFeePayment(UUID bookingId, String clientIp) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay lich kham"));

        if (booking.getBookingFeePaidAt() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lich kham da thanh toan phi dat lich");
        }
        if (booking.getStatus() == Booking.BookingStatus.CANCELED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lich hen da bi huy");
        }

        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(expireMinutes * 60L);
        String txnRef = buildBookingFeeTxnRef(bookingId, now);
        String orderInfo = sanitizeOrderInfo("Thanh toan phi dat lich " + shortCode(bookingId));
        if (!isConfigured()) {
            return createMockPaymentResponse(txnRef, booking.getBookingFeeCents(), orderInfo, expiresAt);
        }
        String url = buildPaymentUrl(txnRef, booking.getBookingFeeCents(), orderInfo, normalizeIp(clientIp), now, expiresAt);
        return new PaymentRedirectResponse("VNPAY", url, expiresAt);
    }

    public PaymentRedirectResponse createCashierPayment(UUID bookingId, UUID actorUserId, String clientIp) {
        CashierBookingDto booking = cashierService.getBookingForPayment(bookingId);
        if (!canCreateCashierGatewayPayment(booking)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lich kham nay chua san sang thanh toan VNPAY");
        }
        if ("PAID".equals(booking.getPaymentStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lich kham da duoc thanh toan");
        }

        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(expireMinutes * 60L);
        String txnRef = buildCashierTxnRef(bookingId, actorUserId, now);
        String orderInfo = sanitizeOrderInfo("Thanh toan hoa don kham " + shortCode(bookingId));
        if (!isConfigured()) {
            return createMockPaymentResponse(txnRef, booking.getTotalBillCents(), orderInfo, expiresAt);
        }
        String url = buildPaymentUrl(txnRef, booking.getTotalBillCents(), orderInfo, normalizeIp(clientIp), now, expiresAt);
        return new PaymentRedirectResponse("VNPAY", url, expiresAt);
    }

    public VnPayMerchantResponse queryTransaction(VnPayQueryRequest request, String clientIp) {
        requireConfigured();

        String txnRef = normalizeTxnRef(request.txnRef());
        String transactionDate = resolveTransactionDate(txnRef, request.transactionDate());
        String orderInfo = sanitizeOrderInfo(firstNonBlank(request.orderInfo(), "Kiem tra giao dich " + shortTxnRef(txnRef)));
        String requestId = createRequestId();
        String createDate = formatVnpayDate(Instant.now());
        String ip = normalizeIp(clientIp);

        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_RequestId", requestId);
        params.put("vnp_Version", VNPAY_VERSION);
        params.put("vnp_Command", "querydr");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", orderInfo);
        if (request.transactionNo() != null && !request.transactionNo().isBlank()) {
            params.put("vnp_TransactionNo", request.transactionNo().trim());
        }
        params.put("vnp_TransactionDate", transactionDate);
        params.put("vnp_CreateDate", createDate);
        params.put("vnp_IpAddr", ip);
        params.put("vnp_SecureHash", hmacSha512(
                hashSecret,
                String.join("|", requestId, VNPAY_VERSION, "querydr", tmnCode, txnRef, transactionDate, createDate, ip, orderInfo)
        ));

        return postMerchantRequest("querydr", params);
    }

    public VnPayMerchantResponse refundTransaction(VnPayRefundRequest request, String clientIp, String actorLabel) {
        requireConfigured();

        String txnRef = normalizeTxnRef(request.txnRef());
        String transactionDate = resolveTransactionDate(txnRef, request.transactionDate());
        String requestId = createRequestId();
        String createDate = formatVnpayDate(Instant.now());
        String ip = normalizeIp(clientIp);
        String createBy = sanitizeCreatedBy(firstNonBlank(request.createBy(), actorLabel, "system"));
        String transactionNo = request.transactionNo() == null ? "" : request.transactionNo().trim();
        String orderInfo = sanitizeOrderInfo(firstNonBlank(request.orderInfo(), "Hoan tien giao dich " + shortTxnRef(txnRef)));

        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_RequestId", requestId);
        params.put("vnp_Version", VNPAY_VERSION);
        params.put("vnp_Command", "refund");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_TransactionType", request.transactionType());
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_Amount", String.valueOf(request.amountCents()));
        params.put("vnp_OrderInfo", orderInfo);
        if (!transactionNo.isBlank()) {
            params.put("vnp_TransactionNo", transactionNo);
        }
        params.put("vnp_TransactionDate", transactionDate);
        params.put("vnp_CreateBy", createBy);
        params.put("vnp_CreateDate", createDate);
        params.put("vnp_IpAddr", ip);
        params.put("vnp_SecureHash", hmacSha512(
                hashSecret,
                String.join(
                        "|",
                        requestId,
                        VNPAY_VERSION,
                        "refund",
                        tmnCode,
                        request.transactionType(),
                        txnRef,
                        String.valueOf(request.amountCents()),
                        transactionNo,
                        transactionDate,
                        createBy,
                        createDate,
                        ip,
                        orderInfo
                )
        ));

        return postMerchantRequest("refund", params);
    }

    @Transactional
    public String handleReturn(Map<String, String> queryParams) {
        VerificationResult result = verifyAndApply(queryParams);
        return buildFrontendRedirectUrl(result);
    }

    @Transactional
    public Map<String, String> handleIpn(Map<String, String> queryParams) {
        VerificationResult result = verifyAndApply(queryParams);
        if (!result.signatureValid()) {
            return Map.of("RspCode", "97", "Message", "Invalid Signature");
        }
        if (result.reference() == null) {
            return Map.of("RspCode", "01", "Message", "Order not Found");
        }
        if (!result.amountValid()) {
            return Map.of("RspCode", "04", "Message", "Invalid Amount");
        }
        if (result.alreadyConfirmed()) {
            return Map.of("RspCode", "02", "Message", "Order Already Update");
        }
        return Map.of("RspCode", "00", "Message", "Confirm Success");
    }

    @Transactional
    public String handleMockComplete(Map<String, String> params) {
        String txnRef = normalizeTxnRef(firstNonBlank(params.get("txnRef"), params.get("vnp_TxnRef")));
        PaymentReference reference = parseReference(txnRef);
        if (reference == null) {
            return UriBuilder.build(frontendBaseUrl + "/booking/payment-result", Map.of(
                    "status", "invalid",
                    "message", "Giao dich mock khong hop le"
            ));
        }

        String status = firstNonBlank(params.get("status"), "");
        String confirmation = firstNonBlank(params.get("confirmed"), "");
        String bankCode = firstNonBlank(params.get("bankCode"), "VNPAYQR");
        Instant paidAt = Instant.now();

        VerificationResult result;
        if (!"1".equals(confirmation) && !"true".equalsIgnoreCase(confirmation)) {
            result = new VerificationResult(
                    true,
                    true,
                    false,
                    false,
                    false,
                    reference,
                    reference.bookingId(),
                    "Chua xac nhan thanh toan mock VNPAY"
            );
        } else if (!"success".equalsIgnoreCase(status)) {
            result = new VerificationResult(
                    true,
                    true,
                    false,
                    false,
                    false,
                    reference,
                    reference.bookingId(),
                    "Da huy thanh toan mock VNPAY"
            );
        } else {
            result = applyMockSuccess(reference, paidAt, bankCode);
        }

        return buildFrontendRedirectUrl(result);
    }

    private VerificationResult verifyAndApply(Map<String, String> rawParams) {
        Map<String, String> params = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : rawParams.entrySet()) {
            if (entry.getKey() != null && entry.getKey().startsWith("vnp_")) {
                params.put(entry.getKey(), entry.getValue());
            }
        }

        String secureHash = firstNonBlank(params.get("vnp_SecureHash"), params.get("vnp_secure_hash"));
        boolean signatureValid = validateSignature(params, secureHash);
        PaymentReference reference = parseReference(firstNonBlank(params.get("vnp_TxnRef"), params.get("vnp_txn_ref")));

        if (!signatureValid || reference == null) {
            return new VerificationResult(signatureValid, false, false, false, false, reference, null, "Chu ky khong hop le");
        }

        int responseAmount = parseInt(firstNonBlank(params.get("vnp_Amount"), params.get("vnp_amount")));
        String responseCode = firstNonBlank(params.get("vnp_ResponseCode"), params.get("vnp_response_code"));
        String transactionStatus = firstNonBlank(params.get("vnp_TransactionStatus"), params.get("vnp_transaction_status"));
        boolean success = "00".equals(responseCode) && "00".equals(transactionStatus);
        Instant paidAt = parsePayDate(firstNonBlank(params.get("vnp_PayDate"), params.get("vnp_pay_date")));

        try {
            return switch (reference.scope()) {
                case BOOKING_FEE -> verifyBookingFee(reference, responseAmount, success, paidAt);
                case CASHIER_PAYMENT -> verifyCashierPayment(reference, responseAmount, success, paidAt);
            };
        } catch (ResponseStatusException ex) {
            return new VerificationResult(true, false, success, false, false, reference, null, ex.getReason());
        } catch (IllegalArgumentException ex) {
            return new VerificationResult(true, false, success, false, false, reference, null, ex.getMessage());
        }
    }

    private VerificationResult verifyBookingFee(PaymentReference reference, int responseAmount, boolean success, Instant paidAt) {
        Booking booking = bookingRepository.findByIdWithDetails(reference.bookingId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay lich kham"));
        int expectedAmount = booking.getBookingFeeCents() != null ? booking.getBookingFeeCents() : 1_000_000;
        if (responseAmount != expectedAmount) {
            return new VerificationResult(true, false, success, false, false, reference, booking.getId(), "So tien khong khop");
        }
        boolean alreadyConfirmed = booking.getBookingFeePaidAt() != null;
        if (success && !alreadyConfirmed) {
            BookingTicketDto ticket = customerBookingService.processBookingFeeFromGateway(booking.getId(), paidAt);
            return new VerificationResult(true, true, true, true, false, reference, ticket.bookingId(), "Thanh toan thanh cong");
        }
        return new VerificationResult(
                true,
                true,
                success,
                false,
                alreadyConfirmed,
                reference,
                booking.getId(),
                alreadyConfirmed ? "Giao dich da duoc ghi nhan truoc do" : "Thanh toan that bai"
        );
    }

    private VerificationResult verifyCashierPayment(PaymentReference reference, int responseAmount, boolean success, Instant paidAt) {
        CashierBookingDto booking = cashierService.getBookingForPayment(reference.bookingId());
        if (!canCreateCashierGatewayPayment(booking) && !"PAID".equals(booking.getPaymentStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lich kham chua san sang thanh toan");
        }
        int expectedAmount = booking.getTotalBillCents();
        if (responseAmount != expectedAmount) {
            return new VerificationResult(true, false, success, false, false, reference, booking.getBookingId(), "So tien khong khop");
        }
        boolean alreadyConfirmed = "PAID".equals(booking.getPaymentStatus());
        if (success && !alreadyConfirmed) {
            CashierBookingDto updated = cashierService.processPaymentFromGateway(booking.getBookingId(), reference.actorUserId(), paidAt);
            return new VerificationResult(true, true, true, true, false, reference, updated.getBookingId(), "Thanh toan thanh cong");
        }
        return new VerificationResult(
                true,
                true,
                success,
                false,
                alreadyConfirmed,
                reference,
                booking.getBookingId(),
                alreadyConfirmed ? "Giao dich da duoc ghi nhan truoc do" : "Thanh toan that bai"
        );
    }

    private String buildFrontendRedirectUrl(VerificationResult result) {
        if (result.reference() == null || result.bookingId() == null) {
            return UriBuilder.build(frontendBaseUrl + "/booking/payment-result", Map.of(
                    "status", "invalid",
                    "message", safeMessage(result.message())
            ));
        }

        String paymentStatus = resolveFrontendStatus(result);

        if (result.reference().scope() == PaymentScope.BOOKING_FEE) {
            return UriBuilder.build(frontendBaseUrl + "/booking/payment-result", Map.of(
                    "status", paymentStatus,
                    "bookingId", result.bookingId().toString(),
                    "message", safeMessage(result.message())
            ));
        }

        return UriBuilder.build(frontendBaseUrl + "/admin/cashier", Map.of(
                "paymentResult", paymentStatus,
                "bookingId", result.bookingId().toString(),
                "message", safeMessage(result.message()),
                "gateway", "VNPAY"
        ));
    }

    private PaymentRedirectResponse createMockPaymentResponse(
            String txnRef,
            Integer amountCents,
            String orderInfo,
            Instant expiresAt
    ) {
        if (!mockEnabled) {
            requireConfigured();
        }
        String paymentUrl = UriBuilder.build(frontendBaseUrl + "/payment/mock-vnpay", Map.of(
                "txnRef", txnRef,
                "amount", amountCents == null ? "" : String.valueOf(amountCents),
                "orderInfo", orderInfo,
                "expiresAt", expiresAt.toString()
        ));
        return new PaymentRedirectResponse("VNPAY_MOCK", paymentUrl, expiresAt);
    }

    private VerificationResult applyMockSuccess(PaymentReference reference, Instant paidAt, String bankCode) {
        String paymentLabel = switch (firstNonBlank(bankCode, "VNPAYQR").toUpperCase(Locale.ROOT)) {
            case "VNBANK" -> "ATM noi dia";
            case "INTCARD" -> "The quoc te";
            default -> "QR";
        };

        return switch (reference.scope()) {
            case BOOKING_FEE -> {
                BookingTicketDto ticket = customerBookingService.processBookingFeeFromGateway(reference.bookingId(), paidAt);
                yield new VerificationResult(
                        true,
                        true,
                        true,
                        true,
                        false,
                        reference,
                        ticket.bookingId(),
                        "Thanh toan mock VNPAY thanh cong qua " + paymentLabel
                );
            }
            case CASHIER_PAYMENT -> {
                CashierBookingDto updated = cashierService.processPaymentFromGateway(reference.bookingId(), reference.actorUserId(), paidAt);
                yield new VerificationResult(
                        true,
                        true,
                        true,
                        true,
                        false,
                        reference,
                        updated.getBookingId(),
                        "Thanh toan mock VNPAY thanh cong qua " + paymentLabel
                );
            }
        };
    }

    private String buildPaymentUrl(
            String txnRef,
            Integer amountCents,
            String orderInfo,
            String clientIp,
            Instant now,
            Instant expiresAt
    ) {
        if (amountCents == null || amountCents <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "So tien thanh toan khong hop le");
        }

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Amount", String.valueOf(amountCents));
        params.put("vnp_Command", "pay");
        params.put("vnp_CreateDate", formatVnpayDate(now));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_ExpireDate", formatVnpayDate(expiresAt));
        params.put("vnp_IpAddr", clientIp);
        params.put("vnp_Locale", "vn");
        params.put("vnp_OrderInfo", orderInfo);
        params.put("vnp_OrderType", "other");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_Version", VNPAY_VERSION);

        String query = buildQuery(params);
        String secureHash = hmacSha512(hashSecret, query);
        return paymentUrl + "?" + query + "&vnp_SecureHash=" + urlEncode(secureHash);
    }

    private boolean canCreateCashierGatewayPayment(CashierBookingDto booking) {
        if (booking == null) {
            return false;
        }
        if ("COMPLETED".equals(booking.getStatus())) {
            return true;
        }
        return "WEB".equals(booking.getChannel())
                && booking.getBookingFeePaidAt() != null
                && !"CANCELED".equals(booking.getStatus())
                && !"NO_SHOW".equals(booking.getStatus());
    }

    private VnPayMerchantResponse postMerchantRequest(String command, Map<String, String> params) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(params)))
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
            );
            Map<String, String> raw = parseMerchantResponse(response.body());
            if (response.statusCode() >= 400) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        firstNonBlank(raw.get("vnp_Message"), raw.get("message"), "VNPAY merchant API tra ve loi")
                );
            }

            boolean signatureValid = validateMerchantResponseSignature(command, raw);
            String responseCode = firstNonBlank(raw.get("vnp_ResponseCode"), raw.get("responseCode"));
            String transactionStatus = firstNonBlank(raw.get("vnp_TransactionStatus"), raw.get("transactionStatus"));
            String message = firstNonBlank(raw.get("vnp_Message"), raw.get("message"), "Khong nhan duoc phan hoi hop le tu VNPAY");
            boolean responseOk = signatureValid && "00".equals(responseCode);

            return new VnPayMerchantResponse(command, responseOk, signatureValid, responseCode, transactionStatus, message, raw);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Khong doc duoc phan hoi VNPAY", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Yeu cau toi VNPAY bi gian doan", ex);
        }
    }

    private Map<String, String> parseMerchantResponse(String body) throws IOException {
        LinkedHashMap<String, Object> parsed = objectMapper.readValue(body, RAW_RESPONSE_TYPE);
        Map<String, String> raw = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : parsed.entrySet()) {
            raw.put(entry.getKey(), entry.getValue() == null ? "" : String.valueOf(entry.getValue()));
        }
        return raw;
    }

    private boolean validateMerchantResponseSignature(String command, Map<String, String> raw) {
        String secureHash = raw.get("vnp_SecureHash");
        if (secureHash == null || secureHash.isBlank()) {
            return false;
        }

        String data = switch (command) {
            case "querydr" -> String.join(
                    "|",
                    raw.getOrDefault("vnp_ResponseId", ""),
                    raw.getOrDefault("vnp_Command", ""),
                    raw.getOrDefault("vnp_ResponseCode", ""),
                    raw.getOrDefault("vnp_Message", ""),
                    raw.getOrDefault("vnp_TmnCode", ""),
                    raw.getOrDefault("vnp_TxnRef", ""),
                    raw.getOrDefault("vnp_Amount", ""),
                    raw.getOrDefault("vnp_BankCode", ""),
                    raw.getOrDefault("vnp_PayDate", ""),
                    raw.getOrDefault("vnp_TransactionNo", ""),
                    raw.getOrDefault("vnp_TransactionType", ""),
                    raw.getOrDefault("vnp_TransactionStatus", ""),
                    raw.getOrDefault("vnp_OrderInfo", ""),
                    raw.getOrDefault("vnp_PromotionCode", ""),
                    raw.getOrDefault("vnp_PromotionAmount", "")
            );
            case "refund" -> String.join(
                    "|",
                    raw.getOrDefault("vnp_ResponseId", ""),
                    raw.getOrDefault("vnp_Command", ""),
                    raw.getOrDefault("vnp_ResponseCode", ""),
                    raw.getOrDefault("vnp_Message", ""),
                    raw.getOrDefault("vnp_TmnCode", ""),
                    raw.getOrDefault("vnp_TxnRef", ""),
                    raw.getOrDefault("vnp_Amount", ""),
                    raw.getOrDefault("vnp_BankCode", ""),
                    raw.getOrDefault("vnp_PayDate", ""),
                    raw.getOrDefault("vnp_TransactionNo", ""),
                    raw.getOrDefault("vnp_TransactionType", ""),
                    raw.getOrDefault("vnp_TransactionStatus", ""),
                    raw.getOrDefault("vnp_OrderInfo", "")
            );
            default -> "";
        };

        if (data.isBlank()) {
            return false;
        }

        return hmacSha512(hashSecret, data).equalsIgnoreCase(secureHash);
    }

    private boolean validateSignature(Map<String, String> params, String secureHash) {
        if (secureHash == null || secureHash.isBlank()) {
            return false;
        }
        Map<String, String> filtered = new TreeMap<>();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String key = entry.getKey();
            if ("vnp_SecureHash".equals(key) || "vnp_SecureHashType".equals(key)
                    || "vnp_secure_hash".equals(key) || "vnp_secure_hashtype".equals(key)) {
                continue;
            }
            if (entry.getValue() != null && !entry.getValue().isBlank()) {
                filtered.put(key, entry.getValue());
            }
        }
        String data = buildQuery(filtered);
        String expected = hmacSha512(hashSecret, data);
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), secureHash.getBytes(StandardCharsets.UTF_8));
    }

    private String buildQuery(Map<String, String> params) {
        StringBuilder builder = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (!first) {
                builder.append('&');
            }
            builder.append(urlEncode(entry.getKey())).append('=').append(urlEncode(entry.getValue()));
            first = false;
        }
        return builder.toString();
    }

    private PaymentReference parseReference(String txnRef) {
        if (txnRef == null || txnRef.isBlank()) {
            return null;
        }
        if (txnRef.startsWith("BF") && txnRef.length() == BOOKING_FEE_TXN_LENGTH) {
            UUID bookingId = fromHexUuid(txnRef.substring(2, 34));
            return bookingId == null ? null : new PaymentReference(PaymentScope.BOOKING_FEE, bookingId, null);
        }
        if (txnRef.startsWith("CP") && txnRef.length() == CASHIER_TXN_LENGTH) {
            UUID bookingId = fromHexUuid(txnRef.substring(2, 34));
            UUID actorUserId = fromHexUuid(txnRef.substring(34, 66));
            return bookingId == null ? null : new PaymentReference(PaymentScope.CASHIER_PAYMENT, bookingId, actorUserId);
        }
        return null;
    }

    private String normalizeTxnRef(String txnRef) {
        if (txnRef == null || txnRef.isBlank()) {
            throw new IllegalArgumentException("TxnRef khong duoc de trong");
        }
        return txnRef.trim();
    }

    private String buildBookingFeeTxnRef(UUID bookingId, Instant now) {
        return "BF" + toHexUuid(bookingId) + formatVnpayDate(now);
    }

    private String buildCashierTxnRef(UUID bookingId, UUID actorUserId, Instant now) {
        UUID normalizedActor = actorUserId != null ? actorUserId : new UUID(0L, 0L);
        return "CP" + toHexUuid(bookingId) + toHexUuid(normalizedActor) + formatVnpayDate(now);
    }

    private String shortCode(UUID bookingId) {
        return bookingId.toString().substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private String shortTxnRef(String txnRef) {
        if (txnRef == null || txnRef.isBlank()) {
            return "khong-ro";
        }
        return txnRef.length() <= 12 ? txnRef : txnRef.substring(0, 12);
    }

    private String normalizeAscii(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .replaceAll("[^A-Za-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String sanitizeOrderInfo(String value) {
        String normalized = normalizeAscii(value);
        if (normalized.isBlank()) {
            return "Thanh toan dich vu y te";
        }
        return normalized.length() > 255 ? normalized.substring(0, 255) : normalized;
    }

    private String sanitizeCreatedBy(String value) {
        String normalized = normalizeAscii(value);
        if (normalized.isBlank()) {
            return "system";
        }
        return normalized.length() > 245 ? normalized.substring(0, 245) : normalized;
    }

    private String normalizeIp(String clientIp) {
        if (clientIp == null || clientIp.isBlank()) {
            return "127.0.0.1";
        }
        return clientIp;
    }

    private String normalizeBaseUrl(String raw) {
        String normalized = raw == null || raw.isBlank() ? "http://localhost:3000" : raw.trim();
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private String safeMessage(String value) {
        if (value == null || value.isBlank()) {
            return "Co loi xay ra trong qua trinh xu ly thanh toan";
        }
        return value;
    }

    private void requireConfigured() {
        if (!isConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "VNPAY chua duoc cau hinh");
        }
    }

    private String resolveFrontendStatus(VerificationResult result) {
        if (!result.signatureValid()) {
            return "invalid";
        }
        if (result.completed() || result.alreadyConfirmed()) {
            return "success";
        }
        return "failed";
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private int parseInt(String value) {
        if (value == null || value.isBlank()) {
            return 0;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private Instant parsePayDate(String value) {
        if (value == null || value.isBlank()) {
            return Instant.now();
        }
        try {
            return LocalDateTime.parse(value, VNPAY_DATE_TIME).atZone(CLINIC_ZONE).toInstant();
        } catch (Exception ex) {
            return Instant.now();
        }
    }

    private String formatVnpayDate(Instant instant) {
        return VNPAY_DATE_TIME.format(LocalDateTime.ofInstant(instant, CLINIC_ZONE));
    }

    private String resolveTransactionDate(String txnRef, String explicitDate) {
        if (explicitDate != null && explicitDate.matches("\\d{14}")) {
            return explicitDate;
        }
        if (txnRef != null && txnRef.length() >= 14) {
            String suffix = txnRef.substring(txnRef.length() - 14);
            if (suffix.matches("\\d{14}")) {
                return suffix;
            }
        }
        throw new IllegalArgumentException("Khong xac dinh duoc transactionDate tu txnRef");
    }

    private String createRequestId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase(Locale.ROOT);
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String hmacSha512(String secret, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            hmac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(bytes.length * 2);
            for (byte item : bytes) {
                builder.append(String.format("%02x", item));
            }
            return builder.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Khong the tao chu ky VNPAY", ex);
        }
    }

    private String toHexUuid(UUID value) {
        return value.toString().replace("-", "");
    }

    private UUID fromHexUuid(String value) {
        if (value == null || value.length() != 32) {
            return null;
        }
        String normalized = value.substring(0, 8) + "-"
                + value.substring(8, 12) + "-"
                + value.substring(12, 16) + "-"
                + value.substring(16, 20) + "-"
                + value.substring(20);
        try {
            UUID uuid = UUID.fromString(normalized);
            if (uuid.getMostSignificantBits() == 0L && uuid.getLeastSignificantBits() == 0L) {
                return null;
            }
            return uuid;
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private enum PaymentScope {
        BOOKING_FEE,
        CASHIER_PAYMENT
    }

    private record PaymentReference(PaymentScope scope, UUID bookingId, UUID actorUserId) {}

    private record VerificationResult(
            boolean signatureValid,
            boolean amountValid,
            boolean success,
            boolean completed,
            boolean alreadyConfirmed,
            PaymentReference reference,
            UUID bookingId,
            String message
    ) {}

    private static final class UriBuilder {
        private UriBuilder() {
        }

        private static String build(String baseUrl, Map<String, String> params) {
            StringBuilder builder = new StringBuilder(baseUrl);
            boolean first = !baseUrl.contains("?");
            for (Map.Entry<String, String> entry : params.entrySet()) {
                if (entry.getValue() == null || entry.getValue().isBlank()) {
                    continue;
                }
                builder.append(first ? '?' : '&');
                builder.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8));
                builder.append('=');
                builder.append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
                first = false;
            }
            return builder.toString();
        }
    }
}

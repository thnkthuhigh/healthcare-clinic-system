package com.clinic.backend.modules.customer.controller;

import com.clinic.backend.modules.customer.dto.AvailableShiftDto;
import com.clinic.backend.modules.customer.dto.BookingFeePaymentRequest;
import com.clinic.backend.modules.customer.dto.BookingTicketDto;
import com.clinic.backend.modules.customer.dto.CreateBookingRequest;
import com.clinic.backend.modules.customer.dto.DoctorSummaryDto;
import com.clinic.backend.modules.customer.dto.PatientSummaryDto;
import com.clinic.backend.modules.customer.dto.RatingRequest;
import com.clinic.backend.modules.customer.service.CustomerBookingService;
import com.clinic.backend.modules.doctor.entity.Booking;
import com.clinic.backend.modules.doctor.repository.ServiceRepository;
import com.clinic.backend.modules.payment.dto.PaymentRedirectResponse;
import com.clinic.backend.modules.payment.service.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/customer")
public class CustomerController {
    private static final ZoneId CLINIC_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final CustomerBookingService bookingService;
    private final ServiceRepository serviceRepository;
    private final VnPayService vnPayService;

    public CustomerController(CustomerBookingService bookingService,
                              ServiceRepository serviceRepository,
                              VnPayService vnPayService) {
        this.bookingService = bookingService;
        this.serviceRepository = serviceRepository;
        this.vnPayService = vnPayService;
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorSummaryDto>> getDoctors(
            @RequestParam(required = false) UUID serviceId) {
        return ResponseEntity.ok(bookingService.getAllDoctors(serviceId));
    }

    @GetMapping("/doctors/{doctorId}/shifts")
    public ResponseEntity<List<AvailableShiftDto>> getAvailableShifts(
            @PathVariable UUID doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        LocalDate queryDate = date != null ? date : LocalDate.now(CLINIC_ZONE);
        return ResponseEntity.ok(bookingService.getAvailableShifts(doctorId, queryDate));
    }

    @GetMapping("/services")
    public ResponseEntity<List<Map<String, Object>>> getServices() {
        List<Map<String, Object>> result = serviceRepository.findAllActive().stream()
                .map(s -> Map.<String, Object>of(
                        "id", s.getId(),
                        "name", s.getName(),
                        "priceCents", s.getPriceCents()))
                .toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/bookings")
    public ResponseEntity<BookingTicketDto> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        BookingTicketDto ticket = bookingService.createBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    @PostMapping("/bookings/{bookingId}/pay")
    public ResponseEntity<BookingTicketDto> processPayment(
            @PathVariable UUID bookingId,
            @RequestBody(required = false) BookingFeePaymentRequest request) {
        Booking.PaymentMethod method = parsePaymentMethod(request);
        return ResponseEntity.ok(bookingService.processBookingFee(bookingId, method));
    }

    @PostMapping("/bookings/{bookingId}/pay/vnpay")
    public ResponseEntity<PaymentRedirectResponse> createVnpayPayment(
            @PathVariable UUID bookingId,
            HttpServletRequest request) {
        return ResponseEntity.ok(vnPayService.createBookingFeePayment(bookingId, resolveClientIp(request)));
    }

    private Booking.PaymentMethod parsePaymentMethod(BookingFeePaymentRequest request) {
        if (request == null || request.method() == null || request.method().isBlank()) {
            return Booking.PaymentMethod.QR;
        }

        try {
            return Booking.PaymentMethod.valueOf(request.method().trim().toUpperCase());
        } catch (IllegalArgumentException ignored) {
            return Booking.PaymentMethod.QR;
        }
    }

    @GetMapping("/bookings/{bookingId}")
    public ResponseEntity<BookingTicketDto> getBookingTicket(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.getBookingTicket(bookingId));
    }

    @PostMapping("/checkin/qr/{bookingId}")
    public ResponseEntity<BookingTicketDto> checkInByQr(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.checkInByBookingId(bookingId));
    }

    @PostMapping("/checkin/phone")
    public ResponseEntity<BookingTicketDto> checkInByPhone(@RequestParam String phone) {
        return ResponseEntity.ok(bookingService.checkInByPhone(phone));
    }

    @GetMapping("/patients/lookup")
    public ResponseEntity<PatientSummaryDto> lookupPatient(@RequestParam String phone) {
        return ResponseEntity.ok(bookingService.findPatientByPhone(phone));
    }

    @GetMapping("/patients/{patientId}/bookings")
    public ResponseEntity<List<com.clinic.backend.modules.customer.dto.PatientBookingDto>> getPatientBookings(
            @PathVariable UUID patientId) {
        return ResponseEntity.ok(bookingService.getPatientBookings(patientId));
    }

    @PostMapping("/bookings/{bookingId}/rating")
    public ResponseEntity<Map<String, String>> submitRating(
            @PathVariable UUID bookingId,
            @Valid @RequestBody RatingRequest request) {
        bookingService.submitRating(bookingId, request);
        return ResponseEntity.ok(Map.of("message", "Đánh giá đã được ghi nhận. Cảm ơn bạn!"));
    }

    @PostMapping("/bookings/{bookingId}/cancel")
    public ResponseEntity<Map<String, String>> cancelBooking(
            @PathVariable UUID bookingId,
            @RequestParam String phone) {
        bookingService.cancelBooking(bookingId, phone);
        return ResponseEntity.ok(Map.of("message", "Đã hủy lịch khám."));
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

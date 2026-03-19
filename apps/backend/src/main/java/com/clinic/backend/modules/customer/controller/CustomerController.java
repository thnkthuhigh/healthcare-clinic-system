package com.clinic.backend.modules.customer.controller;

import com.clinic.backend.modules.customer.dto.*;
import com.clinic.backend.modules.customer.service.CustomerBookingService;
import com.clinic.backend.modules.doctor.repository.ServiceRepository;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    private final CustomerBookingService bookingService;
    private final ServiceRepository serviceRepository;

    public CustomerController(CustomerBookingService bookingService, ServiceRepository serviceRepository) {
        this.bookingService = bookingService;
        this.serviceRepository = serviceRepository;
    }

    // =====================================================
    // STEP 1 — List doctors
    // GET /api/customer/doctors
    // =====================================================
    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorSummaryDto>> getDoctors() {
        return ResponseEntity.ok(bookingService.getAllDoctors());
    }

    // =====================================================
    // STEP 2 — Get available shifts for a doctor on a date
    // GET /api/customer/doctors/{doctorId}/shifts?date=2026-03-05
    // =====================================================
    @GetMapping("/doctors/{doctorId}/shifts")
    public ResponseEntity<List<AvailableShiftDto>> getAvailableShifts(
            @PathVariable UUID doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        LocalDate queryDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(bookingService.getAvailableShifts(doctorId, queryDate));
    }

    // =====================================================
    // List active services (shown during booking step 2/3)
    // GET /api/customer/services
    // =====================================================
    @GetMapping("/services")
    public ResponseEntity<List<Map<String, Object>>> getServices() {
        List<Map<String, Object>> result = serviceRepository.findAllActive().stream()
                .map(s -> Map.<String, Object>of(
                        "id", s.getId(),
                        "name", s.getName(),
                        "durationMin", s.getDurationMin(),
                        "priceCents", s.getPriceCents()))
                .toList();
        return ResponseEntity.ok(result);
    }

    // =====================================================
    // STEP 3-4 — Create booking
    // POST /api/customer/bookings
    // =====================================================
    @PostMapping("/bookings")
    public ResponseEntity<BookingTicketDto> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        BookingTicketDto ticket = bookingService.createBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    // =====================================================
    // STEP 4 — Simulate payment
    // POST /api/customer/bookings/{bookingId}/pay
    // =====================================================
    @PostMapping("/bookings/{bookingId}/pay")
    public ResponseEntity<BookingTicketDto> processPayment(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.processPayment(bookingId));
    }

    // =====================================================
    // STEP 5 — Get booking ticket (for QR display)
    // GET /api/customer/bookings/{bookingId}
    // =====================================================
    @GetMapping("/bookings/{bookingId}")
    public ResponseEntity<BookingTicketDto> getBookingTicket(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.getBookingTicket(bookingId));
    }

    // =====================================================
    // CHECK-IN — By QR code (booking ID)
    // POST /api/customer/checkin/qr/{bookingId}
    // =====================================================
    @PostMapping("/checkin/qr/{bookingId}")
    public ResponseEntity<BookingTicketDto> checkInByQr(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.checkInByBookingId(bookingId));
    }

    // =====================================================
    // CHECK-IN — By phone number
    // POST /api/customer/checkin/phone?phone=09...
    // =====================================================
    @PostMapping("/checkin/phone")
    public ResponseEntity<BookingTicketDto> checkInByPhone(@RequestParam String phone) {
        return ResponseEntity.ok(bookingService.checkInByPhone(phone));
    }

    // =====================================================
    // HEALTH PROFILE — Find patient by phone
    // GET /api/customer/patients/lookup?phone=09...
    // =====================================================
    @GetMapping("/patients/lookup")
    public ResponseEntity<PatientSummaryDto> lookupPatient(@RequestParam String phone) {
        return ResponseEntity.ok(bookingService.findPatientByPhone(phone));
    }

    // =====================================================
    // HEALTH PROFILE — Get patient's booking history
    // GET /api/customer/patients/{patientId}/bookings
    // =====================================================
    @GetMapping("/patients/{patientId}/bookings")
    public ResponseEntity<List<PatientBookingDto>> getPatientBookings(@PathVariable UUID patientId) {
        return ResponseEntity.ok(bookingService.getPatientBookings(patientId));
    }

    // =====================================================
    // RATING — Submit rating for a completed booking
    // POST /api/customer/bookings/{bookingId}/rating
    // =====================================================
    @PostMapping("/bookings/{bookingId}/rating")
    public ResponseEntity<Map<String, String>> submitRating(
            @PathVariable UUID bookingId,
            @Valid @RequestBody RatingRequest request) {
        bookingService.submitRating(bookingId, request);
        return ResponseEntity.ok(Map.of("message", "Đánh giá đã được ghi nhận. Cảm ơn bạn!"));
    }

    // =====================================================
    // Cancel booking
    // POST /api/customer/bookings/{bookingId}/cancel
    // =====================================================
    @PostMapping("/bookings/{bookingId}/cancel")
    public ResponseEntity<Map<String, String>> cancelBooking(@PathVariable UUID bookingId) {
        bookingService.cancelBooking(bookingId);
        return ResponseEntity.ok(Map.of("message", "Booking canceled"));
    }
}

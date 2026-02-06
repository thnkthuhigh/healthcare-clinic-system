package com.clinic.backend.modules.doctor.controller;

import com.clinic.backend.modules.doctor.dto.*;
import com.clinic.backend.modules.doctor.service.DoctorService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/doctor")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    /**
     * Get doctor profile by user ID
     * GET /api/doctor/profile?userId={userId}
     */
    @GetMapping("/profile")
    public ResponseEntity<DoctorDto> getProfile(@RequestParam UUID userId) {
        DoctorDto doctor = doctorService.getDoctorByUserId(userId);
        return ResponseEntity.ok(doctor);
    }

    /**
     * Get doctor's shifts for a specific date (default: today)
     * GET /api/doctor/{doctorId}/shifts?date=2026-02-06
     */
    @GetMapping("/{doctorId}/shifts")
    public ResponseEntity<List<ShiftDto>> getShifts(
            @PathVariable UUID doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        if (date == null) {
            date = LocalDate.now();
        }
        
        List<ShiftDto> shifts = doctorService.getShiftsByDate(doctorId, date);
        return ResponseEntity.ok(shifts);
    }

    /**
     * Get shift details
     * GET /api/doctor/shifts/{shiftId}
     */
    @GetMapping("/shifts/{shiftId}")
    public ResponseEntity<ShiftDto> getShiftDetails(@PathVariable UUID shiftId) {
        ShiftDto shift = doctorService.getShiftById(shiftId);
        return ResponseEntity.ok(shift);
    }

    /**
     * Get patient queue for a shift
     * GET /api/doctor/shifts/{shiftId}/queue?status=WAITING
     */
    @GetMapping("/shifts/{shiftId}/queue")
    public ResponseEntity<List<QueueItemDto>> getQueue(
            @PathVariable UUID shiftId,
            @RequestParam(required = false) String status) {
        
        List<QueueItemDto> queue = doctorService.getQueueByShift(shiftId, status);
        return ResponseEntity.ok(queue);
    }

    /**
     * Get all bookings for a shift (for statistics)
     * GET /api/doctor/shifts/{shiftId}/bookings
     */
    @GetMapping("/shifts/{shiftId}/bookings")
    public ResponseEntity<List<QueueItemDto>> getAllBookings(@PathVariable UUID shiftId) {
        List<QueueItemDto> bookings = doctorService.getAllBookingsByShift(shiftId);
        return ResponseEntity.ok(bookings);
    }
}

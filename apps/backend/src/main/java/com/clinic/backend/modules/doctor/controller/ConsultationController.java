package com.clinic.backend.modules.doctor.controller;

import com.clinic.backend.modules.doctor.dto.*;
import com.clinic.backend.modules.doctor.dto.request.*;
import com.clinic.backend.modules.doctor.service.ConsultationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/doctor/consultation")
@CrossOrigin(origins = "*")
public class ConsultationController {

    private final ConsultationService consultationService;

    public ConsultationController(ConsultationService consultationService) {
        this.consultationService = consultationService;
    }

    /**
     * Get booking details for consultation
     * GET /api/doctor/consultation/bookings/{bookingId}
     */
    @GetMapping("/bookings/{bookingId}")
    public ResponseEntity<BookingDetailDto> getBookingDetails(@PathVariable UUID bookingId) {
        BookingDetailDto details = consultationService.getBookingDetails(bookingId);
        return ResponseEntity.ok(details);
    }

    /**
     * Invite next patient in queue
     * POST /api/doctor/consultation/shifts/{shiftId}/invite-next
     */
    @PostMapping("/shifts/{shiftId}/invite-next")
    public ResponseEntity<QueueItemDto> inviteNextPatient(@PathVariable UUID shiftId) {
        QueueItemDto patient = consultationService.inviteNextPatient(shiftId);
        return ResponseEntity.ok(patient);
    }

    /**
     * Invite specific patient
     * POST /api/doctor/consultation/bookings/{bookingId}/invite
     */
    @PostMapping("/bookings/{bookingId}/invite")
    public ResponseEntity<QueueItemDto> invitePatient(@PathVariable UUID bookingId) {
        QueueItemDto patient = consultationService.invitePatient(bookingId);
        return ResponseEntity.ok(patient);
    }

    /**
     * Skip patient (move to end of queue)
     * POST /api/doctor/consultation/bookings/{bookingId}/skip
     */
    @PostMapping("/bookings/{bookingId}/skip")
    public ResponseEntity<Map<String, String>> skipPatient(@PathVariable UUID bookingId) {
        consultationService.skipPatient(bookingId);
        return ResponseEntity.ok(Map.of("message", "Patient skipped successfully"));
    }

    /**
     * Send patient to lab
     * POST /api/doctor/consultation/bookings/{bookingId}/send-to-lab
     */
    @PostMapping("/bookings/{bookingId}/send-to-lab")
    public ResponseEntity<Map<String, String>> sendToLab(@PathVariable UUID bookingId) {
        consultationService.sendToLab(bookingId);
        return ResponseEntity.ok(Map.of("message", "Patient sent to lab"));
    }

    /**
     * Mark lab results ready
     * POST /api/doctor/consultation/bookings/{bookingId}/results-ready
     */
    @PostMapping("/bookings/{bookingId}/results-ready")
    public ResponseEntity<Map<String, String>> markResultsReady(@PathVariable UUID bookingId) {
        consultationService.markResultsReady(bookingId);
        return ResponseEntity.ok(Map.of("message", "Results marked as ready"));
    }

    /**
     * Save medical record
     * POST /api/doctor/consultation/bookings/{bookingId}/medical-record
     */
    @PostMapping("/bookings/{bookingId}/medical-record")
    public ResponseEntity<MedicalRecordDto> saveMedicalRecord(
            @PathVariable UUID bookingId,
            @RequestBody SaveMedicalRecordRequest request,
            @RequestHeader(value = "X-Doctor-Id", required = false) UUID doctorId) {
        
        MedicalRecordDto record = consultationService.saveMedicalRecord(bookingId, request, doctorId);
        return ResponseEntity.ok(record);
    }

    /**
     * Save prescription
     * POST /api/doctor/consultation/bookings/{bookingId}/prescription
     */
    @PostMapping("/bookings/{bookingId}/prescription")
    public ResponseEntity<PrescriptionDto> savePrescription(
            @PathVariable UUID bookingId,
            @Valid @RequestBody SavePrescriptionRequest request) {
        
        PrescriptionDto prescription = consultationService.savePrescription(bookingId, request);
        return ResponseEntity.ok(prescription);
    }

    /**
     * Complete consultation
     * POST /api/doctor/consultation/bookings/{bookingId}/complete
     */
    @PostMapping("/bookings/{bookingId}/complete")
    public ResponseEntity<Map<String, String>> completeConsultation(@PathVariable UUID bookingId) {
        consultationService.completeConsultation(bookingId);
        return ResponseEntity.ok(Map.of("message", "Consultation completed successfully"));
    }

    /**
     * Get patient details
     * GET /api/doctor/consultation/patients/{patientId}
     */
    @GetMapping("/patients/{patientId}")
    public ResponseEntity<PatientDto> getPatientDetails(@PathVariable UUID patientId) {
        PatientDto patient = consultationService.getPatientDetails(patientId);
        return ResponseEntity.ok(patient);
    }

    /**
     * Get patient medical history
     * GET /api/doctor/consultation/patients/{patientId}/history
     */
    @GetMapping("/patients/{patientId}/history")
    public ResponseEntity<List<MedicalRecordDto>> getPatientHistory(@PathVariable UUID patientId) {
        List<MedicalRecordDto> history = consultationService.getPatientHistory(patientId);
        return ResponseEntity.ok(history);
    }

    /**
     * Search medications for prescription
     * GET /api/doctor/consultation/medications?query=paracetamol
     */
    @GetMapping("/medications")
    public ResponseEntity<List<MedicationDto>> searchMedications(
            @RequestParam(required = false) String query) {
        
        List<MedicationDto> medications = consultationService.searchMedications(query);
        return ResponseEntity.ok(medications);
    }
}

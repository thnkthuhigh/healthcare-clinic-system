package com.clinic.backend.modules.doctor.service;

import com.clinic.backend.modules.doctor.dto.*;
import com.clinic.backend.modules.doctor.dto.request.SaveMedicalRecordRequest;
import com.clinic.backend.modules.doctor.dto.request.SavePrescriptionRequest;
import com.clinic.backend.modules.doctor.entity.*;
import com.clinic.backend.modules.doctor.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ConsultationService {

    private final BookingRepository bookingRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationRepository medicationRepository;
    private final PatientRepository patientRepository;

    public ConsultationService(
            BookingRepository bookingRepository,
            MedicalRecordRepository medicalRecordRepository,
            PrescriptionRepository prescriptionRepository,
            MedicationRepository medicationRepository,
            PatientRepository patientRepository) {
        this.bookingRepository = bookingRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.medicationRepository = medicationRepository;
        this.patientRepository = patientRepository;
    }

    /**
     * Get booking details for consultation
     */
    @Transactional(readOnly = true)
    public BookingDetailDto getBookingDetails(UUID bookingId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        MedicalRecordDto medicalRecord = medicalRecordRepository.findByBookingId(bookingId)
                .map(this::toMedicalRecordDto)
                .orElse(null);
        
        PrescriptionDto prescription = prescriptionRepository.findByBookingIdWithItems(bookingId)
                .map(this::toPrescriptionDto)
                .orElse(null);
        
        return toBookingDetailDto(booking, medicalRecord, prescription);
    }

    /**
     * Invite next patient (call from queue)
     */
    public QueueItemDto inviteNextPatient(UUID shiftId) {
        Booking booking = bookingRepository.findNextInQueue(shiftId)
                .orElseThrow(() -> new RuntimeException("No patients waiting in queue"));
        
        // Update status to IN_CONSULTATION
        booking.setStatus(Booking.BookingStatus.IN_CONSULTATION);
        booking.setStartedAt(Instant.now());
        bookingRepository.save(booking);
        
        return toQueueItemDto(booking);
    }

    /**
     * Invite specific patient by booking ID
     */
    public QueueItemDto invitePatient(UUID bookingId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (booking.getStatus() != Booking.BookingStatus.CHECKED_IN && 
            booking.getStatus() != Booking.BookingStatus.WAITING &&
            booking.getStatus() != Booking.BookingStatus.RESULTS_READY) {
            throw new RuntimeException("Patient cannot be invited. Current status: " + booking.getStatus());
        }
        
        booking.setStatus(Booking.BookingStatus.IN_CONSULTATION);
        booking.setStartedAt(Instant.now());
        bookingRepository.save(booking);
        
        return toQueueItemDto(booking);
    }

    /**
     * Skip patient (push to end of queue)
     */
    public void skipPatient(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        // Increment skip count and reduce priority
        booking.setSkipCount(booking.getSkipCount() + 1);
        booking.setPriorityScore(booking.getPriorityScore() - 10);
        booking.setStatus(Booking.BookingStatus.WAITING);
        bookingRepository.save(booking);
    }

    /**
     * Send patient to lab (for testing)
     */
    public void sendToLab(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        booking.setStatus(Booking.BookingStatus.PENDING_LAB);
        bookingRepository.save(booking);
    }

    /**
     * Mark lab results ready (patient returns to top of queue - Logic B)
     */
    public void markResultsReady(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        // Set high priority for patients with results (Logic B - Priority 1)
        booking.setStatus(Booking.BookingStatus.RESULTS_READY);
        booking.setPriorityScore(100); // Highest priority
        bookingRepository.save(booking);
    }

    /**
     * Save medical record
     */
    public MedicalRecordDto saveMedicalRecord(UUID bookingId, SaveMedicalRecordRequest request, UUID doctorId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        MedicalRecord record = medicalRecordRepository.findByBookingId(bookingId)
                .orElseGet(() -> {
                    MedicalRecord newRecord = new MedicalRecord();
                    newRecord.setBooking(booking);
                    newRecord.setPatient(booking.getPatient());
                    newRecord.setDoctor(booking.getShift().getDoctor());
                    return newRecord;
                });
        
        record.setSymptoms(request.symptoms());
        record.setDiagnosis(request.diagnosis());
        record.setConclusion(request.conclusion());
        record.setNotes(request.notes());
        
        MedicalRecord saved = medicalRecordRepository.save(record);
        return toMedicalRecordDto(saved);
    }

    /**
     * Save prescription (Logic C - Step 1: Hold stock)
     */
    public PrescriptionDto savePrescription(UUID bookingId, SavePrescriptionRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        // Get or create prescription
        Prescription prescription = prescriptionRepository.findByBookingId(bookingId)
                .orElseGet(() -> {
                    Prescription newPrescription = new Prescription();
                    newPrescription.setBooking(booking);
                    return newPrescription;
                });
        
        // Release previous holds if updating
        for (PrescriptionItem item : prescription.getItems()) {
            medicationRepository.releaseHold(item.getMedication().getId(), item.getQty());
        }
        prescription.getItems().clear();
        
        // Add new items and hold stock
        for (SavePrescriptionRequest.PrescriptionItemRequest itemReq : request.items()) {
            Medication medication = medicationRepository.findById(itemReq.medicationId())
                    .orElseThrow(() -> new RuntimeException("Medication not found: " + itemReq.medicationId()));
            
            // Check and hold stock
            int held = medicationRepository.holdStock(medication.getId(), itemReq.qty());
            if (held == 0) {
                throw new RuntimeException("Insufficient stock for: " + medication.getName());
            }
            
            PrescriptionItem item = new PrescriptionItem();
            item.setMedication(medication);
            item.setQty(itemReq.qty());
            item.setDosage(itemReq.dosage());
            item.setNote(itemReq.note());
            item.setUnitPriceCents(medication.getPriceCents());
            
            prescription.addItem(item);
        }
        
        Prescription saved = prescriptionRepository.save(prescription);
        return toPrescriptionDto(saved);
    }

    /**
     * Complete consultation
     */
    public void completeConsultation(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        booking.setStatus(Booking.BookingStatus.COMPLETED);
        booking.setCompletedAt(Instant.now());
        bookingRepository.save(booking);
    }

    /**
     * Get patient's medical history
     */
    @Transactional(readOnly = true)
    public List<MedicalRecordDto> getPatientHistory(UUID patientId) {
        return medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(this::toMedicalRecordDto)
                .toList();
    }

    /**
     * Get patient details
     */
    @Transactional(readOnly = true)
    public PatientDto getPatientDetails(UUID patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        return toPatientDto(patient);
    }

    /**
     * Search medications
     */
    @Transactional(readOnly = true)
    public List<MedicationDto> searchMedications(String query) {
        List<Medication> medications;
        if (query == null || query.isBlank()) {
            medications = medicationRepository.findAvailable();
        } else {
            medications = medicationRepository.searchByName(query);
        }
        return medications.stream().map(this::toMedicationDto).toList();
    }

    // ========== Mappers ==========

    private QueueItemDto toQueueItemDto(Booking booking) {
        Patient patient = booking.getPatient();
        PatientDto patientDto = toPatientDto(patient);
        
        return new QueueItemDto(
            booking.getId(),
            booking.getQueueNumber(),
            patientDto,
            booking.getService() != null ? booking.getService().getName() : null,
            booking.getStatus(),
            booking.getChannel(),
            booking.getCheckInAt(),
            booking.getPriorityScore(),
            booking.getSkipCount()
        );
    }

    private PatientDto toPatientDto(Patient patient) {
        return new PatientDto(
            patient.getId(),
            patient.getFullName(),
            patient.getPhone(),
            patient.getNationalId(),
            patient.getDateOfBirth(),
            patient.getAge(),
            patient.getGender(),
            patient.getWeightKg(),
            patient.getHeightCm(),
            patient.getAllergies(),
            patient.getAddress()
        );
    }

    private MedicalRecordDto toMedicalRecordDto(MedicalRecord record) {
        return new MedicalRecordDto(
            record.getId(),
            record.getBooking().getId(),
            record.getPatient().getId(),
            record.getPatient().getFullName(),
            record.getDoctor().getId(),
            record.getDoctor().getDisplayName(),
            record.getSymptoms(),
            record.getDiagnosis(),
            record.getConclusion(),
            record.getNotes(),
            record.getBooking().getService() != null ? record.getBooking().getService().getName() : null,
            record.getCreatedAt(),
            record.getUpdatedAt()
        );
    }

    private PrescriptionDto toPrescriptionDto(Prescription prescription) {
        List<PrescriptionItemDto> items = prescription.getItems().stream()
                .map(item -> new PrescriptionItemDto(
                    item.getId(),
                    item.getMedication().getId(),
                    item.getMedication().getName(),
                    item.getMedication().getUnit(),
                    item.getQty(),
                    item.getDosage(),
                    item.getNote(),
                    item.getUnitPriceCents(),
                    item.getTotalCents()
                ))
                .toList();
        
        return new PrescriptionDto(
            prescription.getId(),
            prescription.getBooking().getId(),
            prescription.getStatus(),
            items,
            prescription.getTotalCents(),
            prescription.getCreatedAt()
        );
    }

    private MedicationDto toMedicationDto(Medication medication) {
        return new MedicationDto(
            medication.getId(),
            medication.getName(),
            medication.getUnit(),
            medication.getUsage(),
            medication.getDefaultDose(),
            medication.getPriceCents(),
            medication.getAvailableStock()
        );
    }

    private BookingDetailDto toBookingDetailDto(Booking booking, MedicalRecordDto medicalRecord, PrescriptionDto prescription) {
        Patient patient = booking.getPatient();
        Shift shift = booking.getShift();
        Doctor doctor = shift.getDoctor();
        
        PatientDto patientDto = toPatientDto(patient);
        
        DoctorDto doctorDto = new DoctorDto(
            doctor.getId(),
            doctor.getDisplayName(),
            doctor.getSpecialty(),
            doctor.getAvatarUrl(),
            doctor.getUser().getPhone()
        );
        
        ShiftDto shiftDto = new ShiftDto(
            shift.getId(),
            shift.getDate(),
            shift.getType(),
            shift.getStartTime(),
            shift.getEndTime(),
            shift.getTimeRange(),
            shift.getStatus(),
            0, 0, 0, 0, 0 // Stats not needed for detail view
        );
        
        return new BookingDetailDto(
            booking.getId(),
            booking.getQueueNumber(),
            patientDto,
            shiftDto,
            doctorDto,
            booking.getService() != null ? booking.getService().getName() : null,
            booking.getStatus().name(),
            booking.getChannel().name(),
            booking.getPaymentStatus().name(),
            booking.getCheckInAt(),
            booking.getStartedAt(),
            booking.getCompletedAt(),
            medicalRecord,
            prescription
        );
    }
}

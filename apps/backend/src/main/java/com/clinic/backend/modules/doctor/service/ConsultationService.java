package com.clinic.backend.modules.doctor.service;

import com.clinic.backend.modules.doctor.dto.*;
import com.clinic.backend.modules.doctor.dto.request.CompleteLabResultRequest;
import com.clinic.backend.modules.doctor.dto.request.SaveMedicalRecordRequest;
import com.clinic.backend.modules.doctor.dto.request.SavePrescriptionRequest;
import com.clinic.backend.modules.doctor.dto.request.ScheduleFollowUpRequest;
import com.clinic.backend.modules.doctor.entity.*;
import com.clinic.backend.modules.doctor.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class ConsultationService {
    private static final Logger log = LoggerFactory.getLogger(ConsultationService.class);
    private static final ZoneId CLINIC_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter LAB_TS_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(CLINIC_ZONE);
    private static final int DEFAULT_LAB_FEE_CENTS = 10_000_000;

    private final BookingRepository bookingRepository;
    private final ShiftRepository shiftRepository;
    private final SlotRepository slotRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationRepository medicationRepository;
    private final PrescriptionTemplateRepository prescriptionTemplateRepository;
    private final PatientRepository patientRepository;
    private final ServiceRepository serviceRepository;
    private final JdbcTemplate jdbcTemplate;

    public ConsultationService(
            BookingRepository bookingRepository,
            ShiftRepository shiftRepository,
            SlotRepository slotRepository,
            MedicalRecordRepository medicalRecordRepository,
            PrescriptionRepository prescriptionRepository,
            MedicationRepository medicationRepository,
            PrescriptionTemplateRepository prescriptionTemplateRepository,
            PatientRepository patientRepository,
            ServiceRepository serviceRepository,
            JdbcTemplate jdbcTemplate) {
        this.bookingRepository = bookingRepository;
        this.shiftRepository = shiftRepository;
        this.slotRepository = slotRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.medicationRepository = medicationRepository;
        this.prescriptionTemplateRepository = prescriptionTemplateRepository;
        this.patientRepository = patientRepository;
        this.serviceRepository = serviceRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Get booking details for consultation
     */
    @Transactional(readOnly = true)
    public BookingDetailDto getBookingDetails(UUID bookingId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch khám"));
        
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
                .orElseThrow(() -> new RuntimeException("Không có bệnh nhân đang chờ khám"));
        
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch khám"));
        
        if (booking.getStatus() != Booking.BookingStatus.CHECKED_IN && 
            booking.getStatus() != Booking.BookingStatus.WAITING &&
            booking.getStatus() != Booking.BookingStatus.RESULTS_READY) {
            throw new RuntimeException("Không thể gọi bệnh nhân vào khám. Trạng thái hiện tại: " + booking.getStatus());
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch khám"));
        
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch khám"));

        if (booking.getStatus() != Booking.BookingStatus.IN_CONSULTATION
                && booking.getStatus() != Booking.BookingStatus.RESULTS_READY
                && booking.getStatus() != Booking.BookingStatus.PENDING_LAB) {
            throw new RuntimeException("Lịch khám không ở trong luồng khám bệnh");
        }

        booking.setStatus(Booking.BookingStatus.PENDING_LAB);
        if (booking.getLabRequestedAt() == null) {
            booking.setLabRequestedAt(Instant.now());
        }
        if (booking.getLabFeeCents() == null || booking.getLabFeeCents() <= 0) {
            booking.setLabFeeCents(resolveLabFeeCents());
            booking.setLabFeeNote("Chi phí xét nghiệm theo chỉ định bác sĩ");
        }
        bookingRepository.save(booking);
    }

    /**
     * Mark lab results ready (patient returns to top of queue - Logic B)
     */
    public void markResultsReady(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch khám"));
        
        // Set high priority for patients with results (Logic B - Priority 1)
        booking.setStatus(Booking.BookingStatus.RESULTS_READY);
        booking.setPriorityScore(100); // Highest priority
        bookingRepository.save(booking);
    }

    /**
     * Complete lab step: save lab note and send patient back to doctor's waiting queue.
     */
    public QueueItemDto completeLabResult(UUID bookingId, CompleteLabResultRequest request) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch khám"));

        if (booking.getStatus() != Booking.BookingStatus.PENDING_LAB
                && booking.getStatus() != Booking.BookingStatus.RESULTS_READY) {
            throw new RuntimeException("Lịch khám không ở trạng thái chờ xét nghiệm");
        }

        MedicalRecord record = medicalRecordRepository.findByBookingId(bookingId)
                .orElseGet(() -> {
                    MedicalRecord newRecord = new MedicalRecord();
                    newRecord.setBooking(booking);
                    newRecord.setPatient(booking.getPatient());
                    newRecord.setDoctor(booking.getShift().getDoctor());
                    return newRecord;
                });

        record.setNotes(mergeLabNotes(record.getNotes(), request));
        medicalRecordRepository.save(record);

        booking.setStatus(Booking.BookingStatus.RESULTS_READY);
        booking.setPriorityScore(100);
        bookingRepository.save(booking);

        return toQueueItemDto(booking);
    }

    /**
     * Create a follow-up booking from current consultation.
     */
    public FollowUpBookingDto scheduleFollowUp(UUID bookingId, ScheduleFollowUpRequest request) {
        Booking sourceBooking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch khám nguồn"));

        if (sourceBooking.getStatus() == Booking.BookingStatus.CANCELED) {
            throw new RuntimeException("Không thể hẹn tái khám từ lịch đã hủy");
        }

        LocalDate followUpDate = request.followUpDate();
        List<Booking> existing = bookingRepository.findFollowUpsBySourceAndDate(sourceBooking.getId(), followUpDate);
        Booking existingFollowUp = existing.stream()
                .filter(item -> item.getStatus() != Booking.BookingStatus.CANCELED)
                .findFirst()
                .orElse(null);
        if (existingFollowUp != null) {
            return toFollowUpDto(existingFollowUp);
        }

        FollowUpAllocation allocation = allocateFollowUpSlot(sourceBooking, followUpDate);

        Booking followUp = new Booking();
        followUp.setShift(allocation.shift());
        followUp.setSlotId(allocation.slot().getId());
        followUp.setSlot(allocation.slot());
        followUp.setPatient(sourceBooking.getPatient());
        followUp.setService(sourceBooking.getService());
        followUp.setChannel(Booking.BookingChannel.WEB);
        followUp.setStatus(Booking.BookingStatus.BOOKED);
        followUp.setPaymentStatus(Booking.PaymentStatus.UNPAID);
        followUp.setQueueNumber(null);
        followUp.setPriorityScore(0);
        followUp.setIsFollowUp(true);
        followUp.setFollowUpSourceBooking(sourceBooking);
        followUp.setFollowUpScheduledAt(calculateAppointmentTime(allocation.shift(), allocation.slot().getSequence()));
        followUp.setFollowUpNote(request.note() != null && !request.note().isBlank() ? request.note().trim() : null);

        Booking saved = bookingRepository.save(followUp);
        return toFollowUpDto(saved);
    }

    /**
     * Save medical record
     */
    public MedicalRecordDto saveMedicalRecord(UUID bookingId, SaveMedicalRecordRequest request, UUID doctorId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch khám"));
        Patient patient = booking.getPatient();
        
        MedicalRecord record = medicalRecordRepository.findByBookingId(bookingId)
                .orElseGet(() -> {
                    MedicalRecord newRecord = new MedicalRecord();
                    newRecord.setBooking(booking);
                    newRecord.setPatient(patient);
                    newRecord.setDoctor(booking.getShift().getDoctor());
                    return newRecord;
                });
        
        record.setSymptoms(request.symptoms());
        record.setDiagnosis(request.diagnosis());
        record.setConclusion(request.conclusion());
        record.setNotes(request.notes());

        if (request.weightKg() != null) {
            patient.setWeightKg(request.weightKg());
        }
        if (request.heightCm() != null) {
            patient.setHeightCm(request.heightCm());
        }
        
        MedicalRecord saved = medicalRecordRepository.save(record);
        return toMedicalRecordDto(saved);
    }

    /**
     * Save prescription (Logic C - Step 1: Hold stock)
     */
    public PrescriptionDto savePrescription(UUID bookingId, SavePrescriptionRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch khám"));
        
        List<SavePrescriptionRequest.PrescriptionItemRequest> normalizedItems =
                normalizePrescriptionItems(request.items());

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

        // Force deletion of old items before inserting the replacement set.
        // Avoid unique conflict on (prescription_id, medication_id).
        prescription = prescriptionRepository.saveAndFlush(prescription);

        if (normalizedItems.isEmpty()) {
            return toPrescriptionDto(prescription);
        }
        
        // Add new items and hold stock
        for (SavePrescriptionRequest.PrescriptionItemRequest itemReq : normalizedItems) {
            Medication medication = medicationRepository.findById(itemReq.medicationId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thuốc: " + itemReq.medicationId()));
            
            // Check and hold stock
            int held = medicationRepository.holdStock(medication.getId(), itemReq.qty());
            if (held == 0) {
                throw new RuntimeException("Không đủ tồn kho cho thuốc: " + medication.getName());
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

    private List<SavePrescriptionRequest.PrescriptionItemRequest> normalizePrescriptionItems(
            List<SavePrescriptionRequest.PrescriptionItemRequest> rawItems) {
        if (rawItems == null || rawItems.isEmpty()) {
            return List.of();
        }

        Map<UUID, SavePrescriptionRequest.PrescriptionItemRequest> merged = new LinkedHashMap<>();
        for (SavePrescriptionRequest.PrescriptionItemRequest item : rawItems) {
            if (item == null || item.medicationId() == null || item.qty() == null || item.qty() <= 0) {
                continue;
            }

            merged.compute(item.medicationId(), (medicationId, current) -> {
                if (current == null) {
                    return item;
                }
                return new SavePrescriptionRequest.PrescriptionItemRequest(
                        medicationId,
                        current.qty() + item.qty(),
                        preferNonBlank(item.dosage(), current.dosage()),
                        preferNonBlank(item.note(), current.note()));
            });
        }

        return new ArrayList<>(merged.values());
    }

    private String preferNonBlank(String preferred, String fallback) {
        if (preferred != null && !preferred.isBlank()) {
            return preferred.trim();
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback.trim();
        }
        return null;
    }

    /**
     * Complete consultation
     */
    public void completeConsultation(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch khám"));
        
        booking.setStatus(Booking.BookingStatus.COMPLETED);
        booking.setCompletedAt(Instant.now());
        // Consultation is billed at cashier after doctor completes the visit.
        // Keep VOID untouched, otherwise move back to UNPAID so cashier queue picks it up.
        if (booking.getPaymentStatus() != Booking.PaymentStatus.VOID) {
            booking.setPaymentStatus(Booking.PaymentStatus.UNPAID);
        }
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bệnh nhân"));
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

    /**
     * Get active prescription templates for quick apply in consultation UI
     */
    @Transactional(readOnly = true)
    public List<PrescriptionTemplateDto> getActivePrescriptionTemplates() {
        if (!isPrescriptionTemplateSchemaReady()) {
            log.warn("Prescription template tables are missing, fallback to empty list");
            return List.of();
        }

        return prescriptionTemplateRepository.findActiveWithItems().stream()
                .sorted((left, right) -> left.getName().compareToIgnoreCase(right.getName()))
                .map(template -> new PrescriptionTemplateDto(
                        template.getId(),
                        template.getName(),
                        template.getNote(),
                        template.getItems().stream()
                                .map(item -> new PrescriptionTemplateDto.ItemDto(
                                        item.getMedication().getId(),
                                        item.getMedication().getName(),
                                        item.getMedication().getUnit(),
                                        item.getQty(),
                                        item.getDosage(),
                                        item.getNote(),
                                        item.getMedication().getPriceCents()))
                                .toList()))
                .toList();
    }

    private boolean isPrescriptionTemplateSchemaReady() {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name IN ('prescription_templates', 'prescription_template_items')
                """,
                Integer.class);
        return count != null && count == 2;
    }

    private String mergeLabNotes(String existingNotes, CompleteLabResultRequest request) {
        String timestamp = LAB_TS_FORMATTER.format(Instant.now());
        StringBuilder section = new StringBuilder()
                .append("[Xét nghiệm ").append(timestamp).append("]").append("\n")
                .append("Kết quả: ").append(request.resultSummary().trim());
        if (request.impression() != null && !request.impression().isBlank()) {
            section.append("\n").append("Nhận định: ").append(request.impression().trim());
        }

        if (existingNotes == null || existingNotes.isBlank()) {
            return section.toString();
        }
        return existingNotes + "\n\n" + section;
    }

    private int resolveLabFeeCents() {
        return serviceRepository.findAllActive().stream()
                .filter(service -> {
                    String normalized = normalizeText(service.getName());
                    return normalized.contains("xet nghiem")
                            || normalized.contains("can lam sang")
                            || normalized.contains("lab");
                })
                .map(item -> item.getPriceCents())
                .filter(price -> price != null && price > 0)
                .min(Integer::compareTo)
                .orElse(DEFAULT_LAB_FEE_CENTS);
    }

    private String normalizeText(String value) {
        if (value == null) {
            return "";
        }
        String lowered = value.toLowerCase(Locale.ROOT)
                .replace('đ', 'd');
        return java.text.Normalizer.normalize(lowered, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
    }

    private FollowUpAllocation allocateFollowUpSlot(Booking sourceBooking, LocalDate followUpDate) {
        UUID doctorId = sourceBooking.getShift().getDoctor().getId();
        List<Shift> shifts = new ArrayList<>(shiftRepository.findByDoctorIdAndDate(doctorId, followUpDate));
        shifts.sort(Comparator.comparing(Shift::getStartTime));
        shifts = shifts.stream()
                .filter(shift -> shift.getStatus() == Shift.ShiftStatus.OPEN)
                .toList();

        if (shifts.isEmpty()) {
            throw new RuntimeException("Bác sĩ chưa có ca làm việc mở trong ngày tái khám");
        }

        for (Shift shift : shifts) {
            List<Slot> commonSlots = slotRepository.findOpenCommonSlotsForUpdate(shift.getId());
            if (!commonSlots.isEmpty()) {
                Slot selected = commonSlots.get(0);
                selected.setStatus(Slot.SlotStatus.LOCKED);
                slotRepository.save(selected);
                return new FollowUpAllocation(shift, selected);
            }

            List<Slot> reserveSlots = slotRepository.findOpenReserveSlotsForUpdate(shift.getId());
            if (!reserveSlots.isEmpty()) {
                Slot selected = reserveSlots.get(0);
                selected.setStatus(Slot.SlotStatus.LOCKED);
                slotRepository.save(selected);
                return new FollowUpAllocation(shift, selected);
            }
        }

        throw new RuntimeException("Ngày tái khám đã kín lịch, vui lòng chọn ngày khác");
    }

    private FollowUpBookingDto toFollowUpDto(Booking booking) {
        Shift shift = booking.getShift();
        return new FollowUpBookingDto(
                booking.getId(),
                booking.getFollowUpSourceBooking() != null ? booking.getFollowUpSourceBooking().getId() : null,
                shift.getDate(),
                shift.getType().name(),
                shift.getTimeRange(),
                shift.getDoctor().getDisplayName(),
                booking.getService() != null ? booking.getService().getName() : null,
                booking.getStatus().name(),
                booking.getFollowUpNote());
    }

    // ========== Mappers ==========

    private record FollowUpAllocation(Shift shift, Slot slot) {
    }

    private QueueItemDto toQueueItemDto(Booking booking) {
        Patient patient = booking.getPatient();
        PatientDto patientDto = toPatientDto(patient);
        int slotSequence = getSlotSequence(booking);
        
        return new QueueItemDto(
            booking.getId(),
            booking.getQueueNumber(),
            calculateAppointmentTime(booking.getShift(), slotSequence),
            slotSequence,
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

    private Instant calculateAppointmentTime(Shift shift, int slotSequence) {
        long minutesOffset = Math.max(slotSequence - 1, 0) * 15L;
        return shift.getStartTime().plus(Duration.ofMinutes(minutesOffset));
    }

    private int getSlotSequence(Booking booking) {
        Slot slot = booking.getSlot();
        return slot != null && slot.getSequence() != null ? slot.getSequence() : 1;
    }
}

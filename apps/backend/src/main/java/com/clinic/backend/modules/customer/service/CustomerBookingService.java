package com.clinic.backend.modules.customer.service;

import com.clinic.backend.modules.customer.dto.*;
import com.clinic.backend.modules.doctor.dto.MedicalRecordDto;
import com.clinic.backend.modules.doctor.dto.PrescriptionDto;
import com.clinic.backend.modules.doctor.dto.PrescriptionItemDto;
import com.clinic.backend.modules.doctor.entity.Booking;
import com.clinic.backend.modules.doctor.entity.Doctor;
import com.clinic.backend.modules.doctor.entity.Patient;
import com.clinic.backend.modules.doctor.entity.Prescription;
import com.clinic.backend.modules.doctor.entity.Rating;
import com.clinic.backend.modules.doctor.entity.Shift;
import com.clinic.backend.modules.doctor.entity.Slot;
import com.clinic.backend.modules.doctor.entity.Service;
import com.clinic.backend.modules.doctor.repository.*;
import com.clinic.backend.modules.doctor.service.QueueNumberService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Component
@Transactional
public class CustomerBookingService {

    private final DoctorRepository doctorRepository;
    private final ShiftRepository shiftRepository;
    private final SlotRepository slotRepository;
    private final PatientRepository patientRepository;
    private final BookingRepository bookingRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final RatingRepository ratingRepository;
    private final ServiceRepository serviceRepository;
    private final QueueNumberService queueNumberService;

    public CustomerBookingService(
            DoctorRepository doctorRepository,
            ShiftRepository shiftRepository,
            SlotRepository slotRepository,
            PatientRepository patientRepository,
            BookingRepository bookingRepository,
            MedicalRecordRepository medicalRecordRepository,
            PrescriptionRepository prescriptionRepository,
            RatingRepository ratingRepository,
            ServiceRepository serviceRepository,
            QueueNumberService queueNumberService) {
        this.doctorRepository = doctorRepository;
        this.shiftRepository = shiftRepository;
        this.slotRepository = slotRepository;
        this.patientRepository = patientRepository;
        this.bookingRepository = bookingRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.ratingRepository = ratingRepository;
        this.serviceRepository = serviceRepository;
        this.queueNumberService = queueNumberService;
    }

    // =====================================================
    // 1. List all doctors
    // =====================================================

    @Transactional(readOnly = true)
    public List<DoctorSummaryDto> getAllDoctors() {
        return doctorRepository.findAll().stream()
                .map(d -> new DoctorSummaryDto(
                        d.getId(),
                        d.getDisplayName(),
                        d.getSpecialty(),
                        d.getAvatarUrl(),
                        ratingRepository.findAverageStarsByDoctorId(d.getId())))
                .toList();
    }

    // =====================================================
    // 2. List available shifts for a doctor on a date
    // =====================================================

    @Transactional(readOnly = true)
    public List<AvailableShiftDto> getAvailableShifts(UUID doctorId, LocalDate date) {
        List<Shift> shifts = shiftRepository.findByDoctorIdAndDate(doctorId, date);
        return shifts.stream()
                .map(shift -> {
                    long available = slotRepository.countOpenCommonSlots(shift.getId());
                    return new AvailableShiftDto(
                            shift.getId(),
                            shift.getDate(),
                            shift.getType(),
                            shift.getStartTime(),
                            shift.getEndTime(),
                            shift.getTimeRange(),
                            shift.getStatus(),
                            available,
                            available == 0);
                })
                .toList();
    }

    // =====================================================
    // 3. Create a booking (Logic A — COMMON pool only)
    // =====================================================

    public BookingTicketDto createBooking(CreateBookingRequest req) {
        // 3a. Load shift
        Shift shift = shiftRepository.findById(req.shiftId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shift not found"));

        if (shift.getStatus() != Shift.ShiftStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ca khám đã đóng");
        }

        // 3b. Lock and pick a COMMON slot (pessimistic write lock)
        List<Slot> available = slotRepository.findOpenCommonSlotsForUpdate(shift.getId());
        if (available.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ca này đã đầy (Bể Chung hết chỗ). Vui lòng chọn ca khác.");
        }
        Slot slot = available.get(0);
        slot.setStatus(Slot.SlotStatus.LOCKED);
        slotRepository.save(slot);

        // 3c. Find or create patient
        Patient patient = patientRepository.findByPhone(req.phone())
                .orElseGet(() -> {
                    Patient p = new Patient();
                    p.setFullName(req.fullName());
                    p.setPhone(req.phone());
                    p.setNationalId(req.nationalId());
                    p.setDateOfBirth(req.dateOfBirth());
                    p.setGender(req.gender());
                    return patientRepository.save(p);
                });

        // Update patient info if it has changed
        patient.setFullName(req.fullName());
        if (req.nationalId() != null) patient.setNationalId(req.nationalId());
        if (req.dateOfBirth() != null) patient.setDateOfBirth(req.dateOfBirth());
        if (req.gender() != null) patient.setGender(req.gender());
        patientRepository.save(patient);

        // 3d. Lookup optional service (use fully-qualified reference to avoid name clash)
        Service clinicService = req.serviceId() != null
                ? serviceRepository.findById(req.serviceId()).orElse(null)
                : null;

        // 3e. Create booking
        Booking booking = new Booking();
        booking.setShift(shift);
        booking.setSlotId(slot.getId());
        booking.setPatient(patient);
        booking.setService(clinicService);
        booking.setChannel(Booking.BookingChannel.WEB);
        booking.setStatus(Booking.BookingStatus.BOOKED);
        booking.setPaymentStatus(Booking.PaymentStatus.UNPAID);
        booking.setQueueNumber(null);
        booking.setPriorityScore(0);
        bookingRepository.save(booking);

        return toTicketDto(booking);
    }

    // =====================================================
    // 4. Simulate payment — marks booking & prescription PAID
    // =====================================================

    public BookingTicketDto processPayment(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (booking.getPaymentStatus() == Booking.PaymentStatus.PAID) {
            return toTicketDto(booking);
        }

        booking.setPaymentStatus(Booking.PaymentStatus.PAID);
        bookingRepository.save(booking);

        // If there's a prescription in HELD state, move it to PAID
        prescriptionRepository.findByBookingId(bookingId).ifPresent(prescription -> {
            if (prescription.getStatus() == Prescription.PrescriptionStatus.HELD) {
                prescription.setStatus(Prescription.PrescriptionStatus.PAID);
                prescriptionRepository.save(prescription);
            }
        });

        return toTicketDto(booking);
    }

    // =====================================================
    // 5. Get booking ticket (for QR display)
    // =====================================================

    @Transactional(readOnly = true)
    public BookingTicketDto getBookingTicket(UUID bookingId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        return toTicketDto(booking);
    }

    // =====================================================
    // 6. Check-in by booking ID (QR scan)
    // =====================================================

    public BookingTicketDto checkInByBookingId(UUID bookingId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (booking.getStatus() == Booking.BookingStatus.CHECKED_IN
                || booking.getStatus() == Booking.BookingStatus.WAITING
                || booking.getStatus() == Booking.BookingStatus.IN_CONSULTATION) {
            return toTicketDto(booking); // already checked in
        }

        if (booking.getStatus() != Booking.BookingStatus.BOOKED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Booking cannot be checked in (status: " + booking.getStatus() + ")");
        }

        booking.setStatus(Booking.BookingStatus.WAITING);
        booking.setCheckInAt(Instant.now());
        // Web bookings get a slight priority boost on check-in
        booking.setPriorityScore(50);
        if (booking.getQueueNumber() == null) {
            booking.setQueueNumber(queueNumberService.allocateNextForShift(booking.getShift().getId()));
        }
        bookingRepository.save(booking);

        return toTicketDto(booking);
    }

    // =====================================================
    // 7. Check-in by phone number
    // =====================================================

    public BookingTicketDto checkInByPhone(String phone) {
        Patient patient = patientRepository.findByPhone(phone)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy bệnh nhân với SĐT: " + phone));

        // Find today's BOOKED booking
        List<Booking> todayBookings = bookingRepository.findTodayBookedByPatientId(
                patient.getId(), LocalDate.now());

        if (todayBookings.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Không có lịch hẹn hôm nay cho SĐT: " + phone);
        }

        // Check in the first BOOKED appointment of today
        Booking booking = todayBookings.get(0);
        booking.setStatus(Booking.BookingStatus.WAITING);
        booking.setCheckInAt(Instant.now());
        booking.setPriorityScore(50);
        if (booking.getQueueNumber() == null) {
            booking.setQueueNumber(queueNumberService.allocateNextForShift(booking.getShift().getId()));
        }
        bookingRepository.save(booking);

        return toTicketDto(booking);
    }

    // =====================================================
    // 8. Patient health profile
    // =====================================================

    @Transactional(readOnly = true)
    public PatientSummaryDto findPatientByPhone(String phone) {
        Patient p = patientRepository.findByPhone(phone)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy bệnh nhân với SĐT: " + phone));
        return new PatientSummaryDto(p.getId(), p.getFullName(), p.getPhone(), p.getNationalId());
    }

    @Transactional(readOnly = true)
    public List<PatientBookingDto> getPatientBookings(UUID patientId) {
        List<Booking> bookings = bookingRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        return bookings.stream().map(this::toPatientBookingDto).toList();
    }

    // =====================================================
    // 9. Submit / update rating
    // =====================================================

    public void submitRating(UUID bookingId, RatingRequest req) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (booking.getStatus() != Booking.BookingStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Chỉ có thể đánh giá sau khi khám xong");
        }

        Rating rating = ratingRepository.findByBookingId(bookingId)
                .orElseGet(() -> {
                    Rating r = new Rating();
                    r.setBooking(booking);
                    r.setDoctor(booking.getShift().getDoctor());
                    r.setPatient(booking.getPatient());
                    return r;
                });

        rating.setStars(req.stars());
        rating.setComment(req.comment());
        ratingRepository.save(rating);
    }

    // =====================================================
    // Mappers
    // =====================================================

    private BookingTicketDto toTicketDto(Booking booking) {
        Shift shift = booking.getShift();
        Doctor doctor = shift.getDoctor();
        Patient patient = booking.getPatient();

        return new BookingTicketDto(
                booking.getId(),
                booking.getQueueNumber(),
                patient.getFullName(),
                patient.getPhone(),
                doctor.getDisplayName(),
                doctor.getSpecialty(),
                shift.getDate(),
                shift.getType().name(),
                shift.getTimeRange(),
                booking.getService() != null ? booking.getService().getName() : null,
                booking.getStatus().name(),
                booking.getPaymentStatus().name(),
                booking.getCreatedAt());
    }

    private PatientBookingDto toPatientBookingDto(Booking booking) {
        Shift shift = booking.getShift();
        Doctor doctor = shift.getDoctor();

        MedicalRecordDto medRecord = medicalRecordRepository.findByBookingId(booking.getId())
                .map(mr -> new MedicalRecordDto(
                        mr.getId(), mr.getBooking().getId(), mr.getPatient().getId(),
                        mr.getPatient().getFullName(), mr.getDoctor().getId(),
                        mr.getDoctor().getDisplayName(), mr.getSymptoms(),
                        mr.getDiagnosis(), mr.getConclusion(), mr.getNotes(),
                        booking.getService() != null ? booking.getService().getName() : null,
                        mr.getCreatedAt(), mr.getUpdatedAt()))
                .orElse(null);

        PrescriptionDto prescDto = prescriptionRepository.findByBookingIdWithItems(booking.getId())
                .map(pr -> new PrescriptionDto(
                        pr.getId(), pr.getBooking().getId(), pr.getStatus(),
                        pr.getItems().stream().map(item -> new PrescriptionItemDto(
                                item.getId(),
                                item.getMedication().getId(),
                                item.getMedication().getName(),
                                item.getMedication().getUnit(),
                                item.getQty(),
                                item.getDosage(),
                                item.getNote(),
                                item.getUnitPriceCents(),
                                item.getQty() * item.getUnitPriceCents())).toList(),
                        pr.getItems().stream()
                                .mapToInt(i -> i.getQty() * i.getUnitPriceCents()).sum(),
                        pr.getCreatedAt()))
                .orElse(null);

        Rating rating = ratingRepository.findByBookingId(booking.getId()).orElse(null);

        return new PatientBookingDto(
                booking.getId(),
                booking.getQueueNumber(),
                shift.getDate(),
                shift.getType().name(),
                shift.getTimeRange(),
                doctor.getDisplayName(),
                doctor.getSpecialty(),
                booking.getService() != null ? booking.getService().getName() : null,
                booking.getStatus().name(),
                booking.getPaymentStatus().name(),
                booking.getCreatedAt(),
                medRecord,
                prescDto,
                rating != null ? rating.getStars() : null,
                rating != null ? rating.getComment() : null);
    }
}

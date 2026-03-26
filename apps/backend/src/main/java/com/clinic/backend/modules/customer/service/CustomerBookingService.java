package com.clinic.backend.modules.customer.service;

import com.clinic.backend.modules.customer.dto.*;
import com.clinic.backend.modules.doctor.dto.MedicalRecordDto;
import com.clinic.backend.modules.doctor.dto.PrescriptionDto;
import com.clinic.backend.modules.doctor.dto.PrescriptionItemDto;
import com.clinic.backend.modules.doctor.entity.Booking;
import com.clinic.backend.modules.doctor.entity.Doctor;
import com.clinic.backend.modules.doctor.entity.Patient;
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

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Component
@Transactional
public class CustomerBookingService {
    private static final ZoneId CLINIC_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

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
    public List<DoctorSummaryDto> getAllDoctors(UUID serviceId) {
        List<Doctor> doctors;
        if (serviceId == null) {
            doctors = doctorRepository.findAll();
        } else {
            Service service = serviceRepository.findById(serviceId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy dịch vụ"));

            // Ưu tiên lọc bác sĩ theo chuyên khoa của dịch vụ để đảm bảo danh sách đúng ngữ cảnh khám.
            if (service.getSpecialtyId() != null) {
                doctors = doctorRepository.findByServiceSpecialty(serviceId);
            } else {
                doctors = doctorRepository.findByServiceMapping(serviceId);
            }
        }

        return doctors.stream()
                .map(this::toDoctorSummaryDto)
                .toList();
    }

    private DoctorSummaryDto toDoctorSummaryDto(Doctor doctor) {
        return new DoctorSummaryDto(
                doctor.getId(),
                doctor.getDisplayName(),
                doctor.getSpecialty(),
                doctor.getAvatarUrl(),
                ratingRepository.findAverageStarsByDoctorId(doctor.getId()));
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ca khám"));

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
        booking.setSlot(slot);
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
    // 4. Collect booking prepayment fee (10,000 VND)
    // =====================================================

    public BookingTicketDto processBookingFee(UUID bookingId, Booking.PaymentMethod method) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy lịch khám"));

        if (booking.getBookingFeePaidAt() != null) {
            return toTicketDto(booking);
        }

        if (booking.getStatus() == Booking.BookingStatus.CANCELED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lịch hẹn đã bị hủy");
        }

        booking.setBookingFeeCents(1_000_000);
        booking.setBookingFeePaidAt(Instant.now());
        booking.setBookingFeePaymentMethod(method != null ? method : Booking.PaymentMethod.QR);
        bookingRepository.save(booking);

        return toTicketDto(booking);
    }

    // =====================================================
    // 5. Get booking ticket (for QR display)
    // =====================================================

    @Transactional(readOnly = true)
    public BookingTicketDto getBookingTicket(UUID bookingId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy lịch khám"));
        return toTicketDto(booking);
    }

    // =====================================================
    // 6. Check-in by booking ID (QR scan)
    // =====================================================

    public BookingTicketDto checkInByBookingId(UUID bookingId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy lịch khám"));

        if (booking.getStatus() == Booking.BookingStatus.CHECKED_IN
                || booking.getStatus() == Booking.BookingStatus.WAITING
                || booking.getStatus() == Booking.BookingStatus.IN_CONSULTATION) {
            return toTicketDto(booking); // already checked in
        }

        if (booking.getStatus() != Booking.BookingStatus.BOOKED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Không thể check-in lịch khám (trạng thái: " + booking.getStatus() + ")");
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
                patient.getId(), LocalDate.now(CLINIC_ZONE));

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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy lịch khám"));

        if (booking.getShift() == null || booking.getShift().getDoctor() == null || booking.getPatient() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Lịch khám thiếu thông tin bác sĩ hoặc bệnh nhân, chưa thể gửi đánh giá");
        }

        boolean canRate = booking.getStatus() == Booking.BookingStatus.COMPLETED
                || booking.getPaymentStatus() == Booking.PaymentStatus.PAID;
        if (!canRate) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Chỉ có thể đánh giá sau khi buổi khám hoàn tất");
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
        rating.setComment(req.comment() != null ? req.comment().trim() : null);
        ratingRepository.save(rating);
    }

        // =====================================================
        // Cancel booking (allowed only if more than 24 hours before shift start)
        // =====================================================

        public void cancelBooking(UUID bookingId, String phone) {
                Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                                .orElseThrow(() -> new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Không tìm thấy lịch khám"));

                String normalizedPhone = phone == null ? "" : phone.trim();
                if (normalizedPhone.isBlank()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "Vui lòng cung cấp số điện thoại để hủy lịch.");
                }

                if (booking.getPatient() == null || booking.getPatient().getPhone() == null
                                || !booking.getPatient().getPhone().equals(normalizedPhone)) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                        "Số điện thoại không khớp với lịch hẹn.");
                }

                if (booking.getStatus() == Booking.BookingStatus.CANCELED) {
                        return; // already canceled
                }

                Instant now = Instant.now();
                Instant shiftStart = booking.getShift().getStartTime();
                if (now.isAfter(shiftStart.minus(24, ChronoUnit.HOURS))) {
                        throw new ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT,
                                        "Không thể hủy lịch trong vòng 24 giờ trước giờ khám.");
                }

                // mark booking canceled
                booking.setStatus(Booking.BookingStatus.CANCELED);
                bookingRepository.save(booking);

                // release slot (if exists)
                if (booking.getSlotId() != null) {
                        slotRepository.findById(booking.getSlotId()).ifPresent(slot -> {
                                slot.setStatus(Slot.SlotStatus.OPEN);
                                slotRepository.save(slot);
                        });
                }
        }

    // =====================================================
    // Mappers
    // =====================================================

    private BookingTicketDto toTicketDto(Booking booking) {
        Shift shift = booking.getShift();
        Doctor doctor = shift.getDoctor();
        Patient patient = booking.getPatient();
        int slotSequence = getSlotSequence(booking);
        Instant appointmentTime = calculateAppointmentTime(shift, slotSequence);
        Integer currentServingQueueNumber = resolveCurrentServingQueueNumber(shift.getId());
        Instant estimatedTurnAt = calculateEstimatedTurnAt(booking, slotSequence, currentServingQueueNumber);

        return new BookingTicketDto(
                booking.getId(),
                booking.getQueueNumber(),
                slotSequence,
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
                booking.getCreatedAt(),
                appointmentTime,
                currentServingQueueNumber,
                estimatedTurnAt,
                booking.getBookingFeeCents(),
                booking.getBookingFeePaidAt() != null,
                booking.getBookingFeePaidAt(),
                booking.getBookingFeePaymentMethod() != null ? booking.getBookingFeePaymentMethod().name() : null);
    }

    private PatientBookingDto toPatientBookingDto(Booking booking) {
        Shift shift = booking.getShift();
        Doctor doctor = shift.getDoctor();
        int slotSequence = getSlotSequence(booking);
        Instant appointmentTime = calculateAppointmentTime(shift, slotSequence);
        Integer currentServingQueueNumber = resolveCurrentServingQueueNumber(shift.getId());
        Instant estimatedTurnAt = calculateEstimatedTurnAt(booking, slotSequence, currentServingQueueNumber);

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
        int servicePriceCents = booking.getService() != null && booking.getService().getPriceCents() != null
                ? booking.getService().getPriceCents()
                : 0;
        int labFeeCents = booking.getLabFeeCents() != null ? booking.getLabFeeCents() : 0;
        int prescriptionAmountCents = prescDto != null ? prescDto.totalCents() : 0;
        int totalBillCents = servicePriceCents + labFeeCents + prescriptionAmountCents;

        return new PatientBookingDto(
                booking.getId(),
                booking.getQueueNumber(),
                slotSequence,
                shift.getDate(),
                shift.getType().name(),
                shift.getTimeRange(),
                doctor.getDisplayName(),
                doctor.getSpecialty(),
                booking.getService() != null ? booking.getService().getName() : null,
                booking.getStatus().name(),
                booking.getPaymentStatus().name(),
                servicePriceCents,
                labFeeCents,
                prescriptionAmountCents,
                totalBillCents,
                booking.getBookingFeeCents(),
                booking.getBookingFeePaidAt() != null,
                booking.getBookingFeePaidAt(),
                booking.getBookingFeePaymentMethod() != null ? booking.getBookingFeePaymentMethod().name() : null,
                Boolean.TRUE.equals(booking.getIsFollowUp()),
                booking.getFollowUpSourceBooking() != null ? booking.getFollowUpSourceBooking().getId() : null,
                booking.getFollowUpScheduledAt(),
                booking.getFollowUpNote(),
                booking.getCreatedAt(),
                appointmentTime,
                booking.getCheckInAt(),
                booking.getCompletedAt(),
                currentServingQueueNumber,
                estimatedTurnAt,
                medRecord,
                prescDto,
                rating != null ? rating.getStars() : null,
                rating != null ? rating.getComment() : null);
    }

    private int getSlotSequence(Booking booking) {
        Slot slot = booking.getSlot();
        return slot != null && slot.getSequence() != null ? slot.getSequence() : 1;
    }

    private Instant calculateAppointmentTime(Shift shift, int slotSequence) {
        long minutesOffset = Math.max(slotSequence - 1, 0) * 15L;
        return shift.getStartTime().plus(Duration.ofMinutes(minutesOffset));
    }

    private Integer resolveCurrentServingQueueNumber(UUID shiftId) {
        return bookingRepository.findCurrentServingQueueNumber(shiftId);
    }

    private Instant calculateEstimatedTurnAt(Booking booking, int slotSequence, Integer currentServingQueueNumber) {
        Instant appointmentTime = calculateAppointmentTime(booking.getShift(), slotSequence);
        if (!booking.getShift().getDate().equals(LocalDate.now(CLINIC_ZONE)) || currentServingQueueNumber == null) {
            return appointmentTime;
        }

        int referenceNumber = booking.getQueueNumber() != null ? booking.getQueueNumber() : slotSequence;
        long slotsAhead = Math.max(referenceNumber - currentServingQueueNumber, 0);
        Instant queueBasedTime = Instant.now().plus(Duration.ofMinutes(slotsAhead * 15L));
        return queueBasedTime.isAfter(appointmentTime) ? queueBasedTime : appointmentTime;
    }
}

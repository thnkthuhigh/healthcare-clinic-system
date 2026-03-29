package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.CreateVisitRequest;
import com.clinic.backend.modules.admin.dto.CreateVisitResponse;
import com.clinic.backend.modules.admin.dto.DispatchOptionDto;
import com.clinic.backend.modules.admin.dto.PatientLookupResponse;
import com.clinic.backend.modules.admin.dto.ReceptionBookingDto;
import com.clinic.backend.modules.doctor.entity.*;
import com.clinic.backend.modules.doctor.repository.*;
import com.clinic.backend.modules.doctor.service.QueueNumberService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class ReceptionService {

    @PersistenceContext
    private EntityManager em;

    private final BookingRepository bookingRepository;
    private final ShiftRepository shiftRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final AutoDispatchService autoDispatchService;
    private final QueueNumberService queueNumberService;
    private final AuditLogService auditLogService;

    public ReceptionService(BookingRepository bookingRepository,
                            ShiftRepository shiftRepository,
                            PatientRepository patientRepository,
                            UserRepository userRepository,
                            AutoDispatchService autoDispatchService,
                            QueueNumberService queueNumberService,
                            AuditLogService auditLogService) {
        this.bookingRepository = bookingRepository;
        this.shiftRepository = shiftRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.autoDispatchService = autoDispatchService;
        this.queueNumberService = queueNumberService;
        this.auditLogService = auditLogService;
    }

    /**
     * Get all bookings for today's shifts, optionally filtered by shift.
     */
    @Transactional(readOnly = true)
    public List<ReceptionBookingDto> getTodayBookings(LocalDate date, UUID shiftId) {
        String sql = "SELECT b.id, b.queue_number, p.full_name, p.phone, d.display_name, " +
                "s.id AS shift_id, s.type, sv.name AS service_name, b.status, b.channel, " +
                "b.payment_status, b.check_in_at, b.created_at, b.priority_score, " +
                "COALESCE(r.name, 'Chưa gán phòng') AS room_name, CAST(sl.pool AS text) AS slot_pool, " +
                "b.is_follow_up, b.follow_up_source_booking_id, b.follow_up_scheduled_at, b.follow_up_note " +
                "FROM bookings b " +
                "JOIN shifts s ON b.shift_id = s.id " +
                "JOIN patients p ON b.patient_id = p.id " +
                "JOIN doctors d ON s.doctor_id = d.id " +
                "LEFT JOIN services sv ON b.service_id = sv.id " +
                "LEFT JOIN rooms r ON r.id = s.room_id " +
                "LEFT JOIN slots sl ON sl.id = b.slot_id " +
                "WHERE s.date = ?1 ";

        if (shiftId != null) {
            sql += "AND s.id = ?2 ";
        }
        sql += "ORDER BY b.priority_score DESC, b.check_in_at ASC NULLS LAST, b.created_at ASC";

        var query = em.createNativeQuery(sql);
        query.setParameter(1, date);
        if (shiftId != null) {
            query.setParameter(2, shiftId);
        }

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();

        List<ReceptionBookingDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            ReceptionBookingDto dto = new ReceptionBookingDto();
            dto.setId(row[0].toString());
            dto.setQueueNumber(row[1] != null ? ((Number) row[1]).intValue() : null);
            dto.setPatientName((String) row[2]);
            dto.setPatientPhone((String) row[3]);
            dto.setDoctorName((String) row[4]);
            dto.setShiftId(row[5].toString());
            dto.setShiftType(row[6].toString());
            dto.setServiceName((String) row[7]);
            dto.setStatus(row[8].toString());
            dto.setChannel(row[9].toString());
            dto.setPaymentStatus(row[10].toString());
            dto.setCheckInAt(toInstant(row[11]));
            dto.setCreatedAt(toInstant(row[12]));
            dto.setPriorityScore(row[13] != null ? ((Number) row[13]).intValue() : 0);
            dto.setRoomName(row[14] != null ? row[14].toString() : null);
            dto.setSlotPool(row[15] != null ? row[15].toString() : null);
            dto.setFollowUp(row[16] != null && (Boolean) row[16]);
            dto.setFollowUpSourceBookingId(row[17] != null ? row[17].toString() : null);
            dto.setFollowUpScheduledAt(toInstant(row[18]));
            dto.setFollowUpNote(row[19] != null ? row[19].toString() : null);
            result.add(dto);
        }
        return result;
    }

    /**
     * Search bookings by patient phone (for check-in). Only BOOKED status.
     */
    @Transactional(readOnly = true)
    public List<ReceptionBookingDto> searchBookingsByPhone(String phone, LocalDate date, boolean followUpOnly) {
        String sql = "SELECT b.id, b.queue_number, p.full_name, p.phone, d.display_name, " +
                "s.id AS shift_id, s.type, sv.name AS service_name, b.status, b.channel, " +
                "b.payment_status, b.check_in_at, b.created_at, b.priority_score, " +
                "COALESCE(r.name, 'Chưa gán phòng') AS room_name, CAST(sl.pool AS text) AS slot_pool, " +
                "b.is_follow_up, b.follow_up_source_booking_id, b.follow_up_scheduled_at, b.follow_up_note " +
                "FROM bookings b " +
                "JOIN shifts s ON b.shift_id = s.id " +
                "JOIN patients p ON b.patient_id = p.id " +
                "JOIN doctors d ON s.doctor_id = d.id " +
                "LEFT JOIN services sv ON b.service_id = sv.id " +
                "LEFT JOIN rooms r ON r.id = s.room_id " +
                "LEFT JOIN slots sl ON sl.id = b.slot_id " +
                "WHERE p.phone = ?1 AND b.status = 'BOOKED' " +
                (followUpOnly
                    ? "AND b.is_follow_up = TRUE AND s.date >= ?2 "
                    : "AND s.date = ?2 ") +
                "ORDER BY s.date ASC, s.start_time ASC";

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter(1, phone)
                .setParameter(2, date)
                .getResultList();

        List<ReceptionBookingDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            ReceptionBookingDto dto = new ReceptionBookingDto();
            dto.setId(row[0].toString());
            dto.setQueueNumber(row[1] != null ? ((Number) row[1]).intValue() : null);
            dto.setPatientName((String) row[2]);
            dto.setPatientPhone((String) row[3]);
            dto.setDoctorName((String) row[4]);
            dto.setShiftId(row[5].toString());
            dto.setShiftType(row[6].toString());
            dto.setServiceName((String) row[7]);
            dto.setStatus(row[8].toString());
            dto.setChannel(row[9].toString());
            dto.setPaymentStatus(row[10].toString());
            dto.setCheckInAt(toInstant(row[11]));
            dto.setCreatedAt(toInstant(row[12]));
            dto.setPriorityScore(row[13] != null ? ((Number) row[13]).intValue() : 0);
            dto.setRoomName(row[14] != null ? row[14].toString() : null);
            dto.setSlotPool(row[15] != null ? row[15].toString() : null);
            dto.setFollowUp(row[16] != null && (Boolean) row[16]);
            dto.setFollowUpSourceBookingId(row[17] != null ? row[17].toString() : null);
            dto.setFollowUpScheduledAt(toInstant(row[18]));
            dto.setFollowUpNote(row[19] != null ? row[19].toString() : null);
            result.add(dto);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public PatientLookupResponse lookupPatient(String phone) {
        return autoDispatchService.lookupPatient(phone);
    }

    @Transactional(readOnly = true)
    public List<DispatchOptionDto> getDispatchOptions(String serviceId) {
        return autoDispatchService.getDispatchOptions(serviceId);
    }

    @Transactional
    public CreateVisitResponse createVisit(CreateVisitRequest request) {
        return autoDispatchService.createVisit(request);
    }

    /**
     * Check-in a web-booked patient: BOOKED → CHECKED_IN, assign queue number, set priority.
     */
    @Transactional
    public ReceptionBookingDto checkIn(UUID bookingId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch khám"));

        if (booking.getStatus() != Booking.BookingStatus.BOOKED) {
            throw new IllegalArgumentException("Lịch khám không ở trạng thái chờ check-in (hiện tại: " + booking.getStatus() + ")");
        }

        booking.setStatus(Booking.BookingStatus.WAITING);
        booking.setCheckInAt(Instant.now());
        // Web on-time = priority 50 (Logic B)
        booking.setPriorityScore(50);

        // Assign queue number if missing
        if (booking.getQueueNumber() == null) {
            int nextQueue = queueNumberService.allocateNextForShift(booking.getShift().getId());
            booking.setQueueNumber(nextQueue);
        }

        bookingRepository.save(booking);

        return toDto(booking);
    }

    /**
     * Walk-in booking: find/create patient, allocate slot (COMMON→RESERVE→OVERRIDE), create booking.
     * Logic A: Bể Chung (12) → Bể Dự Phòng (4) → Override (cảnh báo).
     */
    @Transactional
    public Map<String, Object> walkIn(String patientName, String patientPhone, UUID shiftId, UUID serviceId) {
        // Validate shift exists and is open
        Shift shift = shiftRepository.findByIdWithDoctor(shiftId)
                .orElseThrow(() -> new IllegalArgumentException("Ca khám không tồn tại"));
        if (shift.getStatus() != Shift.ShiftStatus.OPEN) {
            throw new IllegalArgumentException("Ca khám đã đóng");
        }

        // Find or create patient
        Patient patient = patientRepository.findByPhone(patientPhone)
                .orElseGet(() -> {
                    Patient newPatient = new Patient();
                    newPatient.setFullName(patientName);
                    newPatient.setPhone(patientPhone);
                    patientRepository.save(newPatient);
                    // Auto-create user account for walk-in (PRD §2.7)
                    createUserAccountForWalkIn(newPatient);
                    return newPatient;
                });

        // Logic A: Allocate slot — COMMON first, then RESERVE, then OVERRIDE
        Object[] slotResult = allocateSlot(shiftId);
        UUID slotId = (UUID) slotResult[0];
        String poolUsed = (String) slotResult[1];
        boolean isOverride = "OVERRIDE".equals(poolUsed);

        // Create booking
        Booking booking = new Booking();
        booking.setShift(shift);
        booking.setSlotId(slotId);
        booking.setPatient(patient);
        booking.setChannel(Booking.BookingChannel.WALK_IN);
        booking.setStatus(Booking.BookingStatus.WAITING);
        booking.setCheckInAt(Instant.now());
        booking.setPriorityScore(0); // Walk-in = priority 0

        if (serviceId != null) {
            com.clinic.backend.modules.doctor.entity.Service service = em.find(
                    com.clinic.backend.modules.doctor.entity.Service.class, serviceId);
            if (service != null) booking.setService(service);
        }

        int nextQueue = queueNumberService.allocateNextForShift(shiftId);
        booking.setQueueNumber(nextQueue);

        bookingRepository.save(booking);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("booking", toDto(booking));
        response.put("poolUsed", poolUsed);
        response.put("isOverride", isOverride);
        response.put("queueNumber", nextQueue);
        return response;
    }

    /**
     * Mark a booking as NO_SHOW.
     */
    @Transactional
    public void markNoShow(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch khám"));

        String previousStatus = booking.getStatus().name();

        if (booking.getStatus() == Booking.BookingStatus.COMPLETED ||
            booking.getStatus() == Booking.BookingStatus.IN_CONSULTATION) {
            throw new IllegalArgumentException("Không thể đánh dấu NO_SHOW cho lịch đang khám hoặc đã hoàn thành");
        }

        booking.setStatus(Booking.BookingStatus.NO_SHOW);
        bookingRepository.save(booking);

        // Release the slot back to available
        releaseSlot(booking.getSlotId());

        auditLogService.log(
            "CANCEL_BOOKING",
            "BOOKING",
            booking.getId(),
            Map.of(
                "patientName", booking.getPatient().getFullName(),
                "doctorName", booking.getShift().getDoctor().getDisplayName(),
                "reason", "NO_SHOW",
                "fromStatus", previousStatus,
                "toStatus", booking.getStatus().name()
            )
        );
    }

    // ========== Private Helpers ==========

    /**
     * Logic A: Allocate slot from COMMON pool first, then RESERVE, then create OVERRIDE.
     */
    private Object[] allocateSlot(UUID shiftId) {
        // Try COMMON pool first
        UUID slotId = findAvailableSlot(shiftId, "COMMON");
        if (slotId != null) {
            lockSlot(slotId);
            return new Object[]{slotId, "COMMON"};
        }

        // Try RESERVE pool
        slotId = findAvailableSlot(shiftId, "RESERVE");
        if (slotId != null) {
            lockSlot(slotId);
            return new Object[]{slotId, "RESERVE"};
        }

        // OVERRIDE: create new slot beyond 16
        int maxSeq = getMaxSlotSequence(shiftId);
        UUID overrideSlotId = createOverrideSlot(shiftId, maxSeq + 1);
        return new Object[]{overrideSlotId, "OVERRIDE"};
    }

    private UUID findAvailableSlot(UUID shiftId, String pool) {
        @SuppressWarnings("unchecked")
        List<Object> results = em.createNativeQuery(
                "SELECT sl.id FROM slots sl " +
                "WHERE sl.shift_id = :shiftId AND sl.pool = CAST(:pool AS slot_pool) " +
                "AND sl.status = 'OPEN' " +
                "AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id = sl.id) " +
                "ORDER BY sl.sequence ASC LIMIT 1")
                .setParameter("shiftId", shiftId)
                .setParameter("pool", pool)
                .getResultList();

        if (results.isEmpty()) return null;
        return (UUID) results.get(0);
    }

    private void lockSlot(UUID slotId) {
        em.createNativeQuery("UPDATE slots SET status = 'LOCKED' WHERE id = :id")
                .setParameter("id", slotId)
                .executeUpdate();
    }

    private void releaseSlot(UUID slotId) {
        em.createNativeQuery("UPDATE slots SET status = 'OPEN' WHERE id = :id")
                .setParameter("id", slotId)
                .executeUpdate();
    }

    private int getMaxSlotSequence(UUID shiftId) {
        Object result = em.createNativeQuery(
                "SELECT COALESCE(MAX(sequence), 0) FROM slots WHERE shift_id = :shiftId")
                .setParameter("shiftId", shiftId)
                .getSingleResult();
        return ((Number) result).intValue();
    }

    private UUID createOverrideSlot(UUID shiftId, int sequence) {
        UUID slotId = UUID.randomUUID();
        em.createNativeQuery(
                "INSERT INTO slots (id, shift_id, sequence, pool, status) " +
                "VALUES (:id, :shiftId, :seq, 'OVERRIDE', 'LOCKED')")
                .setParameter("id", slotId)
                .setParameter("shiftId", shiftId)
                .setParameter("seq", sequence)
                .executeUpdate();
        return slotId;
    }

    /**
     * Auto-create user account so walk-in patient can login on web later (PRD §2.7).
     */
    private void createUserAccountForWalkIn(Patient patient) {
        if (userRepository.findByPhone(patient.getPhone()).isPresent()) {
            return; // Already has account
        }
        User user = new User();
        user.setPhone(patient.getPhone());
        // Default password = last 6 digits of phone
        String defaultPass = patient.getPhone().length() >= 6
                ? patient.getPhone().substring(patient.getPhone().length() - 6)
                : patient.getPhone();
        user.setPasswordHash(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(defaultPass));
        user.setRole(User.UserRole.PATIENT);
        user.setStatus(User.AccountStatus.ACTIVE);
        user.setFullName(patient.getFullName());
        userRepository.save(user);

        patient.setUser(user);
        patientRepository.save(patient);
    }

    private ReceptionBookingDto toDto(Booking booking) {
        ReceptionBookingDto dto = new ReceptionBookingDto();
        dto.setId(booking.getId().toString());
        dto.setQueueNumber(booking.getQueueNumber());
        dto.setPatientName(booking.getPatient().getFullName());
        dto.setPatientPhone(booking.getPatient().getPhone());
        dto.setDoctorName(booking.getShift().getDoctor().getDisplayName());
        dto.setShiftId(booking.getShift().getId().toString());
        dto.setShiftType(booking.getShift().getType().name());
        dto.setServiceName(booking.getService() != null ? booking.getService().getName() : null);
        dto.setStatus(booking.getStatus().name());
        dto.setChannel(booking.getChannel().name());
        dto.setPaymentStatus(booking.getPaymentStatus().name());
        dto.setCheckInAt(booking.getCheckInAt());
        dto.setCreatedAt(booking.getCreatedAt());
        dto.setPriorityScore(booking.getPriorityScore());
        dto.setRoomName(fetchRoomName(booking.getShift().getId()));
        dto.setSlotPool(fetchSlotPool(booking.getSlotId()));
        dto.setFollowUp(Boolean.TRUE.equals(booking.getIsFollowUp()));
        dto.setFollowUpSourceBookingId(
            booking.getFollowUpSourceBooking() != null ? booking.getFollowUpSourceBooking().getId().toString() : null
        );
        dto.setFollowUpScheduledAt(booking.getFollowUpScheduledAt());
        dto.setFollowUpNote(booking.getFollowUpNote());
        return dto;
    }

    private String fetchRoomName(UUID shiftId) {
        @SuppressWarnings("unchecked")
        List<Object> rows = em.createNativeQuery(
                "SELECT COALESCE(r.name, 'Chưa gán phòng') " +
                "FROM shifts s LEFT JOIN rooms r ON r.id = s.room_id " +
                "WHERE s.id = :shiftId")
            .setParameter("shiftId", shiftId)
            .getResultList();
        return rows.isEmpty() ? "Chưa gán phòng" : rows.get(0).toString();
    }

    private String fetchSlotPool(UUID slotId) {
        @SuppressWarnings("unchecked")
        List<Object> rows = em.createNativeQuery(
                "SELECT CAST(pool AS text) FROM slots WHERE id = :slotId")
            .setParameter("slotId", slotId)
            .getResultList();
        return rows.isEmpty() ? null : rows.get(0).toString();
    }

    private Instant toInstant(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Instant instant) {
            return instant;
        }
        if (value instanceof java.sql.Timestamp timestamp) {
            return timestamp.toInstant();
        }
        if (value instanceof OffsetDateTime offsetDateTime) {
            return offsetDateTime.toInstant();
        }
        if (value instanceof java.util.Date date) {
            return date.toInstant();
        }
        return null;
    }
}


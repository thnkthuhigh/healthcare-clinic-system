package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.ReceptionBookingDto;
import com.clinic.backend.modules.doctor.entity.*;
import com.clinic.backend.modules.doctor.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Service
public class ReceptionService {

    @PersistenceContext
    private EntityManager em;

    private final BookingRepository bookingRepository;
    private final ShiftRepository shiftRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    public ReceptionService(BookingRepository bookingRepository,
                            ShiftRepository shiftRepository,
                            PatientRepository patientRepository,
                            UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.shiftRepository = shiftRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
    }

    /**
     * Get all bookings for today's shifts, optionally filtered by shift.
     */
    @Transactional(readOnly = true)
    public List<ReceptionBookingDto> getTodayBookings(LocalDate date, UUID shiftId) {
        String sql = "SELECT b.id, b.queue_number, p.full_name, p.phone, d.display_name, " +
                "s.id AS shift_id, s.type, sv.name AS service_name, b.status, b.channel, " +
                "b.payment_status, b.check_in_at, b.created_at, b.priority_score " +
                "FROM bookings b " +
                "JOIN shifts s ON b.shift_id = s.id " +
                "JOIN patients p ON b.patient_id = p.id " +
                "JOIN doctors d ON s.doctor_id = d.id " +
                "LEFT JOIN services sv ON b.service_id = sv.id " +
                "WHERE s.date = :date ";

        if (shiftId != null) {
            sql += "AND s.id = :shiftId ";
        }
        sql += "ORDER BY b.priority_score DESC, b.check_in_at ASC NULLS LAST, b.created_at ASC";

        var query = em.createNativeQuery(sql);
        query.setParameter("date", date);
        if (shiftId != null) {
            query.setParameter("shiftId", shiftId);
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
            dto.setCheckInAt(row[11] != null ? ((java.sql.Timestamp) row[11]).toInstant() : null);
            dto.setCreatedAt(row[12] != null ? ((java.sql.Timestamp) row[12]).toInstant() : null);
            dto.setPriorityScore(((Number) row[13]).intValue());
            result.add(dto);
        }
        return result;
    }

    /**
     * Search bookings by patient phone (for check-in). Only BOOKED status.
     */
    @Transactional(readOnly = true)
    public List<ReceptionBookingDto> searchBookingsByPhone(String phone, LocalDate date) {
        String sql = "SELECT b.id, b.queue_number, p.full_name, p.phone, d.display_name, " +
                "s.id AS shift_id, s.type, sv.name AS service_name, b.status, b.channel, " +
                "b.payment_status, b.check_in_at, b.created_at, b.priority_score " +
                "FROM bookings b " +
                "JOIN shifts s ON b.shift_id = s.id " +
                "JOIN patients p ON b.patient_id = p.id " +
                "JOIN doctors d ON s.doctor_id = d.id " +
                "LEFT JOIN services sv ON b.service_id = sv.id " +
                "WHERE p.phone = :phone AND s.date = :date AND b.status = 'BOOKED' " +
                "ORDER BY s.start_time ASC";

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("phone", phone)
                .setParameter("date", date)
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
            dto.setCheckInAt(row[11] != null ? ((java.sql.Timestamp) row[11]).toInstant() : null);
            dto.setCreatedAt(row[12] != null ? ((java.sql.Timestamp) row[12]).toInstant() : null);
            dto.setPriorityScore(((Number) row[13]).intValue());
            result.add(dto);
        }
        return result;
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

        booking.setStatus(Booking.BookingStatus.CHECKED_IN);
        booking.setCheckInAt(Instant.now());
        // Web on-time = priority 50 (Logic B)
        booking.setPriorityScore(50);

        // Assign queue number if missing
        if (booking.getQueueNumber() == null) {
            int nextQueue = getNextQueueNumber(booking.getShift().getId());
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
        booking.setStatus(Booking.BookingStatus.CHECKED_IN);
        booking.setCheckInAt(Instant.now());
        booking.setPriorityScore(0); // Walk-in = priority 0

        if (serviceId != null) {
            com.clinic.backend.modules.doctor.entity.Service service = em.find(
                    com.clinic.backend.modules.doctor.entity.Service.class, serviceId);
            if (service != null) booking.setService(service);
        }

        int nextQueue = getNextQueueNumber(shiftId);
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

        if (booking.getStatus() == Booking.BookingStatus.COMPLETED ||
            booking.getStatus() == Booking.BookingStatus.IN_CONSULTATION) {
            throw new IllegalArgumentException("Không thể đánh dấu NO_SHOW cho lịch đang khám hoặc đã hoàn thành");
        }

        booking.setStatus(Booking.BookingStatus.NO_SHOW);
        bookingRepository.save(booking);

        // Release the slot back to available
        releaseSlot(booking.getSlotId());
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

    private int getNextQueueNumber(UUID shiftId) {
        Object result = em.createNativeQuery(
                "SELECT COALESCE(MAX(queue_number), 0) + 1 FROM bookings WHERE shift_id = :shiftId")
                .setParameter("shiftId", shiftId)
                .getSingleResult();
        return ((Number) result).intValue();
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
        return dto;
    }
}

package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.CreateVisitRequest;
import com.clinic.backend.modules.admin.dto.CreateVisitResponse;
import com.clinic.backend.modules.admin.dto.DispatchOptionDto;
import com.clinic.backend.modules.admin.dto.PatientLookupResponse;
import com.clinic.backend.modules.doctor.entity.Booking;
import com.clinic.backend.modules.doctor.entity.Patient;
import com.clinic.backend.modules.doctor.entity.Shift;
import com.clinic.backend.modules.doctor.entity.User;
import com.clinic.backend.modules.doctor.repository.BookingRepository;
import com.clinic.backend.modules.doctor.repository.PatientRepository;
import com.clinic.backend.modules.doctor.repository.UserRepository;
import com.clinic.backend.modules.doctor.service.QueueNumberService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AutoDispatchService {

    private static final String OVERRIDE_REASON = "FORCE_OVERRIDE";
    private static final ZoneId CLINIC_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @PersistenceContext
    private EntityManager em;

    private final BookingRepository bookingRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final QueueNumberService queueNumberService;
    private final AuditLogService auditLogService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AutoDispatchService(BookingRepository bookingRepository,
                               PatientRepository patientRepository,
                               UserRepository userRepository,
                               QueueNumberService queueNumberService,
                               AuditLogService auditLogService) {
        this.bookingRepository = bookingRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.queueNumberService = queueNumberService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PatientLookupResponse lookupPatient(String phone) {
        String normalizedPhone = normalizeRequired(phone, "Số điện thoại là bắt buộc");
        Patient patient = patientRepository.findByPhone(normalizedPhone).orElse(null);
        if (patient == null) {
            return null;
        }

        PatientLookupResponse response = new PatientLookupResponse();
        response.setPatientId(patient.getId().toString());
        response.setFullName(patient.getFullName());
        response.setPhone(patient.getPhone());
        response.setDateOfBirth(patient.getDateOfBirth() != null ? patient.getDateOfBirth().toString() : null);
        response.setGender(patient.getGender());
        response.setNationalId(patient.getNationalId());
        response.setInsuranceCode(patient.getInsuranceCode());
        return response;
    }

    @Transactional
    public CreateVisitResponse createVisit(CreateVisitRequest request) {
        UUID serviceId = parseUuid(request.getServiceId(), "serviceId");
        validateServiceExists(serviceId);
        UUID preferredDoctorId = parseOptionalUuid(request.getPreferredDoctorId(), "preferredDoctorId");

        boolean forceOverride = Boolean.TRUE.equals(request.getForceOverride());
        List<CandidateShift> candidates = findCandidateShifts(serviceId, LocalDate.now(CLINIC_ZONE));
        if (candidates.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không có bác sĩ phụ trách dịch vụ này hôm nay");
        }

        CandidateShift selected = selectShift(candidates, forceOverride, preferredDoctorId);
        SlotAllocation slotAllocation = allocateSlot(selected.shiftId, forceOverride);

        UpsertPatientResult patientResult = upsertPatient(request);
        int queueNumber = queueNumberService.allocateNextForShift(selected.shiftId);

        Booking booking = new Booking();
        booking.setShift(em.getReference(Shift.class, selected.shiftId));
        booking.setSlotId(slotAllocation.slotId);
        booking.setPatient(patientResult.patient);
        booking.setService(em.getReference(com.clinic.backend.modules.doctor.entity.Service.class, serviceId));
        booking.setChannel(Booking.BookingChannel.WALK_IN);
        booking.setStatus(Booking.BookingStatus.WAITING);
        booking.setCheckInAt(Instant.now());
        booking.setPriorityScore(0);
        booking.setQueueNumber(queueNumber);
        booking = bookingRepository.saveAndFlush(booking);

        if ("OVERRIDE".equals(slotAllocation.poolUsed)) {
            insertOverrideAuditLog(booking.getId(), selected.doctorName, selected.shiftId);
        }

        CreateVisitResponse response = new CreateVisitResponse();
        response.setBookingId(booking.getId().toString());
        response.setPatientId(patientResult.patient.getId().toString());
        response.setPatientName(patientResult.patient.getFullName());
        response.setQueueNumber(queueNumber);
        response.setDoctorName(selected.doctorName);
        response.setRoomName(selected.roomName);
        response.setShiftType(selected.shiftType);
        response.setOverride("OVERRIDE".equals(slotAllocation.poolUsed));
        response.setPoolUsed(slotAllocation.poolUsed);
        response.setNewPatient(patientResult.newPatient);
        return response;
    }

    @Transactional(readOnly = true)
    public List<DispatchOptionDto> getDispatchOptions(String rawServiceId) {
        UUID serviceId = parseUuid(rawServiceId, "serviceId");
        validateServiceExists(serviceId);

        List<CandidateShift> candidates = findCandidateShifts(serviceId, LocalDate.now(CLINIC_ZONE));
        List<DispatchOptionDto> result = new ArrayList<>();
        for (CandidateShift candidate : candidates) {
            DispatchOptionDto dto = new DispatchOptionDto();
            dto.setShiftId(candidate.shiftId.toString());
            dto.setDoctorId(candidate.doctorId.toString());
            dto.setDoctorName(candidate.doctorName);
            dto.setRoomName(candidate.roomName);
            dto.setShiftType(candidate.shiftType);
            dto.setOpenSlots(candidate.openCommonReserveSlots);
            dto.setBookingLoad(candidate.bookingLoad);
            result.add(dto);
        }
        return result;
    }

    private void validateServiceExists(UUID serviceId) {
        @SuppressWarnings("unchecked")
        List<Object> rows = em.createNativeQuery(
                "SELECT id FROM services WHERE id = :id AND is_active = true")
            .setParameter("id", serviceId)
            .getResultList();

        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Dịch vụ không tồn tại hoặc đang tắt");
        }
    }

    @SuppressWarnings("unchecked")
    private List<CandidateShift> findCandidateShifts(UUID serviceId, LocalDate date) {
        List<Object[]> rows = em.createNativeQuery(
                "SELECT " +
                    "s.id, d.id, d.display_name, COALESCE(r.name, 'Chưa gán phòng'), CAST(s.type AS text), " +
                    "(SELECT COUNT(*) FROM slots sl " +
                    " WHERE sl.shift_id = s.id " +
                    "   AND sl.status = 'OPEN' " +
                    "   AND sl.pool IN ('COMMON', 'RESERVE') " +
                    "   AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id = sl.id)) AS open_slots, " +
                    "(SELECT COUNT(*) FROM bookings b " +
                    " WHERE b.shift_id = s.id " +
                    "   AND b.status NOT IN ('CANCELED', 'NO_SHOW')) AS booking_load " +
                "FROM shifts s " +
                "JOIN doctors d ON d.id = s.doctor_id " +
                "LEFT JOIN rooms r ON r.id = s.room_id " +
                "WHERE s.date = :date " +
                "  AND s.status = 'OPEN' " +
                "  AND (r.id IS NULL OR r.service_id IS NULL OR r.service_id = :serviceId) " +
                "  AND ( " +
                "    EXISTS (SELECT 1 FROM doctor_services ds " +
                "            WHERE ds.doctor_id = d.id AND ds.service_id = :serviceId) " +
                "    OR EXISTS (SELECT 1 FROM services sv " +
                "               JOIN departments dep ON dep.id = sv.specialty_id " +
                "               WHERE sv.id = :serviceId " +
                "                 AND lower(trim(dep.name)) = lower(trim(coalesce(d.specialty, '')))) " +
                "  ) " +
                "ORDER BY booking_load ASC, open_slots DESC, s.start_time ASC")
            .setParameter("date", date)
            .setParameter("serviceId", serviceId)
            .getResultList();

        List<CandidateShift> candidates = new ArrayList<>();
        for (Object[] row : rows) {
            CandidateShift candidate = new CandidateShift();
            candidate.shiftId = (UUID) row[0];
            candidate.doctorId = (UUID) row[1];
            candidate.doctorName = row[2].toString();
            candidate.roomName = row[3] != null ? row[3].toString() : "Chưa gán phòng";
            candidate.shiftType = row[4].toString();
            candidate.openCommonReserveSlots = ((Number) row[5]).intValue();
            candidate.bookingLoad = ((Number) row[6]).intValue();
            candidates.add(candidate);
        }
        return candidates;
    }

    private CandidateShift selectShift(List<CandidateShift> candidates, boolean forceOverride, UUID preferredDoctorId) {
        if (preferredDoctorId != null) {
            for (CandidateShift candidate : candidates) {
                if (!candidate.doctorId.equals(preferredDoctorId)) {
                    continue;
                }
                if (!forceOverride && candidate.openCommonReserveSlots <= 0) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Bác sĩ được chọn đã hết slot trong ngày");
                }
                return candidate;
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bác sĩ được chọn không phù hợp với dịch vụ/ca hôm nay");
        }

        if (forceOverride) {
            return candidates.get(0);
        }

        for (CandidateShift candidate : candidates) {
            if (candidate.openCommonReserveSlots > 0) {
                return candidate;
            }
        }

        throw new ResponseStatusException(HttpStatus.CONFLICT, "Hết số khám cho dịch vụ này hôm nay");
    }

    @SuppressWarnings("unchecked")
    private SlotAllocation allocateSlot(UUID shiftId, boolean allowOverride) {
        List<Object[]> available = em.createNativeQuery(
                "SELECT sl.id, CAST(sl.pool AS text) " +
                "FROM slots sl " +
                "WHERE sl.shift_id = :shiftId " +
                "  AND sl.status = 'OPEN' " +
                "  AND sl.pool IN ('COMMON', 'RESERVE') " +
                "  AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id = sl.id) " +
                "ORDER BY CASE WHEN sl.pool = 'COMMON' THEN 0 ELSE 1 END, sl.sequence ASC " +
                "LIMIT 1")
            .setParameter("shiftId", shiftId)
            .getResultList();

        if (!available.isEmpty()) {
            UUID slotId = (UUID) available.get(0)[0];
            String poolUsed = available.get(0)[1].toString();
            lockSlot(slotId);
            return new SlotAllocation(slotId, poolUsed);
        }

        if (!allowOverride) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Hết số khám cho dịch vụ này hôm nay");
        }

        int maxSequence = ((Number) em.createNativeQuery(
                "SELECT COALESCE(MAX(sequence), 0) FROM slots WHERE shift_id = :shiftId")
            .setParameter("shiftId", shiftId)
            .getSingleResult()).intValue();

        UUID overrideSlotId = UUID.randomUUID();
        em.createNativeQuery(
                "INSERT INTO slots (id, shift_id, sequence, pool, status) " +
                "VALUES (:id, :shiftId, :sequence, 'OVERRIDE', 'LOCKED')")
            .setParameter("id", overrideSlotId)
            .setParameter("shiftId", shiftId)
            .setParameter("sequence", maxSequence + 1)
            .executeUpdate();

        return new SlotAllocation(overrideSlotId, "OVERRIDE");
    }

    private void lockSlot(UUID slotId) {
        em.createNativeQuery("UPDATE slots SET status = 'LOCKED' WHERE id = :slotId")
            .setParameter("slotId", slotId)
            .executeUpdate();
    }

    private UpsertPatientResult upsertPatient(CreateVisitRequest request) {
        String phone = normalizeRequired(request.getPatientPhone(), "Số điện thoại là bắt buộc");
        String fullName = normalizeRequired(request.getPatientName(), "Tên bệnh nhân là bắt buộc");
        LocalDate dob = parseOptionalDate(request.getPatientDob());
        String gender = normalizeGender(request.getPatientGender());
        String nationalId = normalizeOptional(request.getPatientNationalId());
        String insuranceCode = normalizeOptional(request.getPatientInsuranceCode());

        Patient patient = patientRepository.findByPhone(phone).orElse(null);
        boolean isNewPatient = false;

        if (patient == null) {
            patient = new Patient();
            patient.setPhone(phone);
            patient.setFullName(fullName);
            patient.setDateOfBirth(dob);
            patient.setGender(gender);
            patient.setNationalId(nationalId);
            patient.setInsuranceCode(insuranceCode);
            patient = patientRepository.saveAndFlush(patient);
            isNewPatient = true;
            createPatientUserIfMissing(patient);
        } else {
            patient.setFullName(fullName);
            if (dob != null) patient.setDateOfBirth(dob);
            if (gender != null) patient.setGender(gender);
            if (nationalId != null) patient.setNationalId(nationalId);
            if (insuranceCode != null) patient.setInsuranceCode(insuranceCode);
            patient = patientRepository.saveAndFlush(patient);
        }

        return new UpsertPatientResult(patient, isNewPatient);
    }

    private void createPatientUserIfMissing(Patient patient) {
        if (userRepository.findByPhone(patient.getPhone()).isPresent()) {
            return;
        }

        User user = new User();
        user.setPhone(patient.getPhone());
        user.setRole(User.UserRole.PATIENT);
        user.setStatus(User.AccountStatus.ACTIVE);
        user.setFullName(patient.getFullName());
        user.setPasswordHash(passwordEncoder.encode(defaultPasswordFromPhone(patient.getPhone())));
        user = userRepository.save(user);

        patient.setUser(user);
        patientRepository.save(patient);
    }

    private void insertOverrideAuditLog(UUID bookingId, String doctorName, UUID shiftId) {
        auditLogService.log(
            "OVERRIDE_SLOT",
            "BOOKING",
            bookingId,
            Map.of(
                "doctorName", doctorName,
                "shiftId", shiftId.toString(),
                "reason", OVERRIDE_REASON
            )
        );
    }

    private String defaultPasswordFromPhone(String phone) {
        if (phone.length() <= 6) {
            return phone;
        }
        return phone.substring(phone.length() - 6);
    }

    private UUID parseUuid(String rawValue, String fieldName) {
        String normalized = normalizeRequired(rawValue, fieldName + " là bắt buộc");
        try {
            return UUID.fromString(normalized);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không hợp lệ");
        }
    }

    private UUID parseOptionalUuid(String rawValue, String fieldName) {
        String normalized = normalizeOptional(rawValue);
        if (normalized == null) {
            return null;
        }
        try {
            return UUID.fromString(normalized);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không hợp lệ");
        }
    }

    private String normalizeRequired(String value, String message) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private LocalDate parseOptionalDate(String value) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            return null;
        }
        try {
            return LocalDate.parse(normalized);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "patientDob không đúng định dạng YYYY-MM-DD");
        }
    }

    private String normalizeGender(String value) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            return null;
        }
        String upper = normalized.toUpperCase(Locale.ROOT);
        if (!upper.equals("MALE") && !upper.equals("FEMALE") && !upper.equals("OTHER")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "patientGender không hợp lệ");
        }
        return upper;
    }

    private static class CandidateShift {
        private UUID shiftId;
        private UUID doctorId;
        private String doctorName;
        private String roomName;
        private String shiftType;
        private int openCommonReserveSlots;
        private int bookingLoad;
    }

    private record SlotAllocation(UUID slotId, String poolUsed) {}

    private record UpsertPatientResult(Patient patient, boolean newPatient) {}
}

package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.AdminShiftDto;
import com.clinic.backend.modules.admin.dto.AdminSlotDto;
import com.clinic.backend.modules.admin.dto.BulkShiftRequest;
import com.clinic.backend.modules.admin.dto.BulkShiftResponse;
import com.clinic.backend.modules.admin.dto.CreateShiftRequest;
import com.clinic.backend.modules.admin.dto.SyncWeekShiftRequest;
import com.clinic.backend.modules.admin.dto.SyncWeekShiftResponse;
import com.clinic.backend.modules.doctor.entity.Doctor;
import com.clinic.backend.modules.doctor.entity.Shift;
import com.clinic.backend.modules.doctor.repository.DoctorRepository;
import com.clinic.backend.modules.doctor.repository.ShiftRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ShiftManagementService {
    private static final int DEFAULT_SHIFT_SLOT_COUNT = 20;
    private static final int DEFAULT_COMMON_SLOT_COUNT = 16;

    private final ShiftRepository shiftRepository;
    private final DoctorRepository doctorRepository;

    @PersistenceContext
    private EntityManager em;

    public ShiftManagementService(ShiftRepository shiftRepository,
                                  DoctorRepository doctorRepository) {
        this.shiftRepository = shiftRepository;
        this.doctorRepository = doctorRepository;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<AdminShiftDto> getShiftsForDate(LocalDate date) {
        List<Object[]> rows = em.createNativeQuery(
            "SELECT s.id, d.id AS doctor_id, d.display_name, d.specialty, " +
            "CAST(s.date AS text), CAST(s.type AS text), s.start_time, s.end_time, CAST(s.status AS text), s.is_makeup, s.adjustment_note, s.created_at, " +
            "(SELECT COUNT(*) FROM slots sl WHERE sl.shift_id = s.id) AS total_slots, " +
            "(SELECT COUNT(*) FROM bookings b WHERE b.shift_id = s.id " +
            " AND b.status NOT IN ('CANCELED', 'NO_SHOW')) AS booked_slots " +
            "FROM shifts s JOIN doctors d ON s.doctor_id = d.id " +
            "WHERE s.date = :date ORDER BY s.start_time")
            .setParameter("date", Date.valueOf(date))
            .getResultList();

        List<AdminShiftDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            AdminShiftDto dto = new AdminShiftDto();
            dto.setId(row[0].toString());
            dto.setDoctorId(row[1].toString());
            dto.setDoctorName((String) row[2]);
            dto.setDoctorSpecialty(row[3] != null ? (String) row[3] : null);
            dto.setDate(row[4].toString());
            dto.setType(row[5].toString());
            dto.setStartTime(row[6].toString());
            dto.setEndTime(row[7].toString());
            dto.setStatus(row[8].toString());
            dto.setMakeup((Boolean) row[9]);
            dto.setAdjustmentNote(row[10] != null ? row[10].toString() : null);
            dto.setCreatedAt(row[11].toString());
            int total = ((Number) row[12]).intValue();
            int booked = ((Number) row[13]).intValue();
            dto.setTotalSlots(total);
            dto.setBookedSlots(booked);
            dto.setOpenSlots(Math.max(0, total - booked));
            result.add(dto);
        }
        return result;
    }

    @Transactional
    public AdminShiftDto createShift(CreateShiftRequest request) {
        UUID doctorId = parseDoctorId(request.getDoctorId());
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bác sĩ"));

        LocalDate date = parseDate(request.getDate(), "date");
        Shift.ShiftType type = parseShiftType(request.getType(), "type");

        if (shiftRepository.existsByDoctorIdAndDateAndType(doctorId, date, type)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ca trực này đã tồn tại");
        }

        Shift shift = createShiftWithDefaultSlots(doctor, date, type, false, null);
        return toShiftDto(shift, DEFAULT_SHIFT_SLOT_COUNT, 0);
    }

    @Transactional
    public BulkShiftResponse bulkCreateShifts(BulkShiftRequest request) {
        UUID doctorId = parseDoctorId(request.getDoctorId());
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bác sĩ"));

        LocalDate weekStartDate = parseDate(request.getWeekStartDate(), "weekStartDate");
        List<DayShiftRule> dayRules = parseBulkDayShiftRules(request);
        int repeatWeeks = parseRepeatWeeks(request.getRepeatWeeks());

        List<AdminShiftDto> created = new ArrayList<>();
        List<BulkShiftResponse.SkippedShiftDto> skipped = new ArrayList<>();

        for (int week = 0; week < repeatWeeks; week++) {
            LocalDate currentWeekStart = weekStartDate.plusWeeks(week);
            for (DayShiftRule rule : dayRules) {
                LocalDate targetDate = currentWeekStart.plusDays(rule.dayOfWeek - 1L);
                for (Shift.ShiftType shiftType : rule.shiftTypes) {
                    boolean exists = shiftRepository.existsByDoctorIdAndDateAndType(doctorId, targetDate, shiftType);
                    if (exists) {
                        skipped.add(buildSkip(targetDate, shiftType.name(), "EXISTS"));
                        continue;
                    }

                    Shift shift = createShiftWithDefaultSlots(doctor, targetDate, shiftType, false, null);
                    created.add(toShiftDto(shift, DEFAULT_SHIFT_SLOT_COUNT, 0));
                }
            }
        }

        BulkShiftResponse response = new BulkShiftResponse();
        response.setDoctorId(doctor.getId().toString());
        response.setWeekStartDate(weekStartDate.toString());
        response.setRepeatWeeks(repeatWeeks);
        response.setCreated(created);
        response.setSkipped(skipped);
        return response;
    }

    @Transactional
    public SyncWeekShiftResponse syncWeekShifts(SyncWeekShiftRequest request) {
        UUID doctorId = parseDoctorId(request.getDoctorId());
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bác sĩ"));

        LocalDate weekStartDate = parseDate(request.getWeekStartDate(), "weekStartDate");
        String note = normalizeRequired(request.getNote(), "note");
        Map<Integer, Set<Shift.ShiftType>> desiredByDay = parseDayConfigMap(request.getDayConfigs(), false);

        List<AdminShiftDto> created = new ArrayList<>();
        List<SyncWeekShiftResponse.ChangedShiftDto> deleted = new ArrayList<>();
        List<BulkShiftResponse.SkippedShiftDto> skipped = new ArrayList<>();

        for (int day = 1; day <= 7; day++) {
            LocalDate targetDate = weekStartDate.plusDays(day - 1L);
            Set<Shift.ShiftType> desired = desiredByDay.getOrDefault(day, Collections.emptySet());
            List<Shift> existingShifts = shiftRepository.findByDoctorIdAndDate(doctorId, targetDate);

            Map<Shift.ShiftType, Shift> existingByType = new LinkedHashMap<>();
            for (Shift shift : existingShifts) {
                existingByType.put(shift.getType(), shift);
            }

            for (Shift.ShiftType shiftType : desired) {
                if (existingByType.containsKey(shiftType)) {
                    continue;
                }
                Shift shift = createShiftWithDefaultSlots(doctor, targetDate, shiftType, true, note);
                created.add(toShiftDto(shift, DEFAULT_SHIFT_SLOT_COUNT, 0));
            }

            for (Shift shift : existingShifts) {
                if (desired.contains(shift.getType())) {
                    continue;
                }
                if (hasActiveBookings(shift.getId())) {
                    skipped.add(buildSkip(targetDate, shift.getType().name(), "HAS_BOOKINGS"));
                    continue;
                }
                shiftRepository.deleteById(shift.getId());
                SyncWeekShiftResponse.ChangedShiftDto deletedItem = new SyncWeekShiftResponse.ChangedShiftDto();
                deletedItem.setDate(targetDate.toString());
                deletedItem.setType(shift.getType().name());
                deleted.add(deletedItem);
            }
        }

        SyncWeekShiftResponse response = new SyncWeekShiftResponse();
        response.setDoctorId(doctorId.toString());
        response.setWeekStartDate(weekStartDate.toString());
        response.setCreated(created);
        response.setDeleted(deleted);
        response.setSkipped(skipped);
        return response;
    }

    @Transactional
    public AdminShiftDto setShiftStatus(UUID shiftId, Shift.ShiftStatus newStatus) {
        Shift shift = shiftRepository.findByIdWithDoctor(shiftId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ca trực"));
        shift.setStatus(newStatus);
        shiftRepository.save(shift);
        return buildSimpleDto(shift);
    }

    @Transactional
    public void deleteShift(UUID shiftId) {
        if (!shiftRepository.existsById(shiftId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ca trực");
        }
        Number count = (Number) em.createNativeQuery(
            "SELECT COUNT(*) FROM bookings WHERE shift_id = :shiftId " +
            "AND status NOT IN ('CANCELED', 'NO_SHOW')")
            .setParameter("shiftId", shiftId)
            .getSingleResult();
        if (count.longValue() > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Ca có lịch hẹn đang hoạt động, không thể xóa");
        }
        shiftRepository.deleteById(shiftId);
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<AdminSlotDto> getSlots(UUID shiftId) {
        if (!shiftRepository.existsById(shiftId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ca trực");
        }
        List<Object[]> rows = em.createNativeQuery(
            "SELECT id, sequence, pool, status FROM slots " +
            "WHERE shift_id = :shiftId ORDER BY sequence")
            .setParameter("shiftId", shiftId)
            .getResultList();
        return rows.stream().map(row -> {
            AdminSlotDto dto = new AdminSlotDto();
            dto.setId(row[0].toString());
            dto.setSequence(((Number) row[1]).intValue());
            dto.setPool(row[2].toString());
            dto.setStatus(row[3].toString());
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public AdminSlotDto toggleSlot(UUID slotId) {
        int updated = em.createNativeQuery(
            "UPDATE slots SET status = " +
            "CASE WHEN status = CAST('OPEN' AS slot_status) THEN CAST('LOCKED' AS slot_status) " +
            "     ELSE CAST('OPEN' AS slot_status) END " +
            "WHERE id = :slotId")
            .setParameter("slotId", slotId)
            .executeUpdate();
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy slot");
        }
        Object[] row = (Object[]) em.createNativeQuery(
            "SELECT id, sequence, pool, status FROM slots WHERE id = :slotId")
            .setParameter("slotId", slotId)
            .getSingleResult();
        AdminSlotDto dto = new AdminSlotDto();
        dto.setId(row[0].toString());
        dto.setSequence(((Number) row[1]).intValue());
        dto.setPool(row[2].toString());
        dto.setStatus(row[3].toString());
        return dto;
    }

    private AdminShiftDto buildSimpleDto(Shift shift) {
        AdminShiftDto dto = new AdminShiftDto();
        dto.setId(shift.getId().toString());
        dto.setDoctorId(shift.getDoctor().getId().toString());
        dto.setDoctorName(shift.getDoctor().getDisplayName());
        dto.setDoctorSpecialty(shift.getDoctor().getSpecialty());
        dto.setDate(shift.getDate().toString());
        dto.setType(shift.getType().name());
        dto.setStatus(shift.getStatus().name());
        dto.setMakeup(Boolean.TRUE.equals(shift.getIsMakeup()));
        dto.setAdjustmentNote(shift.getAdjustmentNote());
        dto.setStartTime(shift.getStartTime().toString());
        dto.setEndTime(shift.getEndTime().toString());
        dto.setCreatedAt(shift.getCreatedAt().toString());
        return dto;
    }

    private Shift createShiftWithDefaultSlots(
            Doctor doctor,
            LocalDate date,
            Shift.ShiftType type,
            boolean isMakeup,
            String adjustmentNote) {
        ZoneId vn = ZoneId.of("Asia/Ho_Chi_Minh");
        Instant startTime;
        Instant endTime;
        if (type == Shift.ShiftType.MORNING) {
            startTime = date.atTime(7, 0).atZone(vn).toInstant();
            endTime = date.atTime(12, 0).atZone(vn).toInstant();
        } else {
            startTime = date.atTime(13, 0).atZone(vn).toInstant();
            endTime = date.atTime(18, 0).atZone(vn).toInstant();
        }

        Shift shift = new Shift();
        shift.setDoctor(doctor);
        shift.setDate(date);
        shift.setType(type);
        shift.setStartTime(startTime);
        shift.setEndTime(endTime);
        shift.setIsMakeup(isMakeup);
        shift.setAdjustmentNote(normalizeNullable(adjustmentNote));
        shift = shiftRepository.saveAndFlush(shift);

        for (int seq = 1; seq <= DEFAULT_SHIFT_SLOT_COUNT; seq++) {
            String pool = seq <= DEFAULT_COMMON_SLOT_COUNT ? "COMMON" : "RESERVE";
            em.createNativeQuery(
                "INSERT INTO slots (id, shift_id, sequence, pool, status) " +
                "VALUES (gen_random_uuid(), :shiftId, :seq, CAST(:pool AS slot_pool), CAST('OPEN' AS slot_status))")
                .setParameter("shiftId", shift.getId())
                .setParameter("seq", seq)
                .setParameter("pool", pool)
                .executeUpdate();
        }
        return shift;
    }

    private AdminShiftDto toShiftDto(Shift shift, int totalSlots, int bookedSlots) {
        AdminShiftDto dto = new AdminShiftDto();
        dto.setId(shift.getId().toString());
        dto.setDoctorId(shift.getDoctor().getId().toString());
        dto.setDoctorName(shift.getDoctor().getDisplayName());
        dto.setDoctorSpecialty(shift.getDoctor().getSpecialty());
        dto.setDate(shift.getDate().toString());
        dto.setType(shift.getType().name());
        dto.setStatus(shift.getStatus().name());
        dto.setMakeup(Boolean.TRUE.equals(shift.getIsMakeup()));
        dto.setAdjustmentNote(shift.getAdjustmentNote());
        dto.setStartTime(shift.getStartTime().toString());
        dto.setEndTime(shift.getEndTime().toString());
        dto.setTotalSlots(totalSlots);
        dto.setBookedSlots(bookedSlots);
        dto.setOpenSlots(Math.max(0, totalSlots - bookedSlots));
        dto.setCreatedAt(shift.getCreatedAt().toString());
        return dto;
    }

    private BulkShiftResponse.SkippedShiftDto buildSkip(LocalDate date, String type, String reason) {
        BulkShiftResponse.SkippedShiftDto dto = new BulkShiftResponse.SkippedShiftDto();
        dto.setDate(date.toString());
        dto.setType(type);
        dto.setReason(reason);
        return dto;
    }

    private boolean hasActiveBookings(UUID shiftId) {
        Number count = (Number) em.createNativeQuery(
                "SELECT COUNT(*) FROM bookings WHERE shift_id = :shiftId " +
                "AND status NOT IN ('CANCELED', 'NO_SHOW')")
            .setParameter("shiftId", shiftId)
            .getSingleResult();
        return count.longValue() > 0;
    }

    private UUID parseDoctorId(String rawDoctorId) {
        try {
            return UUID.fromString(rawDoctorId);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "doctorId không hợp lệ");
        }
    }

    private LocalDate parseDate(String rawDate, String fieldName) {
        try {
            return LocalDate.parse(rawDate);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không đúng định dạng YYYY-MM-DD");
        }
    }

    private Shift.ShiftType parseShiftType(String rawType, String fieldName) {
        try {
            return Shift.ShiftType.valueOf(rawType.toUpperCase());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " phải là MORNING hoặc AFTERNOON");
        }
    }

    private int parseRepeatWeeks(Integer rawRepeatWeeks) {
        int repeatWeeks = rawRepeatWeeks != null ? rawRepeatWeeks : 1;
        if (repeatWeeks < 1 || repeatWeeks > 52) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "repeatWeeks phải trong khoảng 1..52");
        }
        return repeatWeeks;
    }

    private List<DayShiftRule> parseBulkDayShiftRules(BulkShiftRequest request) {
        Map<Integer, Set<Shift.ShiftType>> byDay = parseDayConfigMap(request.getDayConfigs(), true);
        if (!byDay.isEmpty()) {
            List<DayShiftRule> rules = new ArrayList<>();
            for (Map.Entry<Integer, Set<Shift.ShiftType>> entry : byDay.entrySet()) {
                if (entry.getValue().isEmpty()) {
                    continue;
                }
                rules.add(new DayShiftRule(entry.getKey(), entry.getValue()));
            }
            if (rules.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dayConfigs không có buổi nào được chọn");
            }
            return rules;
        }

        Set<Integer> daysOfWeek = parseDaysOfWeek(request.getDaysOfWeek());
        Set<Shift.ShiftType> shiftTypes = parseShiftTypes(request.getShiftTypes(), "shiftTypes");
        List<DayShiftRule> rules = new ArrayList<>();
        for (Integer day : daysOfWeek) {
            rules.add(new DayShiftRule(day, shiftTypes));
        }
        return rules;
    }

    private Map<Integer, Set<Shift.ShiftType>> parseDayConfigMap(
            List<BulkShiftRequest.DayShiftConfig> rawConfigs,
            boolean allowEmptyConfigs) {
        Map<Integer, Set<Shift.ShiftType>> result = new LinkedHashMap<>();
        if (rawConfigs == null || rawConfigs.isEmpty()) {
            return result;
        }

        for (BulkShiftRequest.DayShiftConfig cfg : rawConfigs) {
            Integer day = cfg.getDayOfWeek();
            if (day == null || day < 1 || day > 7) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dayConfigs.dayOfWeek phải nằm trong khoảng 1..7");
            }
            Set<Shift.ShiftType> shiftTypes = parseShiftTypes(cfg.getShiftTypes(), "dayConfigs.shiftTypes");
            if (!allowEmptyConfigs && shiftTypes.isEmpty()) {
                result.put(day, Collections.emptySet());
            } else {
                result.put(day, shiftTypes);
            }
        }

        return result;
    }

    private Set<Integer> parseDaysOfWeek(List<Integer> rawDaysOfWeek) {
        if (rawDaysOfWeek == null || rawDaysOfWeek.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "daysOfWeek không được rỗng");
        }
        Set<Integer> result = new LinkedHashSet<>();
        for (Integer day : rawDaysOfWeek) {
            if (day == null || day < 1 || day > 7) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "daysOfWeek phải nằm trong khoảng 1..7");
            }
            result.add(day);
        }
        return result;
    }

    private Set<Shift.ShiftType> parseShiftTypes(List<String> rawShiftTypes, String fieldName) {
        if (rawShiftTypes == null || rawShiftTypes.isEmpty()) {
            return Collections.emptySet();
        }
        Set<Shift.ShiftType> result = new LinkedHashSet<>();
        for (String rawType : rawShiftTypes) {
            if (rawType == null || rawType.isBlank()) {
                continue;
            }
            result.add(parseShiftType(rawType, fieldName));
        }
        return result;
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeRequired(String value, String fieldName) {
        String normalized = normalizeNullable(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không được rỗng");
        }
        return normalized;
    }

    private static final class DayShiftRule {
        private final int dayOfWeek;
        private final Set<Shift.ShiftType> shiftTypes;

        private DayShiftRule(int dayOfWeek, Set<Shift.ShiftType> shiftTypes) {
            this.dayOfWeek = dayOfWeek;
            this.shiftTypes = new LinkedHashSet<>(shiftTypes);
        }
    }
}

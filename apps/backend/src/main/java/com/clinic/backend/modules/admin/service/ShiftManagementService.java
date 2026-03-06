package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.AdminShiftDto;
import com.clinic.backend.modules.admin.dto.AdminSlotDto;
import com.clinic.backend.modules.admin.dto.CreateShiftRequest;
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
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ShiftManagementService {

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
            "CAST(s.date AS text), CAST(s.type AS text), s.start_time, s.end_time, CAST(s.status AS text), s.created_at, " +
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
            dto.setCreatedAt(row[9].toString());
            int total = ((Number) row[10]).intValue();
            int booked = ((Number) row[11]).intValue();
            dto.setTotalSlots(total);
            dto.setBookedSlots(booked);
            dto.setOpenSlots(Math.max(0, total - booked));
            result.add(dto);
        }
        return result;
    }

    @Transactional
    public AdminShiftDto createShift(CreateShiftRequest request) {
        UUID doctorId = UUID.fromString(request.getDoctorId());
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bác sĩ"));

        LocalDate date = LocalDate.parse(request.getDate());
        Shift.ShiftType type = Shift.ShiftType.valueOf(request.getType().toUpperCase());

        if (shiftRepository.existsByDoctorIdAndDateAndType(doctorId, date, type)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ca trực này đã tồn tại");
        }

        ZoneId vn = ZoneId.of("Asia/Ho_Chi_Minh");
        Instant startTime, endTime;
        if (type == Shift.ShiftType.MORNING) {
            startTime = date.atTime(7, 0).atZone(vn).toInstant();
            endTime   = date.atTime(11, 0).atZone(vn).toInstant();
        } else {
            startTime = date.atTime(13, 0).atZone(vn).toInstant();
            endTime   = date.atTime(17, 0).atZone(vn).toInstant();
        }

        Shift shift = new Shift();
        shift.setDoctor(doctor);
        shift.setDate(date);
        shift.setType(type);
        shift.setStartTime(startTime);
        shift.setEndTime(endTime);
        shift = shiftRepository.saveAndFlush(shift);

        // Logic A: generate 12 COMMON + 4 RESERVE slots (sequences 1-16)
        for (int seq = 1; seq <= 16; seq++) {
            String pool = seq <= 12 ? "COMMON" : "RESERVE";
            em.createNativeQuery(
                "INSERT INTO slots (id, shift_id, sequence, pool, status) " +
                "VALUES (gen_random_uuid(), :shiftId, :seq, CAST(:pool AS slot_pool), CAST('OPEN' AS slot_status))")
                .setParameter("shiftId", shift.getId())
                .setParameter("seq", seq)
                .setParameter("pool", pool)
                .executeUpdate();
        }

        AdminShiftDto dto = new AdminShiftDto();
        dto.setId(shift.getId().toString());
        dto.setDoctorId(doctor.getId().toString());
        dto.setDoctorName(doctor.getDisplayName());
        dto.setDoctorSpecialty(doctor.getSpecialty());
        dto.setDate(shift.getDate().toString());
        dto.setType(shift.getType().name());
        dto.setStatus(shift.getStatus().name());
        dto.setStartTime(shift.getStartTime().toString());
        dto.setEndTime(shift.getEndTime().toString());
        dto.setTotalSlots(16);
        dto.setOpenSlots(16);
        dto.setBookedSlots(0);
        dto.setCreatedAt(shift.getCreatedAt().toString());
        return dto;
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
            "SELECT id::text, sequence, pool::text, status::text FROM slots " +
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
            "CASE WHEN status::text = 'OPEN' THEN 'LOCKED'::slot_status " +
            "     ELSE 'OPEN'::slot_status END " +
            "WHERE id = :slotId")
            .setParameter("slotId", slotId)
            .executeUpdate();
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy slot");
        }
        Object[] row = (Object[]) em.createNativeQuery(
            "SELECT id::text, sequence, pool::text, status::text FROM slots WHERE id = :slotId")
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
        dto.setStartTime(shift.getStartTime().toString());
        dto.setEndTime(shift.getEndTime().toString());
        dto.setCreatedAt(shift.getCreatedAt().toString());
        return dto;
    }
}

package com.clinic.backend.modules.doctor.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class QueueNumberService {

    @PersistenceContext
    private EntityManager em;

    /**
     * Allocate next queue number in a single atomic scope:
     * scope = date + shift_type + room.
     * If room is not assigned, fallback to shift id to keep scope deterministic.
     */
    @Transactional
    @SuppressWarnings("unchecked")
    public int allocateNextForShift(UUID shiftId) {
        List<Object[]> scopeRows = em.createNativeQuery(
                "SELECT s.date, CAST(s.type AS text), COALESCE(CAST(s.room_id AS text), CAST(s.id AS text)) " +
                "FROM shifts s " +
                "WHERE s.id = :shiftId")
            .setParameter("shiftId", shiftId)
            .getResultList();

        if (scopeRows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ca khám");
        }

        Object[] scope = scopeRows.get(0);
        LocalDate queueDate = toLocalDate(scope[0]);
        String shiftType = scope[1].toString();
        String roomScope = scope[2].toString();

        String lockKey = queueDate + "|" + shiftType + "|" + roomScope;
        em.createNativeQuery("SELECT pg_advisory_xact_lock(hashtext(:lockKey))")
            .setParameter("lockKey", lockKey)
            .getSingleResult();

        Number next = (Number) em.createNativeQuery(
                "SELECT COALESCE(MAX(b.queue_number), 0) + 1 " +
                "FROM bookings b " +
                "JOIN shifts s ON s.id = b.shift_id " +
                "WHERE s.date = :queueDate " +
                "  AND CAST(s.type AS text) = :shiftType " +
                "  AND COALESCE(CAST(s.room_id AS text), CAST(s.id AS text)) = :roomScope")
            .setParameter("queueDate", queueDate)
            .setParameter("shiftType", shiftType)
            .setParameter("roomScope", roomScope)
            .getSingleResult();

        return next.intValue();
    }

    private LocalDate toLocalDate(Object raw) {
        if (raw instanceof LocalDate localDate) {
            return localDate;
        }
        if (raw instanceof Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không đọc được ngày ca khám");
    }
}

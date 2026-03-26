package com.clinic.backend.modules.doctor.repository;

import com.clinic.backend.modules.doctor.entity.Slot;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SlotRepository extends JpaRepository<Slot, UUID> {

    /**
     * Count available COMMON slots for a shift (used for availability display).
     */
    @Query("""
        SELECT COUNT(s)
        FROM Slot s
        WHERE s.shift.id = :shiftId
          AND s.pool = 'COMMON'
          AND s.status = 'OPEN'
          AND NOT EXISTS (
            SELECT 1
            FROM Booking b
            WHERE b.slotId = s.id
          )
        """)
    long countOpenCommonSlots(@Param("shiftId") UUID shiftId);

    /**
     * Fetch and lock the first available COMMON slot for booking (prevents double-booking).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT s
        FROM Slot s
        WHERE s.shift.id = :shiftId
          AND s.pool = 'COMMON'
          AND s.status = 'OPEN'
          AND NOT EXISTS (
            SELECT 1
            FROM Booking b
            WHERE b.slotId = s.id
          )
        ORDER BY s.sequence ASC
        """)
    List<Slot> findOpenCommonSlotsForUpdate(@Param("shiftId") UUID shiftId);

    /**
     * Fetch and lock the first available RESERVE slot for booking/follow-up fallback.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT s
        FROM Slot s
        WHERE s.shift.id = :shiftId
          AND s.pool = 'RESERVE'
          AND s.status = 'OPEN'
          AND NOT EXISTS (
            SELECT 1
            FROM Booking b
            WHERE b.slotId = s.id
          )
        ORDER BY s.sequence ASC
        """)
    List<Slot> findOpenReserveSlotsForUpdate(@Param("shiftId") UUID shiftId);
}

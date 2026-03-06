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
    @Query("SELECT COUNT(s) FROM Slot s WHERE s.shift.id = :shiftId AND s.pool = 'COMMON' AND s.status = 'OPEN'")
    long countOpenCommonSlots(@Param("shiftId") UUID shiftId);

    /**
     * Fetch and lock the first available COMMON slot for booking (prevents double-booking).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Slot s WHERE s.shift.id = :shiftId AND s.pool = 'COMMON' AND s.status = 'OPEN' ORDER BY s.sequence ASC")
    List<Slot> findOpenCommonSlotsForUpdate(@Param("shiftId") UUID shiftId);
}

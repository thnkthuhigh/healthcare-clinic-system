package com.clinic.backend.modules.doctor.repository;

import com.clinic.backend.modules.doctor.entity.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, UUID> {

    @Query("SELECT s FROM Shift s JOIN FETCH s.doctor WHERE s.doctor.id = :doctorId AND s.date = :date ORDER BY s.startTime")
    List<Shift> findByDoctorIdAndDate(@Param("doctorId") UUID doctorId, @Param("date") LocalDate date);

    @Query("SELECT s FROM Shift s WHERE s.doctor.id = :doctorId AND s.date BETWEEN :startDate AND :endDate ORDER BY s.date, s.startTime")
    List<Shift> findByDoctorIdAndDateBetween(
            @Param("doctorId") UUID doctorId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT s FROM Shift s JOIN FETCH s.doctor WHERE s.id = :shiftId")
    java.util.Optional<Shift> findByIdWithDoctor(@Param("shiftId") UUID shiftId);

    @Query("SELECT s FROM Shift s JOIN FETCH s.doctor WHERE s.date = :date ORDER BY s.startTime")
    List<Shift> findByDateWithDoctor(@Param("date") LocalDate date);

    boolean existsByDoctorIdAndDateAndType(UUID doctorId, LocalDate date, Shift.ShiftType type);
}

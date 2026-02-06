package com.clinic.backend.modules.doctor.repository;

import com.clinic.backend.modules.doctor.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, UUID> {
    
    Optional<MedicalRecord> findByBookingId(UUID bookingId);
    
    @Query("""
        SELECT mr FROM MedicalRecord mr 
        JOIN FETCH mr.doctor d
        JOIN FETCH mr.booking b
        WHERE mr.patient.id = :patientId
        ORDER BY mr.createdAt DESC
        """)
    List<MedicalRecord> findByPatientIdOrderByCreatedAtDesc(@Param("patientId") UUID patientId);
    
    @Query("""
        SELECT mr FROM MedicalRecord mr 
        JOIN FETCH mr.patient
        JOIN FETCH mr.doctor
        WHERE mr.id = :id
        """)
    Optional<MedicalRecord> findByIdWithDetails(@Param("id") UUID id);
}

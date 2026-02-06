package com.clinic.backend.modules.doctor.repository;

import com.clinic.backend.modules.doctor.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, UUID> {
    
    @Query("""
        SELECT p FROM Prescription p 
        JOIN FETCH p.items i
        JOIN FETCH i.medication
        WHERE p.booking.id = :bookingId
        """)
    Optional<Prescription> findByBookingIdWithItems(@Param("bookingId") UUID bookingId);
    
    Optional<Prescription> findByBookingId(UUID bookingId);
}

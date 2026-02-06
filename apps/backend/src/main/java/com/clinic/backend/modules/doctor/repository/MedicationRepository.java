package com.clinic.backend.modules.doctor.repository;

import com.clinic.backend.modules.doctor.entity.Medication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MedicationRepository extends JpaRepository<Medication, UUID> {
    
    List<Medication> findByIsActiveTrue();
    
    @Query("SELECT m FROM Medication m WHERE m.isActive = true AND LOWER(m.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Medication> searchByName(@Param("name") String name);
    
    @Query("SELECT m FROM Medication m WHERE m.isActive = true AND (m.stockReal - m.stockHold) > 0")
    List<Medication> findAvailable();
    
    /**
     * Hold stock for prescription (Logic C - Step 1)
     */
    @Modifying
    @Query("UPDATE Medication m SET m.stockHold = m.stockHold + :qty WHERE m.id = :id AND (m.stockReal - m.stockHold) >= :qty")
    int holdStock(@Param("id") UUID id, @Param("qty") int qty);
    
    /**
     * Release held stock (when prescription is canceled)
     */
    @Modifying
    @Query("UPDATE Medication m SET m.stockHold = m.stockHold - :qty WHERE m.id = :id AND m.stockHold >= :qty")
    int releaseHold(@Param("id") UUID id, @Param("qty") int qty);
    
    /**
     * Confirm stock deduction (Logic C - Step 2: when payment is made)
     */
    @Modifying
    @Query("UPDATE Medication m SET m.stockReal = m.stockReal - :qty, m.stockHold = m.stockHold - :qty WHERE m.id = :id AND m.stockHold >= :qty")
    int confirmDeduction(@Param("id") UUID id, @Param("qty") int qty);
}

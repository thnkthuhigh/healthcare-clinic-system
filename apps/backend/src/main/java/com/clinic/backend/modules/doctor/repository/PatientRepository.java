package com.clinic.backend.modules.doctor.repository;

import com.clinic.backend.modules.doctor.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PatientRepository extends JpaRepository<Patient, UUID> {
    
    Optional<Patient> findByPhone(String phone);
    
    @Query("SELECT p FROM Patient p WHERE LOWER(p.fullName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Patient> searchByName(@Param("name") String name);
    
    @Query("SELECT p FROM Patient p WHERE p.phone LIKE CONCAT('%', :phone, '%')")
    List<Patient> searchByPhone(@Param("phone") String phone);
    
    @Query("""
        SELECT p FROM Patient p 
        WHERE LOWER(p.fullName) LIKE LOWER(CONCAT('%', :query, '%'))
        OR p.phone LIKE CONCAT('%', :query, '%')
        OR p.nationalId LIKE CONCAT('%', :query, '%')
        """)
    List<Patient> search(@Param("query") String query);
}

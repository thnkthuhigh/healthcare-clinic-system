package com.clinic.backend.modules.doctor.repository;

import com.clinic.backend.modules.doctor.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, UUID> {
    
    @Query("SELECT d FROM Doctor d JOIN FETCH d.user WHERE d.user.id = :userId")
    Optional<Doctor> findByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT d FROM Doctor d JOIN FETCH d.user WHERE d.user.phone = :phone")
    Optional<Doctor> findByUserPhone(@Param("phone") String phone);
}

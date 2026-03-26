package com.clinic.backend.modules.doctor.repository;

import com.clinic.backend.modules.doctor.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, UUID> {
    
    @Query("SELECT d FROM Doctor d JOIN FETCH d.user WHERE d.user.id = :userId")
    Optional<Doctor> findByUserId(@Param("userId") UUID userId);
    
    @Query("SELECT d FROM Doctor d JOIN FETCH d.user WHERE d.user.phone = :phone")
    Optional<Doctor> findByUserPhone(@Param("phone") String phone);

    @Query(value = """
            SELECT DISTINCT d.*
            FROM doctors d
            JOIN doctor_services ds ON ds.doctor_id = d.id
            JOIN services s ON s.id = ds.service_id
            LEFT JOIN departments dep ON dep.id = s.specialty_id
            WHERE ds.service_id = :serviceId
              AND (
                s.specialty_id IS NULL
                OR lower(trim(coalesce(d.specialty, ''))) = lower(trim(coalesce(dep.name, '')))
              )
            ORDER BY d.display_name
            """, nativeQuery = true)
    List<Doctor> findByServiceMapping(@Param("serviceId") UUID serviceId);

    @Query(value = """
            SELECT DISTINCT d.*
            FROM doctors d
            JOIN services s ON s.id = :serviceId
            JOIN departments dep ON dep.id = s.specialty_id
            WHERE s.specialty_id IS NOT NULL
              AND lower(trim(coalesce(d.specialty, ''))) = lower(trim(coalesce(dep.name, '')))
            ORDER BY d.display_name
            """, nativeQuery = true)
    List<Doctor> findByServiceSpecialty(@Param("serviceId") UUID serviceId);
}

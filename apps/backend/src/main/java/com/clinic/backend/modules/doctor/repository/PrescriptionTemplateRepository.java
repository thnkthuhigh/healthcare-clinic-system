package com.clinic.backend.modules.doctor.repository;

import com.clinic.backend.modules.doctor.entity.PrescriptionTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrescriptionTemplateRepository extends JpaRepository<PrescriptionTemplate, UUID> {

    List<PrescriptionTemplate> findAllByOrderByNameAsc();

    @Query("SELECT t FROM PrescriptionTemplate t LEFT JOIN FETCH t.items i LEFT JOIN FETCH i.medication WHERE t.id = :id")
    Optional<PrescriptionTemplate> findByIdWithItems(@Param("id") UUID id);

    boolean existsByName(String name);
}

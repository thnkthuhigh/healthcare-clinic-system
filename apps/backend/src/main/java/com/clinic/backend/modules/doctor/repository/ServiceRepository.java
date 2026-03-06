package com.clinic.backend.modules.doctor.repository;

import com.clinic.backend.modules.doctor.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ServiceRepository extends JpaRepository<Service, UUID> {

    List<Service> findAllByOrderByNameAsc();

    @Query("SELECT s FROM Service s WHERE s.isActive = true ORDER BY s.name")
    List<Service> findAllActive();

    boolean existsByName(String name);
}

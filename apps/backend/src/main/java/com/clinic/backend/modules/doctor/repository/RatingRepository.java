package com.clinic.backend.modules.doctor.repository;

import com.clinic.backend.modules.doctor.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RatingRepository extends JpaRepository<Rating, UUID> {

    Optional<Rating> findByBookingId(UUID bookingId);

    @Query("SELECT AVG(r.stars) FROM Rating r WHERE r.doctor.id = :doctorId")
    Double findAverageStarsByDoctorId(@Param("doctorId") UUID doctorId);
}

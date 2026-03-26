package com.clinic.backend.modules.doctor.repository;

import com.clinic.backend.modules.doctor.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

        /**
         * Get patient queue for a shift, ordered by priority (Logic B)
         * Priority: RESULTS_READY (100) > WEB checked in on time (50) > WALK_IN (0) -
         * skip_count
         * Note: Using JPQL CAST function for PostgreSQL enum compatibility
         */
        @Query("""
                        SELECT b FROM Booking b
                        JOIN FETCH b.patient p
                        JOIN FETCH b.slot sl
                        LEFT JOIN FETCH b.service s
                        WHERE b.shift.id = :shiftId
                        AND CAST(b.status AS string) IN :statuses
                        ORDER BY b.priorityScore DESC, b.checkInAt ASC, sl.sequence ASC
                        """)
        List<Booking> findQueueByShiftId(
                        @Param("shiftId") UUID shiftId,
                        @Param("statuses") List<String> statuses);

        /**
         * Get all bookings for a shift
         */
        @Query("""
                        SELECT b FROM Booking b
                        JOIN FETCH b.patient
                        JOIN FETCH b.slot sl
                        LEFT JOIN FETCH b.service
                        WHERE b.shift.id = :shiftId
                        ORDER BY sl.sequence ASC, b.createdAt ASC
                        """)
        List<Booking> findAllByShiftId(@Param("shiftId") UUID shiftId);

        /**
         * Count bookings by status for a shift
         */
        @Query(value = "SELECT COUNT(*) FROM bookings WHERE shift_id = :shiftId AND status = CAST(:status AS booking_status)", nativeQuery = true)
        long countByShiftIdAndStatus(@Param("shiftId") UUID shiftId, @Param("status") String status);

        /**
         * Count total bookings for a shift
         */
        @Query("SELECT COUNT(b) FROM Booking b WHERE b.shift.id = :shiftId")
        long countByShiftId(@Param("shiftId") UUID shiftId);

        /**
         * Find booking with patient details
         */
        @Query("""
                        SELECT b FROM Booking b
                        JOIN FETCH b.patient
                        JOIN FETCH b.shift s
                        JOIN FETCH b.slot
                        JOIN FETCH s.doctor d
                        JOIN FETCH d.user
                        LEFT JOIN FETCH b.service
                        WHERE b.id = :bookingId
                        """)
        Optional<Booking> findByIdWithDetails(@Param("bookingId") UUID bookingId);

        /**
         * Get next patient in queue (first WAITING or CHECKED_IN patient)
         */
        @Query("""
                        SELECT b FROM Booking b
                        JOIN FETCH b.patient p
                        JOIN FETCH b.slot sl
                        WHERE b.shift.id = :shiftId
                        AND CAST(b.status AS string) IN ('CHECKED_IN', 'WAITING', 'RESULTS_READY')
                        ORDER BY b.priorityScore DESC, b.checkInAt ASC, sl.sequence ASC
                        LIMIT 1
                        """)
        Optional<Booking> findNextInQueue(@Param("shiftId") UUID shiftId);

        @Query("""
                        SELECT b FROM Booking b
                        JOIN FETCH b.patient
                        JOIN FETCH b.shift s
                        JOIN FETCH b.slot sl
                        LEFT JOIN FETCH b.service
                        WHERE s.id IN :shiftIds
                        ORDER BY s.date ASC, s.startTime ASC, sl.sequence ASC, b.createdAt ASC
                        """)
        List<Booking> findScheduleByShiftIds(@Param("shiftIds") List<UUID> shiftIds);

        /**
         * Get patient's booking history (COMPLETED bookings)
         */
        @Query("""
                        SELECT b FROM Booking b
                        JOIN FETCH b.shift s
                        JOIN FETCH s.doctor d
                        LEFT JOIN FETCH b.service sv
                        WHERE b.patient.id = :patientId
                        AND CAST(b.status AS string) = 'COMPLETED'
                        ORDER BY b.completedAt DESC
                        """)
        List<Booking> findPatientHistory(@Param("patientId") UUID patientId);

        /**
         * Get all bookings for a patient ordered by creation date (for full history page)
         */
        @Query("""
                        SELECT b FROM Booking b
                        JOIN FETCH b.shift s
                        JOIN FETCH s.doctor d
                        LEFT JOIN FETCH b.slot sl
                        LEFT JOIN FETCH b.service sv
                        WHERE b.patient.id = :patientId
                        ORDER BY b.createdAt DESC
                        """)
        List<Booking> findByPatientIdOrderByCreatedAtDesc(@Param("patientId") UUID patientId);

        @Query("""
                        SELECT MIN(b.queueNumber) FROM Booking b
                        WHERE b.shift.id = :shiftId
                        AND b.queueNumber IS NOT NULL
                        AND CAST(b.status AS string) IN ('CHECKED_IN', 'WAITING', 'IN_CONSULTATION', 'RESULTS_READY')
                        """)
        Integer findCurrentServingQueueNumber(@Param("shiftId") UUID shiftId);

        /**
         * Find today's BOOKED bookings for a patient (for phone check-in)
         */
        @Query("""
                        SELECT b FROM Booking b
                        JOIN FETCH b.shift s
                        JOIN FETCH s.doctor d
                        WHERE b.patient.id = :patientId
                        AND s.date = :today
                        AND CAST(b.status AS string) = 'BOOKED'
                        ORDER BY b.createdAt ASC
                        """)
        List<Booking> findTodayBookedByPatientId(
                        @Param("patientId") UUID patientId,
                        @Param("today") java.time.LocalDate today);

        @Query("""
                        SELECT b FROM Booking b
                        JOIN FETCH b.shift s
                        WHERE b.followUpSourceBooking.id = :sourceBookingId
                        AND s.date = :date
                        AND CAST(b.status AS string) <> 'CANCELED'
                        ORDER BY b.createdAt DESC
                        """)
        List<Booking> findFollowUpsBySourceAndDate(
                        @Param("sourceBookingId") UUID sourceBookingId,
                        @Param("date") java.time.LocalDate date);
}

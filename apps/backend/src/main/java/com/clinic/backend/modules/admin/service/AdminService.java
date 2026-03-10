package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.DashboardStatsResponse;
import com.clinic.backend.modules.admin.dto.ShiftOverviewDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AdminService {

    @PersistenceContext
    private EntityManager em;

    public DashboardStatsResponse getDashboardStats(LocalDate date) {
        DashboardStatsResponse stats = new DashboardStatsResponse();

        // Total patients for date (count bookings for shifts on that date)
        Query totalQ = em.createNativeQuery(
            "SELECT COUNT(*) FROM bookings b JOIN shifts s ON b.shift_id = s.id WHERE s.date = :date");
        totalQ.setParameter("date", date);
        stats.setTodayPatients(((Number) totalQ.getSingleResult()).longValue());

        // Waiting (CHECKED_IN + WAITING)
        Query waitingQ = em.createNativeQuery(
            "SELECT COUNT(*) FROM bookings b JOIN shifts s ON b.shift_id = s.id " +
            "WHERE s.date = :date AND b.status IN ('CHECKED_IN', 'WAITING')");
        waitingQ.setParameter("date", date);
        stats.setWaitingCount(((Number) waitingQ.getSingleResult()).longValue());

        // In consultation
        Query consultQ = em.createNativeQuery(
            "SELECT COUNT(*) FROM bookings b JOIN shifts s ON b.shift_id = s.id " +
            "WHERE s.date = :date AND b.status = 'IN_CONSULTATION'");
        consultQ.setParameter("date", date);
        stats.setInConsultationCount(((Number) consultQ.getSingleResult()).longValue());

        // Completed
        Query completedQ = em.createNativeQuery(
            "SELECT COUNT(*) FROM bookings b JOIN shifts s ON b.shift_id = s.id " +
            "WHERE s.date = :date AND b.status = 'COMPLETED'");
        completedQ.setParameter("date", date);
        stats.setCompletedCount(((Number) completedQ.getSingleResult()).longValue());

        // Unpaid (COMPLETED but payment UNPAID)
        Query unpaidQ = em.createNativeQuery(
            "SELECT COUNT(*) FROM bookings b JOIN shifts s ON b.shift_id = s.id " +
            "WHERE s.date = :date AND b.status = 'COMPLETED' AND b.payment_status = 'UNPAID'");
        unpaidQ.setParameter("date", date);
        stats.setUnpaidCount(((Number) unpaidQ.getSingleResult()).longValue());

        // Revenue (sum of paid prescriptions for today's bookings)
        Query revenueQ = em.createNativeQuery(
            "SELECT COALESCE(SUM(pi.unit_price_cents * pi.qty), 0) " +
            "FROM prescription_items pi " +
            "JOIN prescriptions p ON pi.prescription_id = p.id " +
            "JOIN bookings b ON p.booking_id = b.id " +
            "JOIN shifts s ON b.shift_id = s.id " +
            "WHERE s.date = :date AND p.status = 'PAID'");
        revenueQ.setParameter("date", date);
        stats.setRevenue(((Number) revenueQ.getSingleResult()).longValue());

        // Channel stats
        Query webQ = em.createNativeQuery(
            "SELECT COUNT(*) FROM bookings b JOIN shifts s ON b.shift_id = s.id " +
            "WHERE s.date = :date AND b.channel = 'WEB'");
        webQ.setParameter("date", date);
        stats.setWebBookings(((Number) webQ.getSingleResult()).longValue());

        Query walkInQ = em.createNativeQuery(
            "SELECT COUNT(*) FROM bookings b JOIN shifts s ON b.shift_id = s.id " +
            "WHERE s.date = :date AND b.channel = 'WALK_IN'");
        walkInQ.setParameter("date", date);
        stats.setWalkInBookings(((Number) walkInQ.getSingleResult()).longValue());

        return stats;
    }

    public List<ShiftOverviewDto> getTodayShifts(LocalDate date) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(
            "SELECT s.id, d.display_name, s.date, s.type, s.start_time, s.end_time, s.status, " +
            "(SELECT COUNT(*) FROM slots sl WHERE sl.shift_id = s.id) AS total_slots, " +
            "(SELECT COUNT(*) FROM bookings b WHERE b.shift_id = s.id) AS booked_slots, " +
            "(SELECT COUNT(*) FROM slots sl WHERE sl.shift_id = s.id AND sl.pool = 'COMMON' AND sl.status = 'OPEN') AS common_available, " +
            "(SELECT COUNT(*) FROM slots sl WHERE sl.shift_id = s.id AND sl.pool = 'RESERVE' AND sl.status = 'OPEN') AS reserve_available " +
            "FROM shifts s JOIN doctors d ON s.doctor_id = d.id WHERE s.date = :date ORDER BY s.start_time")
            .setParameter("date", date)
            .getResultList();

        List<ShiftOverviewDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            ShiftOverviewDto dto = new ShiftOverviewDto();
            dto.setId(row[0].toString());
            dto.setDoctorName((String) row[1]);
            dto.setDate(row[2].toString());
            dto.setType(row[3].toString());
            dto.setStartTime(row[4].toString());
            dto.setEndTime(row[5].toString());
            dto.setStatus(row[6].toString());
            dto.setTotalSlots(((Number) row[7]).intValue());
            dto.setBookedSlots(((Number) row[8]).intValue());
            dto.setCommonAvailable(((Number) row[9]).intValue());
            dto.setReserveAvailable(((Number) row[10]).intValue());
            result.add(dto);
        }
        return result;
    }
}

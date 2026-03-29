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

        Object[] bookingStats = (Object[]) em.createNativeQuery("""
                SELECT
                  COUNT(*) AS total_bookings,
                  COUNT(*) FILTER (
                    WHERE b.status IN ('CHECKED_IN', 'WAITING', 'PENDING_LAB', 'RESULTS_READY')
                  ) AS waiting_count,
                  COUNT(*) FILTER (WHERE b.status = 'IN_CONSULTATION') AS in_consultation_count,
                  COUNT(*) FILTER (WHERE b.status = 'COMPLETED') AS completed_count,
                  COUNT(*) FILTER (
                    WHERE b.status = 'COMPLETED' AND b.payment_status = 'UNPAID'
                  ) AS unpaid_count,
                  COUNT(*) FILTER (WHERE b.channel = 'WEB') AS web_count,
                  COUNT(*) FILTER (WHERE b.channel = 'WALK_IN') AS walk_in_count
                FROM bookings b
                JOIN shifts s ON b.shift_id = s.id
                WHERE s.date = :date
                """)
            .setParameter("date", date)
            .getSingleResult();

        stats.setTodayPatients(((Number) bookingStats[0]).longValue());
        stats.setWaitingCount(((Number) bookingStats[1]).longValue());
        stats.setInConsultationCount(((Number) bookingStats[2]).longValue());
        stats.setCompletedCount(((Number) bookingStats[3]).longValue());
        stats.setUnpaidCount(((Number) bookingStats[4]).longValue());
        stats.setWebBookings(((Number) bookingStats[5]).longValue());
        stats.setWalkInBookings(((Number) bookingStats[6]).longValue());

        Query revenueQ = em.createNativeQuery("""
                SELECT
                  COALESCE((
                    SELECT SUM(fl.amount_cents)
                    FROM finance_ledger fl
                    WHERE fl.entry_date = :date
                      AND fl.entry_type = 'INCOME'
                  ), 0)
                  +
                  COALESCE((
                    SELECT SUM(b.booking_fee_cents)
                    FROM bookings b
                    WHERE b.booking_fee_paid_at IS NOT NULL
                      AND CAST(timezone('Asia/Ho_Chi_Minh', b.booking_fee_paid_at) AS date) = :date
                  ), 0)
                """);
        revenueQ.setParameter("date", date);
        stats.setRevenue(((Number) revenueQ.getSingleResult()).longValue());

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

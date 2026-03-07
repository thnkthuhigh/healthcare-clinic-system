package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.AuditLogDto;
import com.clinic.backend.modules.admin.dto.ReportSummaryDto;
import com.clinic.backend.modules.admin.entity.AuditLog;
import com.clinic.backend.modules.admin.repository.AuditLogRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReportService {

    @PersistenceContext
    private EntityManager em;

    private final AuditLogRepository auditLogRepository;

    public ReportService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Get report summary for a date range — consultation stats, revenue, channel breakdown, override count.
     */
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public ReportSummaryDto getSummary(LocalDate from, LocalDate to) {
        Instant fromInstant = from.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant toInstant = to.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        ReportSummaryDto dto = new ReportSummaryDto();

        // Booking stats
        List<Object[]> bookingStats = em.createNativeQuery("""
                SELECT
                  COUNT(*) AS total,
                  COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed,
                  COUNT(*) FILTER (WHERE status = 'CANCELED') AS canceled,
                  COUNT(*) FILTER (WHERE status = 'NO_SHOW') AS no_show,
                  COUNT(*) FILTER (WHERE channel = 'WEB') AS web,
                  COUNT(*) FILTER (WHERE channel = 'WALK_IN') AS walk_in,
                  COUNT(*) FILTER (WHERE payment_status = 'PAID') AS paid,
                  COUNT(*) FILTER (WHERE payment_status = 'UNPAID' AND status = 'COMPLETED') AS unpaid
                FROM bookings
                WHERE created_at >= :fromInstant AND created_at < :toInstant
                """)
                .setParameter("fromInstant", fromInstant)
                .setParameter("toInstant", toInstant)
                .getResultList();

        if (!bookingStats.isEmpty()) {
            Object[] row = bookingStats.get(0);
            dto.setTotalBookings(((Number) row[0]).longValue());
            dto.setCompletedBookings(((Number) row[1]).longValue());
            dto.setCanceledBookings(((Number) row[2]).longValue());
            dto.setNoShowBookings(((Number) row[3]).longValue());
            dto.setWebBookings(((Number) row[4]).longValue());
            dto.setWalkInBookings(((Number) row[5]).longValue());
            dto.setPaidBookings(((Number) row[6]).longValue());
            dto.setUnpaidBookings(((Number) row[7]).longValue());
        }

        // Revenue: service revenue from paid bookings
        List<Object[]> revenueRows = em.createNativeQuery("""
                SELECT
                  COALESCE(SUM(sv.price_cents), 0) AS service_revenue,
                  COALESCE(SUM(
                    (SELECT COALESCE(SUM(pi.qty * pi.unit_price_cents), 0)
                     FROM prescriptions pr
                     JOIN prescription_items pi ON pi.prescription_id = pr.id
                     WHERE pr.booking_id = b.id AND pr.status = 'PAID')
                  ), 0) AS prescription_revenue
                FROM bookings b
                LEFT JOIN services sv ON sv.id = b.service_id
                WHERE b.payment_status = 'PAID'
                AND b.created_at >= :fromInstant AND b.created_at < :toInstant
                """)
                .setParameter("fromInstant", fromInstant)
                .setParameter("toInstant", toInstant)
                .getResultList();

        if (!revenueRows.isEmpty()) {
            Object[] row = revenueRows.get(0);
            long serviceRev = ((Number) row[0]).longValue();
            long prescriptionRev = ((Number) row[1]).longValue();
            dto.setServiceRevenueCents(serviceRev);
            dto.setPrescriptionRevenueCents(prescriptionRev);
            dto.setTotalRevenueCents(serviceRev + prescriptionRev);
        }

        // Override count: slots with pool = 'OVERRIDE' that were booked in this date range
        List<?> overrideRows = em.createNativeQuery("""
                SELECT COUNT(*)
                FROM bookings b
                JOIN slots sl ON sl.id = b.slot_id
                WHERE sl.pool = 'OVERRIDE'
                AND b.created_at >= :fromInstant AND b.created_at < :toInstant
                """)
                .setParameter("fromInstant", fromInstant)
                .setParameter("toInstant", toInstant)
                .getResultList();

        if (!overrideRows.isEmpty()) {
            dto.setOverrideCount(((Number) overrideRows.get(0)).longValue());
        }

        return dto;
    }

    /**
     * Get audit log entries for a date range, optionally filtered by entity type.
     */
    @Transactional(readOnly = true)
    public List<AuditLogDto> getAuditLogs(LocalDate from, LocalDate to, String entityType) {
        Instant fromInstant = from.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant toInstant = to.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        List<AuditLog> logs;
        if (entityType != null && !entityType.isBlank()) {
            logs = auditLogRepository.findByDateRangeAndEntityType(fromInstant, toInstant, entityType);
        } else {
            logs = auditLogRepository.findByDateRange(fromInstant, toInstant);
        }

        List<AuditLogDto> result = new ArrayList<>();
        for (AuditLog log : logs) {
            AuditLogDto dto = new AuditLogDto();
            dto.setId(log.getId());
            dto.setActorUserId(log.getActorUser() != null ? log.getActorUser().getId() : null);
            dto.setActorName(log.getActorUser() != null ? log.getActorUser().getFullName() : null);
            dto.setAction(log.getAction());
            dto.setEntityType(log.getEntityType());
            dto.setEntityId(log.getEntityId());
            dto.setMetaJson(log.getMetaJson());
            dto.setCreatedAt(log.getCreatedAt());
            result.add(dto);
        }

        return result;
    }
}

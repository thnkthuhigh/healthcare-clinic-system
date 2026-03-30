package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.AuditLogDto;
import com.clinic.backend.modules.admin.dto.DailyInvoiceDto;
import com.clinic.backend.modules.admin.dto.FinanceLedgerDto;
import com.clinic.backend.modules.admin.dto.FinanceSummaryDto;
import com.clinic.backend.modules.admin.dto.DoctorVisitStatsDto;
import com.clinic.backend.modules.admin.dto.ManualFinanceEntryRequest;
import com.clinic.backend.modules.admin.dto.ReportSummaryDto;
import com.clinic.backend.modules.admin.entity.AuditLog;
import com.clinic.backend.modules.admin.repository.AuditLogRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class ReportService {
    private static final ZoneId CLINIC_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @PersistenceContext
    private EntityManager em;

    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;

    public ReportService(AuditLogRepository auditLogRepository,
                         AuditLogService auditLogService) {
        this.auditLogRepository = auditLogRepository;
        this.auditLogService = auditLogService;
    }

    /**
     * Get report summary for a date range — consultation stats, revenue, channel breakdown, override count.
     */
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public ReportSummaryDto getSummary(LocalDate from, LocalDate to) {
        Instant fromInstant = from.atStartOfDay(CLINIC_ZONE).toInstant();
        Instant toInstant = to.plusDays(1).atStartOfDay(CLINIC_ZONE).toInstant();

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
                  COALESCE(SUM(COALESCE(sv.price_cents, 0) + COALESCE(b.lab_fee_cents, 0)), 0) AS service_revenue,
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

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<FinanceLedgerDto> getFinanceLedger(LocalDate from, LocalDate to, String category, String type) {
        StringBuilder sql = new StringBuilder("""
                SELECT fl.id, fl.entry_date, CAST(fl.entry_type AS text), CAST(fl.category AS text),
                       CAST(fl.ref_type AS text), fl.ref_id, fl.description, fl.qty, fl.unit, fl.amount_cents,
                       fl.actor_user_id, u.full_name, fl.created_at
                FROM finance_ledger fl
                LEFT JOIN users u ON u.id = fl.actor_user_id
                WHERE fl.entry_date >= :fromDate AND fl.entry_date <= :toDate
                """);

        if (category != null && !category.isBlank()) {
            sql.append(" AND fl.category = :category ");
        }
        if (type != null && !type.isBlank()) {
            sql.append(" AND fl.entry_type = :entryType ");
        }
        sql.append(" ORDER BY fl.entry_date DESC, fl.created_at DESC ");

        var query = em.createNativeQuery(sql.toString())
            .setParameter("fromDate", from)
            .setParameter("toDate", to);

        if (category != null && !category.isBlank()) {
            query.setParameter("category", category);
        }
        if (type != null && !type.isBlank()) {
            query.setParameter("entryType", type);
        }

        List<Object[]> rows = query.getResultList();
        List<FinanceLedgerDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            FinanceLedgerDto dto = new FinanceLedgerDto();
            dto.setId((java.util.UUID) row[0]);
            if (row[1] instanceof java.sql.Date sqlDate) {
                dto.setEntryDate(sqlDate.toLocalDate());
            } else if (row[1] instanceof LocalDate localDate) {
                dto.setEntryDate(localDate);
            }
            dto.setEntryType(row[2] != null ? row[2].toString() : null);
            dto.setCategory(row[3] != null ? row[3].toString() : null);
            dto.setRefType(row[4] != null ? row[4].toString() : null);
            dto.setRefId((java.util.UUID) row[5]);
            dto.setDescription(row[6] != null ? row[6].toString() : null);
            dto.setQty((BigDecimal) row[7]);
            dto.setUnit(row[8] != null ? row[8].toString() : null);
            dto.setAmountCents(((Number) row[9]).longValue());
            dto.setActorUserId((java.util.UUID) row[10]);
            dto.setActorName(row[11] != null ? row[11].toString() : null);
            dto.setCreatedAt(toInstant(row[12]));
            result.add(dto);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public FinanceSummaryDto getFinanceSummary(LocalDate from, LocalDate to) {
        Object[] row = (Object[]) em.createNativeQuery("""
                SELECT
                  COALESCE(SUM(CASE WHEN fl.entry_type = 'INCOME' THEN fl.amount_cents ELSE 0 END), 0) AS total_income,
                  COALESCE(SUM(CASE WHEN fl.entry_type = 'EXPENSE' THEN fl.amount_cents ELSE 0 END), 0) AS total_expense
                FROM finance_ledger fl
                WHERE fl.entry_date >= :fromDate AND fl.entry_date <= :toDate
                """)
            .setParameter("fromDate", from)
            .setParameter("toDate", to)
            .getSingleResult();

        long income = ((Number) row[0]).longValue();
        long expense = ((Number) row[1]).longValue();

        FinanceSummaryDto dto = new FinanceSummaryDto();
        dto.setTotalIncomeCents(income);
        dto.setTotalExpenseCents(expense);
        dto.setBalanceCents(income - expense);
        return dto;
    }

    @Transactional
    public FinanceLedgerDto createManualFinanceEntry(ManualFinanceEntryRequest request) {
        String flowType = normalizeRequired(request.getFlowType(), "flowType là bắt buộc").toUpperCase(Locale.ROOT);
        String description = normalizeRequired(request.getDescription(), "description là bắt buộc");
        long amountCents = request.getAmountCents() == null ? 0L : request.getAmountCents();
        if (amountCents <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amountCents phải > 0");
        }

        LocalDate entryDate = request.getEntryDate() != null ? request.getEntryDate() : LocalDate.now(CLINIC_ZONE);
        BigDecimal qty = request.getQty();
        String unit = normalizeNullable(request.getUnit());

        String entryType;
        String category;
        switch (flowType) {
            case "CHI" -> {
                entryType = "EXPENSE";
                category = "MANUAL_EXPENSE";
            }
            case "THU" -> {
                entryType = "INCOME";
                category = "MANUAL_INCOME";
            }
            case "NHAP" -> {
                entryType = "EXPENSE";
                category = "MANUAL_STOCK_IN";
            }
            case "XUAT" -> {
                entryType = "EXPENSE";
                category = "MANUAL_STOCK_OUT";
            }
            default -> throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "flowType phải là THU | CHI | NHAP | XUAT (Nhập / Xuất kho)"
                );
        }

        UUID entryId = UUID.randomUUID();
        UUID actorUserId = auditLogService.getCurrentActorUserIdOrNull();

        em.createNativeQuery("""
                INSERT INTO finance_ledger (
                    id, entry_date, entry_type, category, ref_type, ref_id,
                    description, qty, unit, amount_cents, actor_user_id, created_at
                ) VALUES (
                    :id, :entryDate, :entryType, :category, 'MANUAL', NULL,
                    :description, :qty, :unit, :amountCents, :actorUserId, now()
                )
                """)
            .setParameter("id", entryId)
            .setParameter("entryDate", entryDate)
            .setParameter("entryType", entryType)
            .setParameter("category", category)
            .setParameter("description", description)
            .setParameter("qty", qty)
            .setParameter("unit", unit)
            .setParameter("amountCents", amountCents)
            .setParameter("actorUserId", actorUserId)
            .executeUpdate();

        String actorName = null;
        if (actorUserId != null) {
            @SuppressWarnings("unchecked")
            List<Object> actorRows = em.createNativeQuery("SELECT full_name FROM users WHERE id = :id")
                .setParameter("id", actorUserId)
                .getResultList();
            if (!actorRows.isEmpty() && actorRows.get(0) != null) {
                actorName = actorRows.get(0).toString();
            }
        }

        auditLogService.log(
            "MANUAL_FINANCE_ENTRY",
            "FINANCE_LEDGER",
            entryId,
            Map.of(
                "flowType", flowType,
                "description", description,
                "amountCents", amountCents
            )
        );

        FinanceLedgerDto dto = new FinanceLedgerDto();
        dto.setId(entryId);
        dto.setEntryDate(entryDate);
        dto.setEntryType(entryType);
        dto.setCategory(category);
        dto.setRefType("MANUAL");
        dto.setRefId(null);
        dto.setDescription(description);
        dto.setQty(qty);
        dto.setUnit(unit);
        dto.setAmountCents(amountCents);
        dto.setActorUserId(actorUserId);
        dto.setActorName(actorName);
        dto.setCreatedAt(Instant.now());
        return dto;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<DailyInvoiceDto> getDailyInvoices(LocalDate date) {
        List<Object[]> rows = em.createNativeQuery("""
                SELECT
                  b.id,
                  b.queue_number,
                  p.full_name,
                  p.phone,
                  d.display_name,
                  sv.name,
                  COALESCE(r.name, 'Chưa gán phòng'),
                  CAST(s.type AS text),
                  CAST(b.channel AS text),
                  CAST(b.status AS text),
                  CAST(b.payment_status AS text),
                  COALESCE(b.completed_at, b.check_in_at, b.created_at) AS invoice_at,
                  COALESCE(sv.price_cents, 0) AS service_amount,
                  COALESCE(b.lab_fee_cents, 0) AS lab_amount,
                                    COALESCE((
                                        SELECT CAST(SUM(pi.qty * pi.unit_price_cents) AS BIGINT)
                    FROM prescriptions pr
                    JOIN prescription_items pi ON pi.prescription_id = pr.id
                    WHERE pr.booking_id = b.id
                      AND pr.status = 'PAID'
                  ), 0) AS medication_amount
                FROM bookings b
                JOIN shifts s ON s.id = b.shift_id
                JOIN doctors d ON d.id = s.doctor_id
                JOIN patients p ON p.id = b.patient_id
                LEFT JOIN services sv ON sv.id = b.service_id
                LEFT JOIN rooms r ON r.id = s.room_id
                WHERE s.date = :date
                  AND b.payment_status = 'PAID'
                ORDER BY COALESCE(b.completed_at, b.check_in_at, b.created_at) DESC NULLS LAST, b.created_at DESC
                """)
            .setParameter("date", date)
            .getResultList();

        List<DailyInvoiceDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            DailyInvoiceDto dto = new DailyInvoiceDto();
            dto.setBookingId((java.util.UUID) row[0]);
            dto.setQueueNumber(row[1] != null ? ((Number) row[1]).intValue() : null);
            dto.setPatientName(row[2] != null ? row[2].toString() : null);
            dto.setPatientPhone(row[3] != null ? row[3].toString() : null);
            dto.setDoctorName(row[4] != null ? row[4].toString() : null);
            dto.setServiceName(row[5] != null ? row[5].toString() : null);
            dto.setRoomName(row[6] != null ? row[6].toString() : null);
            dto.setShiftType(row[7] != null ? row[7].toString() : null);
            dto.setChannel(row[8] != null ? row[8].toString() : null);
            dto.setStatus(row[9] != null ? row[9].toString() : null);
            dto.setPaymentStatus(row[10] != null ? row[10].toString() : null);
            dto.setInvoiceAt(toInstant(row[11]));

            long serviceAmount = row[12] != null ? ((Number) row[12]).longValue() : 0L;
            long labAmount = row[13] != null ? ((Number) row[13]).longValue() : 0L;
            long medicationAmount = row[14] != null ? ((Number) row[14]).longValue() : 0L;
            dto.setServiceAmountCents(serviceAmount);
            dto.setLabAmountCents(labAmount);
            dto.setMedicationAmountCents(medicationAmount);
            dto.setTotalAmountCents(serviceAmount + labAmount + medicationAmount);
            result.add(dto);
        }
        return result;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<DoctorVisitStatsDto> getVisitsByDoctor(LocalDate from, LocalDate to) {
        List<Object[]> rows = em.createNativeQuery("""
                SELECT
                  d.id,
                  d.display_name,
                  d.specialty,
                  COUNT(*) FILTER (
                    WHERE b.id IS NOT NULL
                      AND s.type = 'MORNING'
                      AND b.status NOT IN ('CANCELED', 'NO_SHOW')
                  ) AS morning_visits,
                  COUNT(*) FILTER (
                    WHERE b.id IS NOT NULL
                      AND s.type = 'AFTERNOON'
                      AND b.status NOT IN ('CANCELED', 'NO_SHOW')
                  ) AS afternoon_visits,
                  COUNT(*) FILTER (
                    WHERE b.id IS NOT NULL
                      AND b.status NOT IN ('CANCELED', 'NO_SHOW')
                  ) AS total_visits
                FROM doctors d
                LEFT JOIN shifts s
                  ON s.doctor_id = d.id
                 AND s.date >= :fromDate
                 AND s.date <= :toDate
                LEFT JOIN bookings b ON b.shift_id = s.id
                GROUP BY d.id, d.display_name, d.specialty
                HAVING COUNT(*) FILTER (WHERE b.id IS NOT NULL) > 0
                ORDER BY total_visits DESC, d.display_name ASC
                """)
            .setParameter("fromDate", from)
            .setParameter("toDate", to)
            .getResultList();

        List<DoctorVisitStatsDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            DoctorVisitStatsDto dto = new DoctorVisitStatsDto();
            dto.setDoctorId((java.util.UUID) row[0]);
            dto.setDoctorName(row[1] != null ? row[1].toString() : null);
            dto.setSpecialty(row[2] != null ? row[2].toString() : null);
            dto.setMorningVisits(row[3] != null ? ((Number) row[3]).longValue() : 0L);
            dto.setAfternoonVisits(row[4] != null ? ((Number) row[4]).longValue() : 0L);
            dto.setTotalVisits(row[5] != null ? ((Number) row[5]).longValue() : 0L);
            result.add(dto);
        }
        return result;
    }

    /**
     * Get audit log entries for a date range, optionally filtered by entity type.
     */
    @Transactional(readOnly = true)
    public List<AuditLogDto> getAuditLogs(LocalDate from, LocalDate to, String entityType, String action) {
        Instant fromInstant = from.atStartOfDay(CLINIC_ZONE).toInstant();
        Instant toInstant = to.plusDays(1).atStartOfDay(CLINIC_ZONE).toInstant();

        String normalizedEntityType = normalizeNullable(entityType);
        String normalizedAction = normalizeNullable(action);

        List<AuditLog> logs = (normalizedEntityType == null && normalizedAction == null)
            ? auditLogRepository.findByDateRange(fromInstant, toInstant)
            : auditLogRepository.findByDateRangeAndFilters(fromInstant, toInstant, normalizedEntityType, normalizedAction);

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

    private String normalizeRequired(String value, String message) {
        String normalized = normalizeNullable(value);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return normalized;
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private Instant toInstant(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Instant instant) {
            return instant;
        }
        if (value instanceof java.sql.Timestamp timestamp) {
            return timestamp.toInstant();
        }
        if (value instanceof java.time.OffsetDateTime offsetDateTime) {
            return offsetDateTime.toInstant();
        }
        if (value instanceof java.util.Date date) {
            return date.toInstant();
        }
        return null;
    }
}

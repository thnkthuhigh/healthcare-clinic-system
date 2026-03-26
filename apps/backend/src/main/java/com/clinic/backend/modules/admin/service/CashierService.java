package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.CashierBookingDto;
import com.clinic.backend.modules.admin.dto.RetailSaleRequest;
import com.clinic.backend.modules.admin.dto.RetailSaleResponse;
import com.clinic.backend.modules.doctor.entity.Booking;
import com.clinic.backend.modules.doctor.entity.Medication;
import com.clinic.backend.modules.doctor.entity.Prescription;
import com.clinic.backend.modules.doctor.entity.PrescriptionItem;
import com.clinic.backend.modules.doctor.repository.BookingRepository;
import com.clinic.backend.modules.doctor.repository.MedicationRepository;
import com.clinic.backend.modules.doctor.repository.PrescriptionRepository;
import com.clinic.backend.modules.doctor.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CashierService {
    private static final ZoneId CLINIC_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @PersistenceContext
    private EntityManager em;

    private final BookingRepository bookingRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationRepository medicationRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public CashierService(BookingRepository bookingRepository,
                          PrescriptionRepository prescriptionRepository,
                          MedicationRepository medicationRepository,
                          UserRepository userRepository,
                          AuditLogService auditLogService) {
        this.bookingRepository = bookingRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.medicationRepository = medicationRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<CashierBookingDto> getCompletedBookings(LocalDate date) {
        Instant dayStart = date.atStartOfDay(CLINIC_ZONE).toInstant();
        Instant dayEnd = date.plusDays(1).atStartOfDay(CLINIC_ZONE).toInstant();

        List<Object[]> rows = em.createNativeQuery("""
                SELECT b.id, b.queue_number, p.full_name, p.phone,
                       u.full_name AS doctor_name,
                       sv.name AS service_name, sv.price_cents AS service_price, COALESCE(b.lab_fee_cents, 0) AS lab_fee,
                       b.status, b.channel, b.payment_status, b.completed_at,
                       b.payment_method, b.paid_at, b.paid_by_user_id, COALESCE(cashier.full_name, cashier.phone) AS billed_by_name,
                       pr.id AS prescription_id, pr.status AS prescription_status
                FROM bookings b
                JOIN patients p ON p.id = b.patient_id
                JOIN shifts s ON s.id = b.shift_id
                JOIN doctors d ON d.id = s.doctor_id
                JOIN users u ON u.id = d.user_id
                LEFT JOIN users cashier ON cashier.id = b.paid_by_user_id
                LEFT JOIN services sv ON sv.id = b.service_id
                LEFT JOIN prescriptions pr ON pr.booking_id = b.id
                WHERE b.status = 'COMPLETED'
                AND COALESCE(b.completed_at, b.created_at) >= :dayStart
                AND COALESCE(b.completed_at, b.created_at) < :dayEnd
                ORDER BY b.completed_at DESC
                """)
            .setParameter("dayStart", dayStart)
            .setParameter("dayEnd", dayEnd)
            .getResultList();

        List<CashierBookingDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            CashierBookingDto dto = new CashierBookingDto();
            dto.setBookingId((UUID) row[0]);
            dto.setQueueNumber((Integer) row[1]);
            dto.setPatientName((String) row[2]);
            dto.setPatientPhone((String) row[3]);
            dto.setDoctorName((String) row[4]);
            dto.setServiceName((String) row[5]);
            dto.setServicePriceCents(row[6] != null ? ((Number) row[6]).intValue() : 0);
            dto.setLabFeeCents(row[7] != null ? ((Number) row[7]).intValue() : 0);
            dto.setStatus((String) row[8]);
            dto.setChannel((String) row[9]);
            dto.setPaymentStatus((String) row[10]);
            dto.setCompletedAt(toInstant(row[11]));
            dto.setPaymentMethod(row[12] != null ? row[12].toString() : null);
            dto.setPaidAt(toInstant(row[13]));
            dto.setBilledByUserId((UUID) row[14]);
            dto.setBilledByName(row[15] != null ? row[15].toString() : null);

            UUID prescriptionId = (UUID) row[16];
            String prescriptionStatus = (String) row[17];
            dto.setPrescriptionId(prescriptionId);
            dto.setPrescriptionStatus(prescriptionStatus);

            if (prescriptionId != null) {
                var prescription = prescriptionRepository.findByBookingIdWithItems(dto.getBookingId());
                if (prescription.isPresent()) {
                    var items = prescription.get().getItems().stream().map(item -> {
                        var itemDto = new CashierBookingDto.PrescriptionItemDto();
                        itemDto.setId(item.getId());
                        itemDto.setMedicationName(item.getMedication().getName());
                        itemDto.setUnit(item.getMedication().getUnit());
                        itemDto.setQty(item.getQty());
                        itemDto.setDosage(item.getDosage());
                        itemDto.setNote(item.getNote());
                        itemDto.setUnitPriceCents(item.getUnitPriceCents());
                        itemDto.setTotalCents(item.getTotalCents());
                        return itemDto;
                    }).toList();
                    dto.setPrescriptionItems(items);
                    dto.setPrescriptionTotalCents(prescription.get().getTotalCents());
                }
            }

            int total = dto.getServicePriceCents() != null ? dto.getServicePriceCents() : 0;
            if (dto.getLabFeeCents() != null) {
                total += dto.getLabFeeCents();
            }
            if (dto.getPrescriptionTotalCents() != null) {
                total += dto.getPrescriptionTotalCents();
            }
            dto.setTotalBillCents(total);

            result.add(dto);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public CashierBookingDto getBookingForPayment(UUID bookingId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch khám"));

        CashierBookingDto dto = new CashierBookingDto();
        dto.setBookingId(booking.getId());
        dto.setQueueNumber(booking.getQueueNumber());
        dto.setPatientName(booking.getPatient().getFullName());
        dto.setPatientPhone(booking.getPatient().getPhone());
        dto.setDoctorName(booking.getShift().getDoctor().getUser().getFullName());
        dto.setServiceName(booking.getService() != null ? booking.getService().getName() : null);
        dto.setServicePriceCents(booking.getService() != null ? booking.getService().getPriceCents() : 0);
        dto.setLabFeeCents(booking.getLabFeeCents() != null ? booking.getLabFeeCents() : 0);
        dto.setStatus(booking.getStatus().name());
        dto.setChannel(booking.getChannel().name());
        dto.setPaymentStatus(booking.getPaymentStatus().name());
        dto.setCompletedAt(booking.getCompletedAt());
        dto.setPaymentMethod(booking.getPaymentMethod() != null ? booking.getPaymentMethod().name() : null);
        dto.setPaidAt(booking.getPaidAt());
        dto.setBilledByUserId(booking.getPaidByUserId());
        dto.setBilledByName(getUserFullNameById(booking.getPaidByUserId()));

        prescriptionRepository.findByBookingIdWithItems(bookingId).ifPresent(prescription -> {
            dto.setPrescriptionId(prescription.getId());
            dto.setPrescriptionStatus(prescription.getStatus().name());
            var items = prescription.getItems().stream().map(item -> {
                var itemDto = new CashierBookingDto.PrescriptionItemDto();
                itemDto.setId(item.getId());
                itemDto.setMedicationName(item.getMedication().getName());
                itemDto.setUnit(item.getMedication().getUnit());
                itemDto.setQty(item.getQty());
                itemDto.setDosage(item.getDosage());
                itemDto.setNote(item.getNote());
                itemDto.setUnitPriceCents(item.getUnitPriceCents());
                itemDto.setTotalCents(item.getTotalCents());
                return itemDto;
            }).toList();
            dto.setPrescriptionItems(items);
            dto.setPrescriptionTotalCents(prescription.getTotalCents());
        });

        int total = dto.getServicePriceCents() != null ? dto.getServicePriceCents() : 0;
        if (dto.getLabFeeCents() != null) {
            total += dto.getLabFeeCents();
        }
        if (dto.getPrescriptionTotalCents() != null) {
            total += dto.getPrescriptionTotalCents();
        }
        dto.setTotalBillCents(total);

        return dto;
    }

    @Transactional
    public CashierBookingDto processPayment(UUID bookingId, String paymentMethodRaw) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch khám"));

        if (booking.getStatus() != Booking.BookingStatus.COMPLETED) {
            throw new IllegalStateException("Chỉ thanh toán được lịch khám đã COMPLETED");
        }
        if (booking.getPaymentStatus() == Booking.PaymentStatus.PAID) {
            throw new IllegalStateException("Lịch khám đã được thanh toán");
        }

        Booking.PaymentMethod paymentMethod = resolvePaymentMethod(paymentMethodRaw);
        UUID actorUserId = getCurrentActorUserIdOrNull();
        Instant paidAt = Instant.now();

        booking.setPaymentStatus(Booking.PaymentStatus.PAID);
        booking.setPaymentMethod(paymentMethod);
        booking.setPaidAt(paidAt);
        booking.setPaidByUserId(actorUserId);
        bookingRepository.save(booking);

        prescriptionRepository.findByBookingIdWithItems(bookingId).ifPresent(prescription -> {
            prescription.setStatus(Prescription.PrescriptionStatus.PAID);
            prescriptionRepository.save(prescription);

            for (PrescriptionItem item : prescription.getItems()) {
                int updated = medicationRepository.confirmDeduction(item.getMedication().getId(), item.getQty());
                if (updated == 0) {
                    throw new IllegalStateException("Không đủ tồn kho cho thuốc: " + item.getMedication().getName());
                }
            }
        });

        populateFinanceActorForBooking(bookingId, actorUserId);

        var auditMeta = new LinkedHashMap<String, Object>();
        auditMeta.put("paymentMethod", paymentMethod.name());
        auditMeta.put("paidAt", paidAt.toString());
        auditLogService.log("PROCESS_BOOKING_PAYMENT", "BOOKING", bookingId, auditMeta);

        return getBookingForPayment(bookingId);
    }

    @Transactional
    public CashierBookingDto removePrescriptionItem(UUID bookingId, UUID itemId) {
        Prescription prescription = prescriptionRepository.findByBookingIdWithItems(bookingId)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn thuốc"));

        if (prescription.getStatus() != Prescription.PrescriptionStatus.HELD) {
            throw new IllegalStateException("Chỉ sửa được đơn thuốc HELD");
        }

        PrescriptionItem target = prescription.getItems().stream()
            .filter(item -> item.getId().equals(itemId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thuốc trong đơn"));

        medicationRepository.releaseHold(target.getMedication().getId(), target.getQty());
        prescription.removeItem(target);
        prescriptionRepository.save(prescription);

        auditLogService.log(
            "REMOVE_PRESCRIPTION_ITEM",
            "PRESCRIPTION",
            prescription.getId(),
            Map.of(
                "medicationName", target.getMedication().getName(),
                "qty", target.getQty()
            )
        );

        return getBookingForPayment(bookingId);
    }

    @Transactional
    public RetailSaleResponse retailSale(RetailSaleRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danh sách thuốc không được rỗng");
        }

        Map<UUID, Integer> qtyByMedication = new LinkedHashMap<>();
        for (RetailSaleRequest.RetailSaleItemRequest item : request.getItems()) {
            if (item.getMedicationId() == null || item.getQty() == null || item.getQty() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu thuốc bán lẻ không hợp lệ");
            }
            qtyByMedication.merge(item.getMedicationId(), item.getQty(), Integer::sum);
        }

        UUID actorUserId = getCurrentActorUserIdOrNull();
        String billedByName = getUserFullNameById(actorUserId);
        String invoiceCode = "RTL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Instant now = Instant.now();

        long total = 0;
        List<RetailSaleResponse.RetailSaleItemDto> items = new ArrayList<>();

        for (Map.Entry<UUID, Integer> entry : qtyByMedication.entrySet()) {
            UUID medicationId = entry.getKey();
            int qty = entry.getValue();

            Medication medication = medicationRepository.findById(medicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy thuốc"));

            if (!Boolean.TRUE.equals(medication.getIsActive())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thuốc đang tạm ngưng bán: " + medication.getName());
            }

            int updated = medicationRepository.deductForRetail(medicationId, qty);
            if (updated == 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Không đủ tồn kho cho thuốc: " + medication.getName());
            }

            int lineTotal = medication.getPriceCents() * qty;
            total += lineTotal;

            em.createNativeQuery("""
                    INSERT INTO finance_ledger (
                        id, entry_date, entry_type, category, ref_type, ref_id,
                        description, qty, unit, amount_cents, actor_user_id, created_at
                    ) VALUES (
                        gen_random_uuid(), CURRENT_DATE, 'INCOME', 'MEDICATION_SALE', 'MEDICATION', :refId,
                        :description, :qty, :unit, :amount, :actorUserId, now()
                    )
                    """)
                .setParameter("refId", medicationId)
                .setParameter("description", "Bán lẻ thuốc: " + medication.getName())
                .setParameter("qty", qty)
                .setParameter("unit", medication.getUnit())
                .setParameter("amount", lineTotal)
                .setParameter("actorUserId", actorUserId)
                .executeUpdate();

            RetailSaleResponse.RetailSaleItemDto itemDto = new RetailSaleResponse.RetailSaleItemDto();
            itemDto.setMedicationId(medicationId);
            itemDto.setMedicationName(medication.getName());
            itemDto.setUnit(medication.getUnit());
            itemDto.setQty(qty);
            itemDto.setUnitPriceCents(medication.getPriceCents());
            itemDto.setLineTotalCents(lineTotal);
            items.add(itemDto);
        }

        RetailSaleResponse response = new RetailSaleResponse();
        response.setInvoiceCode(invoiceCode);
        response.setCustomerName(normalizeOptional(request.getCustomerName()));
        response.setCustomerPhone(normalizeOptional(request.getCustomerPhone()));
        response.setTotalCents(total);
        response.setCreatedAt(now);
        response.setBilledByUserId(actorUserId);
        response.setBilledByName(billedByName);
        response.setItems(items);
        return response;
    }

    @Transactional
    public int expireOldPrescriptions() {
        Instant cutoff = Instant.now().minusSeconds(2L * 60 * 60);

        List<Prescription> expired = em.createQuery("""
                SELECT p FROM Prescription p
                JOIN FETCH p.items i
                JOIN FETCH i.medication
                JOIN p.booking b
                WHERE p.status = com.clinic.backend.modules.doctor.entity.Prescription$PrescriptionStatus.HELD
                AND b.completedAt < :cutoff
                """, Prescription.class)
            .setParameter("cutoff", cutoff)
            .getResultList();

        for (Prescription p : expired) {
            p.setStatus(Prescription.PrescriptionStatus.EXPIRED);
            for (PrescriptionItem item : p.getItems()) {
                medicationRepository.releaseHold(item.getMedication().getId(), item.getQty());
            }
            prescriptionRepository.save(p);
        }

        return expired.size();
    }

    private UUID getCurrentActorUserIdOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UUID uuid) {
            return uuid;
        }
        if (principal instanceof String raw) {
            try {
                return UUID.fromString(raw);
            } catch (IllegalArgumentException ignored) {
                return null;
            }
        }
        return null;
    }

    private String getUserFullNameById(UUID userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId)
            .map(user -> {
                if (user.getFullName() != null && !user.getFullName().isBlank()) {
                    return user.getFullName();
                }
                return user.getPhone();
            })
            .orElse(null);
    }

    private Booking.PaymentMethod resolvePaymentMethod(String rawMethod) {
        if (rawMethod == null || rawMethod.isBlank()) {
            return Booking.PaymentMethod.CASH;
        }
        try {
            return Booking.PaymentMethod.valueOf(rawMethod.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phương thức thanh toán không hợp lệ");
        }
    }

    private void populateFinanceActorForBooking(UUID bookingId, UUID actorUserId) {
        if (actorUserId == null) {
            return;
        }

        em.createNativeQuery("""
                UPDATE finance_ledger
                SET actor_user_id = :actorUserId
                WHERE actor_user_id IS NULL
                  AND ref_type = 'BOOKING'
                  AND ref_id = :bookingId
                  AND entry_type = 'INCOME'
                  AND category = 'CONSULTATION_FEE'
                """)
            .setParameter("actorUserId", actorUserId)
            .setParameter("bookingId", bookingId)
            .executeUpdate();

        em.createNativeQuery("""
                UPDATE finance_ledger
                SET actor_user_id = :actorUserId
                WHERE actor_user_id IS NULL
                  AND ref_type = 'BOOKING'
                  AND ref_id = :bookingId
                  AND entry_type = 'INCOME'
                  AND category = 'LAB_FEE'
                """)
            .setParameter("actorUserId", actorUserId)
            .setParameter("bookingId", bookingId)
            .executeUpdate();

        em.createNativeQuery("""
                UPDATE finance_ledger fl
                SET actor_user_id = :actorUserId
                WHERE fl.actor_user_id IS NULL
                  AND fl.ref_type = 'PRESCRIPTION_ITEM'
                  AND fl.entry_type = 'INCOME'
                  AND fl.category = 'MEDICATION_SALE'
                  AND EXISTS (
                    SELECT 1
                    FROM prescription_items pi
                    JOIN prescriptions pr ON pr.id = pi.prescription_id
                    WHERE pr.booking_id = :bookingId
                      AND pi.id = fl.ref_id
                  )
                """)
            .setParameter("actorUserId", actorUserId)
            .setParameter("bookingId", bookingId)
            .executeUpdate();
    }

    private String normalizeOptional(String value) {
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

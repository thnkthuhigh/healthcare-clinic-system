package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.CashierBookingDto;
import com.clinic.backend.modules.doctor.entity.Booking;
import com.clinic.backend.modules.doctor.entity.Prescription;
import com.clinic.backend.modules.doctor.entity.PrescriptionItem;
import com.clinic.backend.modules.doctor.repository.BookingRepository;
import com.clinic.backend.modules.doctor.repository.MedicationRepository;
import com.clinic.backend.modules.doctor.repository.PrescriptionRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CashierService {

    @PersistenceContext
    private EntityManager em;

    private final BookingRepository bookingRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationRepository medicationRepository;

    public CashierService(BookingRepository bookingRepository,
                          PrescriptionRepository prescriptionRepository,
                          MedicationRepository medicationRepository) {
        this.bookingRepository = bookingRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.medicationRepository = medicationRepository;
    }

    /**
     * Get COMPLETED + UNPAID bookings for cashier queue.
     */
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<CashierBookingDto> getCompletedBookings(LocalDate date) {
        Instant dayStart = date.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant dayEnd = date.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        List<Object[]> rows = em.createNativeQuery("""
                SELECT b.id, b.queue_number, p.full_name, p.phone,
                       u.full_name AS doctor_name,
                       sv.name AS service_name, sv.price_cents AS service_price,
                       b.status, b.channel, b.payment_status, b.completed_at,
                       pr.id AS prescription_id, pr.status AS prescription_status
                FROM bookings b
                JOIN patients p ON p.id = b.patient_id
                JOIN shifts s ON s.id = b.shift_id
                JOIN doctors d ON d.id = s.doctor_id
                JOIN users u ON u.id = d.user_id
                LEFT JOIN services sv ON sv.id = b.service_id
                LEFT JOIN prescriptions pr ON pr.booking_id = b.id
                WHERE b.status = 'COMPLETED'
                AND b.created_at >= :dayStart AND b.created_at < :dayEnd
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
            dto.setServicePriceCents(row[6] != null ? (Integer) row[6] : 0);
            dto.setStatus((String) row[7]);
            dto.setChannel((String) row[8]);
            dto.setPaymentStatus((String) row[9]);
            dto.setCompletedAt(row[10] != null ? ((java.sql.Timestamp) row[10]).toInstant() : null);

            UUID prescriptionId = (UUID) row[11];
            String prescriptionStatus = (String) row[12];
            dto.setPrescriptionId(prescriptionId);
            dto.setPrescriptionStatus(prescriptionStatus);

            // Load prescription items if prescription exists
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

            // Calculate total bill: service + prescription
            int total = dto.getServicePriceCents() != null ? dto.getServicePriceCents() : 0;
            if (dto.getPrescriptionTotalCents() != null) {
                total += dto.getPrescriptionTotalCents();
            }
            dto.setTotalBillCents(total);

            result.add(dto);
        }
        return result;
    }

    /**
     * Get a single booking detail for payment view.
     */
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
        dto.setStatus(booking.getStatus().name());
        dto.setChannel(booking.getChannel().name());
        dto.setPaymentStatus(booking.getPaymentStatus().name());
        dto.setCompletedAt(booking.getCompletedAt());

        // Load prescription
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

        // Total bill
        int total = dto.getServicePriceCents() != null ? dto.getServicePriceCents() : 0;
        if (dto.getPrescriptionTotalCents() != null) {
            total += dto.getPrescriptionTotalCents();
        }
        dto.setTotalBillCents(total);

        return dto;
    }

    /**
     * Process payment — Logic C Step 2.
     * 1. Set booking.paymentStatus = PAID
     * 2. Set prescription.status = PAID
     * 3. confirmDeduction for each item (stockReal -= qty, stockHold -= qty)
     */
    @Transactional
    public CashierBookingDto processPayment(UUID bookingId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch khám"));

        if (booking.getStatus() != Booking.BookingStatus.COMPLETED) {
            throw new IllegalStateException("Chỉ thanh toán được lịch khám đã hoàn thành (COMPLETED)");
        }
        if (booking.getPaymentStatus() == Booking.PaymentStatus.PAID) {
            throw new IllegalStateException("Lịch khám đã được thanh toán");
        }

        // 1. Update booking payment status
        booking.setPaymentStatus(Booking.PaymentStatus.PAID);
        bookingRepository.save(booking);

        // 2. Update prescription status and commit stock
        prescriptionRepository.findByBookingIdWithItems(bookingId).ifPresent(prescription -> {
            prescription.setStatus(Prescription.PrescriptionStatus.PAID);
            prescriptionRepository.save(prescription);

            // 3. Logic C Step 2: confirm stock deduction for each item
            for (PrescriptionItem item : prescription.getItems()) {
                int updated = medicationRepository.confirmDeduction(
                        item.getMedication().getId(), item.getQty());
                if (updated == 0) {
                    throw new IllegalStateException(
                            "Không đủ tồn kho cho thuốc: " + item.getMedication().getName());
                }
            }
        });

        return getBookingForPayment(bookingId);
    }

    /**
     * Remove a prescription item before payment (cashier can remove items if patient can't afford all).
     * Releases held stock for that item.
     */
    @Transactional
    public CashierBookingDto removePrescriptionItem(UUID bookingId, UUID itemId) {
        Prescription prescription = prescriptionRepository.findByBookingIdWithItems(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn thuốc"));

        if (prescription.getStatus() != Prescription.PrescriptionStatus.HELD) {
            throw new IllegalStateException("Chỉ chỉnh sửa được đơn thuốc đang tạm giữ (HELD)");
        }

        PrescriptionItem target = prescription.getItems().stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thuốc trong đơn"));

        // Release held stock
        medicationRepository.releaseHold(target.getMedication().getId(), target.getQty());

        // Remove item
        prescription.removeItem(target);
        prescriptionRepository.save(prescription);

        return getBookingForPayment(bookingId);
    }

    /**
     * Cancel/expire unpaid prescriptions that are older than 2 hours.
     * Background job should call this periodically.
     */
    @Transactional
    public int expireOldPrescriptions() {
        Instant cutoff = Instant.now().minusSeconds(2 * 60 * 60); // 2 hours

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
}

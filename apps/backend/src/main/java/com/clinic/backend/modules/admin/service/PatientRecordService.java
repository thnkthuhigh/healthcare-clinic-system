package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.PatientRecordDto;
import com.clinic.backend.modules.doctor.entity.Patient;
import com.clinic.backend.modules.doctor.repository.PatientRepository;
import com.clinic.backend.modules.doctor.repository.PrescriptionRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class PatientRecordService {

    @PersistenceContext
    private EntityManager em;

    private final PatientRepository patientRepository;
    private final PrescriptionRepository prescriptionRepository;

    public PatientRecordService(PatientRepository patientRepository,
                                PrescriptionRepository prescriptionRepository) {
        this.patientRepository = patientRepository;
        this.prescriptionRepository = prescriptionRepository;
    }

    /**
     * Get patient records by patient ID — includes patient info + all medical records with prescriptions.
     */
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public PatientRecordDto getPatientRecords(UUID patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bệnh nhân"));

        PatientRecordDto dto = new PatientRecordDto();
        dto.setPatientId(patient.getId());
        dto.setFullName(patient.getFullName());
        dto.setPhone(patient.getPhone());
        dto.setNationalId(patient.getNationalId());
        dto.setDateOfBirth(patient.getDateOfBirth() != null ? patient.getDateOfBirth().toString() : null);
        dto.setGender(patient.getGender());
        dto.setAllergies(patient.getAllergies());
        dto.setAddress(patient.getAddress());

        // Get medical records with booking + doctor info
        List<Object[]> rows = em.createNativeQuery("""
                SELECT mr.id AS record_id, mr.booking_id, u.full_name AS doctor_name,
                       sv.name AS service_name, mr.symptoms, mr.diagnosis,
                       mr.conclusion, mr.notes, b.status AS booking_status,
                       b.payment_status, mr.created_at
                FROM medical_records mr
                JOIN bookings b ON b.id = mr.booking_id
                JOIN shifts s ON s.id = b.shift_id
                JOIN doctors d ON d.id = s.doctor_id
                JOIN users u ON u.id = d.user_id
                LEFT JOIN services sv ON sv.id = b.service_id
                WHERE mr.patient_id = :patientId
                ORDER BY mr.created_at DESC
                """)
                .setParameter("patientId", patientId)
                .getResultList();

        List<PatientRecordDto.VisitRecordDto> records = new ArrayList<>();
        for (Object[] row : rows) {
            PatientRecordDto.VisitRecordDto visit = new PatientRecordDto.VisitRecordDto();
            visit.setRecordId((UUID) row[0]);
            visit.setBookingId((UUID) row[1]);
            visit.setDoctorName((String) row[2]);
            visit.setServiceName((String) row[3]);
            visit.setSymptoms((String) row[4]);
            visit.setDiagnosis((String) row[5]);
            visit.setConclusion((String) row[6]);
            visit.setNotes((String) row[7]);
            visit.setBookingStatus((String) row[8]);
            visit.setPaymentStatus((String) row[9]);
            visit.setVisitDate(toInstant(row[10]));

            // Load prescription for this booking
            UUID bookingId = visit.getBookingId();
            prescriptionRepository.findByBookingIdWithItems(bookingId).ifPresent(prescription -> {
                visit.setPrescriptionStatus(prescription.getStatus().name());
                var items = prescription.getItems().stream().map(item -> {
                    var itemDto = new PatientRecordDto.PrescriptionItemDto();
                    itemDto.setMedicationName(item.getMedication().getName());
                    itemDto.setUnit(item.getMedication().getUnit());
                    itemDto.setQty(item.getQty());
                    itemDto.setDosage(item.getDosage());
                    itemDto.setNote(item.getNote());
                    return itemDto;
                }).toList();
                visit.setPrescriptionItems(items);
            });

            records.add(visit);
        }

        dto.setRecords(records);
        return dto;
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
        if (value instanceof OffsetDateTime offsetDateTime) {
            return offsetDateTime.toInstant();
        }
        if (value instanceof LocalDateTime localDateTime) {
            return localDateTime.toInstant(ZoneOffset.UTC);
        }
        if (value instanceof Date date) {
            return date.toInstant();
        }
        throw new IllegalStateException("Unsupported visit date type: " + value.getClass().getName());
    }
}

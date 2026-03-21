package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.AdminDoctorDto;
import com.clinic.backend.modules.admin.dto.AdminPatientDto;
import com.clinic.backend.modules.admin.dto.CreateDoctorRequest;
import com.clinic.backend.modules.admin.dto.UpdateDoctorRequest;
import com.clinic.backend.modules.doctor.entity.Doctor;
import com.clinic.backend.modules.doctor.entity.Patient;
import com.clinic.backend.modules.doctor.entity.User;
import com.clinic.backend.modules.doctor.repository.DoctorRepository;
import com.clinic.backend.modules.doctor.repository.PatientRepository;
import com.clinic.backend.modules.doctor.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class UserManagementService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @PersistenceContext
    private EntityManager em;

    public UserManagementService(UserRepository userRepository,
                                 DoctorRepository doctorRepository,
                                 PatientRepository patientRepository,
                                 PasswordEncoder passwordEncoder,
                                 AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    // =========================================================================
    //  DOCTOR MANAGEMENT
    // =========================================================================

    @Transactional(readOnly = true)
    public List<AdminDoctorDto> getAllDoctors() {
        return doctorRepository.findAll().stream()
                .map(this::toDoctorDto)
                .toList();
    }

    @Transactional
    public AdminDoctorDto createDoctor(CreateDoctorRequest req) {
        if (userRepository.existsByPhone(req.getPhone())) {
            throw new IllegalArgumentException("So dien thoai da duoc su dung: " + req.getPhone());
        }

        Integer experienceYears = normalizeExperienceYears(req.getExperienceYears());

        User user = new User();
        user.setPhone(req.getPhone());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole(User.UserRole.DOCTOR);
        user.setFullName(req.getDisplayName());
        userRepository.save(user);

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        doctor.setDisplayName(req.getDisplayName());
        doctor.setSpecialty(normalizeNullable(req.getSpecialty()));
        doctor.setAvatarUrl(normalizeNullable(req.getAvatarUrl()));
        doctor.setBio(normalizeNullable(req.getBio()));
        doctor.setExperienceYears(experienceYears);
        doctor.setQualifications(normalizeNullable(req.getQualifications()));
        doctor.setDateOfBirth(req.getDateOfBirth());
        doctor.setNationalId(normalizeNullable(req.getNationalId()));
        doctor.setWorkHistory(normalizeNullable(req.getWorkHistory()));
        doctorRepository.saveAndFlush(doctor);

        syncDoctorServices(doctor.getId(), req.getServiceIds());

        return toDoctorDto(doctor);
    }

    @Transactional
    public AdminDoctorDto updateDoctor(UUID doctorId, UpdateDoctorRequest req) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay bac si"));

        if (req.getDisplayName() != null && !req.getDisplayName().isBlank()) {
            doctor.setDisplayName(req.getDisplayName().trim());
            doctor.getUser().setFullName(req.getDisplayName().trim());
        }
        if (req.getSpecialty() != null) {
            doctor.setSpecialty(normalizeNullable(req.getSpecialty()));
        }
        if (req.getAvatarUrl() != null) {
            doctor.setAvatarUrl(normalizeNullable(req.getAvatarUrl()));
        }
        if (req.getBio() != null) {
            doctor.setBio(normalizeNullable(req.getBio()));
        }
        if (req.getQualifications() != null) {
            doctor.setQualifications(normalizeNullable(req.getQualifications()));
        }
        if (req.getExperienceYears() != null) {
            doctor.setExperienceYears(normalizeExperienceYears(req.getExperienceYears()));
        }
        if (req.getDateOfBirth() != null) {
            doctor.setDateOfBirth(req.getDateOfBirth());
        }
        if (req.getNationalId() != null) {
            doctor.setNationalId(normalizeNullable(req.getNationalId()));
        }
        if (req.getWorkHistory() != null) {
            doctor.setWorkHistory(normalizeNullable(req.getWorkHistory()));
        }
        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            if (req.getNewPassword().length() < 6) {
                throw new IllegalArgumentException("Mat khau phai co it nhat 6 ky tu");
            }
            doctor.getUser().setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        }

        doctorRepository.saveAndFlush(doctor);

        if (req.getServiceIds() != null) {
            syncDoctorServices(doctorId, req.getServiceIds());
        }

        return toDoctorDto(doctor);
    }

    @Transactional
    public AdminDoctorDto lockDoctor(UUID doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay bac si"));
        doctor.getUser().setStatus(User.AccountStatus.LOCKED);
        userRepository.save(doctor.getUser());

        auditLogService.log(
            "LOCK_ACCOUNT",
            "USER",
            doctor.getUser().getId(),
            java.util.Map.of("targetPhone", doctor.getUser().getPhone())
        );

        return toDoctorDto(doctor);
    }

    @Transactional
    public AdminDoctorDto unlockDoctor(UUID doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay bac si"));
        doctor.getUser().setStatus(User.AccountStatus.ACTIVE);
        userRepository.save(doctor.getUser());

        auditLogService.log(
            "UNLOCK_ACCOUNT",
            "USER",
            doctor.getUser().getId(),
            java.util.Map.of("targetPhone", doctor.getUser().getPhone())
        );

        return toDoctorDto(doctor);
    }

    @SuppressWarnings("unchecked")
    private void syncDoctorServices(UUID doctorId, List<String> serviceIds) {
        Set<UUID> normalized = new LinkedHashSet<>();
        if (serviceIds != null) {
            for (String rawId : serviceIds) {
                if (rawId == null || rawId.isBlank()) {
                    continue;
                }
                try {
                    UUID serviceId = UUID.fromString(rawId.trim());
                    if (em.find(com.clinic.backend.modules.doctor.entity.Service.class, serviceId) == null) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "serviceId khong ton tai: " + rawId);
                    }
                    normalized.add(serviceId);
                } catch (IllegalArgumentException ex) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "serviceId khong hop le: " + rawId);
                }
            }
        }

        em.createNativeQuery("DELETE FROM doctor_services WHERE doctor_id = :doctorId")
            .setParameter("doctorId", doctorId)
            .executeUpdate();

        for (UUID serviceId : normalized) {
            em.createNativeQuery(
                    "INSERT INTO doctor_services (doctor_id, service_id) VALUES (:doctorId, :serviceId) ON CONFLICT DO NOTHING")
                .setParameter("doctorId", doctorId)
                .setParameter("serviceId", serviceId)
                .executeUpdate();
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> getDoctorServiceIds(UUID doctorId) {
        List<Object> rows = em.createNativeQuery(
                "SELECT service_id FROM doctor_services WHERE doctor_id = :doctorId ORDER BY service_id")
            .setParameter("doctorId", doctorId)
            .getResultList();

        List<String> serviceIds = new ArrayList<>();
        for (Object row : rows) {
            serviceIds.add(row.toString());
        }
        return serviceIds;
    }

    private AdminDoctorDto toDoctorDto(Doctor doctor) {
        AdminDoctorDto dto = new AdminDoctorDto();
        dto.setId(doctor.getId());
        dto.setUserId(doctor.getUser().getId());
        dto.setPhone(doctor.getUser().getPhone());
        dto.setDisplayName(doctor.getDisplayName());
        dto.setSpecialty(doctor.getSpecialty());
        dto.setAvatarUrl(doctor.getAvatarUrl());
        dto.setBio(doctor.getBio());
        dto.setExperienceYears(doctor.getExperienceYears() != null ? doctor.getExperienceYears() : 0);
        dto.setQualifications(doctor.getQualifications());
        dto.setDateOfBirth(doctor.getDateOfBirth());
        dto.setNationalId(doctor.getNationalId());
        dto.setWorkHistory(doctor.getWorkHistory());
        dto.setServiceIds(getDoctorServiceIds(doctor.getId()));
        dto.setStatus(doctor.getUser().getStatus().name());
        dto.setCreatedAt(doctor.getUser().getCreatedAt());
        return dto;
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private Integer normalizeExperienceYears(Integer value) {
        if (value == null) {
            return 0;
        }
        if (value < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "experienceYears phai >= 0");
        }
        return value;
    }

    // =========================================================================
    //  PATIENT MANAGEMENT
    // =========================================================================

    @Transactional(readOnly = true)
    public List<AdminPatientDto> getAllPatients() {
        return patientRepository.findAll().stream()
                .map(this::toPatientDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminPatientDto> searchPatients(String query) {
        if (query == null || query.isBlank()) {
            return getAllPatients();
        }
        return patientRepository.search(query).stream()
                .map(this::toPatientDto)
                .toList();
    }

    /**
     * Reset a patient's linked user account password.
     * The patient must have a linked user account to reset.
     */
    @Transactional
    public void resetPatientPassword(UUID patientId, String newPassword) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay benh nhan"));

        if (patient.getUser() == null) {
            throw new IllegalStateException("Benh nhan chua co tai khoan dang nhap");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Mat khau phai co it nhat 6 ky tu");
        }

        patient.getUser().setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(patient.getUser());

        auditLogService.log(
            "RESET_PASSWORD",
            "USER",
            patient.getUser().getId(),
            java.util.Map.of(
                "targetPhone", patient.getUser().getPhone(),
                "targetRole", patient.getUser().getRole().name()
            )
        );
    }

    private AdminPatientDto toPatientDto(Patient patient) {
        AdminPatientDto dto = new AdminPatientDto();
        dto.setId(patient.getId());
        dto.setFullName(patient.getFullName());
        dto.setPhone(patient.getPhone());
        dto.setNationalId(patient.getNationalId());
        dto.setDateOfBirth(patient.getDateOfBirth());
        dto.setGender(patient.getGender());
        dto.setAddress(patient.getAddress());
        dto.setAllergies(patient.getAllergies());
        dto.setHasAccount(patient.getUser() != null);
        dto.setCreatedAt(patient.getCreatedAt());
        return dto;
    }
}

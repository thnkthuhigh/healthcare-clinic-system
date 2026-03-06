package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.*;
import com.clinic.backend.modules.doctor.entity.Doctor;
import com.clinic.backend.modules.doctor.entity.Patient;
import com.clinic.backend.modules.doctor.entity.User;
import com.clinic.backend.modules.doctor.repository.DoctorRepository;
import com.clinic.backend.modules.doctor.repository.PatientRepository;
import com.clinic.backend.modules.doctor.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class UserManagementService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;

    public UserManagementService(UserRepository userRepository,
                                 DoctorRepository doctorRepository,
                                 PatientRepository patientRepository,
                                 PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
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
            throw new IllegalArgumentException("Số điện thoại đã được sử dụng: " + req.getPhone());
        }

        User user = new User();
        user.setPhone(req.getPhone());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole(User.UserRole.DOCTOR);
        user.setFullName(req.getDisplayName());
        userRepository.save(user);

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        doctor.setDisplayName(req.getDisplayName());
        doctor.setSpecialty(req.getSpecialty());
        doctorRepository.save(doctor);

        return toDoctorDto(doctor);
    }

    @Transactional
    public AdminDoctorDto updateDoctor(UUID doctorId, UpdateDoctorRequest req) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bác sĩ"));

        if (req.getDisplayName() != null && !req.getDisplayName().isBlank()) {
            doctor.setDisplayName(req.getDisplayName());
            doctor.getUser().setFullName(req.getDisplayName());
        }
        if (req.getSpecialty() != null) {
            doctor.setSpecialty(req.getSpecialty());
        }
        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            if (req.getNewPassword().length() < 6) {
                throw new IllegalArgumentException("Mật khẩu phải có ít nhất 6 ký tự");
            }
            doctor.getUser().setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        }

        doctorRepository.save(doctor);
        return toDoctorDto(doctor);
    }

    @Transactional
    public AdminDoctorDto lockDoctor(UUID doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bác sĩ"));
        doctor.getUser().setStatus(User.AccountStatus.LOCKED);
        userRepository.save(doctor.getUser());
        return toDoctorDto(doctor);
    }

    @Transactional
    public AdminDoctorDto unlockDoctor(UUID doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bác sĩ"));
        doctor.getUser().setStatus(User.AccountStatus.ACTIVE);
        userRepository.save(doctor.getUser());
        return toDoctorDto(doctor);
    }

    private AdminDoctorDto toDoctorDto(Doctor doctor) {
        AdminDoctorDto dto = new AdminDoctorDto();
        dto.setId(doctor.getId());
        dto.setUserId(doctor.getUser().getId());
        dto.setPhone(doctor.getUser().getPhone());
        dto.setDisplayName(doctor.getDisplayName());
        dto.setSpecialty(doctor.getSpecialty());
        dto.setStatus(doctor.getUser().getStatus().name());
        dto.setCreatedAt(doctor.getUser().getCreatedAt());
        return dto;
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
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bệnh nhân"));

        if (patient.getUser() == null) {
            throw new IllegalStateException("Bệnh nhân chưa có tài khoản đăng nhập");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 6 ký tự");
        }

        patient.getUser().setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(patient.getUser());
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

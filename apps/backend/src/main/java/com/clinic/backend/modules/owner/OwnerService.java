package com.clinic.backend.modules.owner;

import com.clinic.backend.modules.doctor.entity.Doctor;
import com.clinic.backend.modules.doctor.entity.User;
import com.clinic.backend.modules.doctor.repository.DoctorRepository;
import com.clinic.backend.modules.doctor.repository.UserRepository;
import com.clinic.backend.modules.owner.dto.AccountResponse;
import com.clinic.backend.modules.owner.dto.CreateAccountRequest;
import com.clinic.backend.modules.owner.dto.ResetPasswordRequest;
import com.clinic.backend.modules.owner.dto.UpdateAccountRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class OwnerService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;

    public OwnerService(UserRepository userRepository, DoctorRepository doctorRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> listAccounts() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AccountResponse getAccount(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại"));
        return toResponse(user);
    }

    @Transactional
    public AccountResponse createAccount(CreateAccountRequest request) {
        if (userRepository.existsByPhone(request.phone())) {
            throw new IllegalArgumentException("Số điện thoại đã được đăng ký");
        }

        User.UserRole userRole = User.UserRole.valueOf(request.role().name());

        User user = new User();
        user.setFullName(request.fullName());
        user.setPhone(request.phone());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(userRole);
        user.setStatus(User.AccountStatus.ACTIVE);
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());

        user = userRepository.save(user);

        // If DOCTOR role, also create Doctor profile
        if (userRole == User.UserRole.DOCTOR) {
            Doctor doctor = new Doctor();
            doctor.setUser(user);
            doctor.setDisplayName(request.fullName());
            doctor.setSpecialty(request.specialty());
            doctorRepository.save(doctor);
        }

        return toResponse(user);
    }

    @Transactional
    public AccountResponse updateAccount(UUID userId, UpdateAccountRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại"));

        if (user.getRole() == User.UserRole.OWNER) {
            throw new IllegalArgumentException("Không thể chỉnh sửa tài khoản Owner");
        }

        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName());

            // Update doctor display name if applicable
            if (user.getRole() == User.UserRole.DOCTOR) {
                doctorRepository.findByUserId(userId).ifPresent(doctor -> {
                    doctor.setDisplayName(request.fullName());
                    doctorRepository.save(doctor);
                });
            }
        }

        if (request.specialty() != null && user.getRole() == User.UserRole.DOCTOR) {
            doctorRepository.findByUserId(userId).ifPresent(doctor -> {
                doctor.setSpecialty(request.specialty());
                doctorRepository.save(doctor);
            });
        }

        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        return toResponse(user);
    }

    @Transactional
    public AccountResponse toggleLock(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại"));

        if (user.getRole() == User.UserRole.OWNER) {
            throw new IllegalArgumentException("Không thể khóa tài khoản Owner");
        }

        if (user.getStatus() == User.AccountStatus.ACTIVE) {
            user.setStatus(User.AccountStatus.LOCKED);
        } else {
            user.setStatus(User.AccountStatus.ACTIVE);
        }

        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        return toResponse(user);
    }

    @Transactional
    public void resetPassword(UUID userId, ResetPasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại"));

        if (user.getRole() == User.UserRole.OWNER) {
            throw new IllegalArgumentException("Không thể đặt lại mật khẩu tài khoản Owner");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại"));

        if (user.getRole() == User.UserRole.OWNER) {
            throw new IllegalArgumentException("Không thể xóa tài khoản Owner");
        }

        // Delete doctor profile if exists
        if (user.getRole() == User.UserRole.DOCTOR) {
            doctorRepository.findByUserId(userId).ifPresent(doctorRepository::delete);
        }

        userRepository.delete(user);
    }

    private AccountResponse toResponse(User user) {
        String specialty = null;
        if (user.getRole() == User.UserRole.DOCTOR) {
            specialty = doctorRepository.findByUserId(user.getId())
                    .map(Doctor::getSpecialty)
                    .orElse(null);
        }

        return new AccountResponse(
                user.getId().toString(),
                user.getFullName(),
                user.getPhone(),
                user.getRole().name(),
                user.getStatus().name(),
                specialty,
                user.getCreatedAt()
        );
    }
}

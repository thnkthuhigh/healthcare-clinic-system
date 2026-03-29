package com.clinic.backend.modules.doctor.service;

import com.clinic.backend.modules.doctor.dto.DoctorTotpSetupDto;
import com.clinic.backend.modules.doctor.dto.DoctorTotpStatusDto;
import com.clinic.backend.modules.doctor.entity.User;
import com.clinic.backend.modules.doctor.repository.UserRepository;
import com.clinic.backend.security.TotpService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class DoctorSecurityService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TotpService totpService;

    public DoctorSecurityService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            TotpService totpService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.totpService = totpService;
    }

    @Transactional(readOnly = true)
    public DoctorTotpStatusDto getTotpStatus(UUID userId) {
        User user = requireDoctorUser(userId);
        return toStatusDto(user);
    }

    @Transactional
    public DoctorTotpSetupDto issueTotpSetup(UUID userId, boolean regenerate) {
        User user = requireDoctorUser(userId);
        if (regenerate || user.getTotpSecret() == null || user.getTotpSecret().isBlank()) {
            user.setTotpSecret(totpService.generateSecret());
            user.setTotpConfirmedAt(null);
            user.setUpdatedAt(Instant.now());
        }

        String accountName = buildAccountName(user);
        return new DoctorTotpSetupDto(
                user.getTotpSecret(),
                formatManualEntryKey(user.getTotpSecret()),
                totpService.buildOtpAuthUri(accountName, user.getTotpSecret()),
                user.getTotpConfirmedAt() != null,
                totpService.getIssuer(),
                accountName);
    }

    @Transactional
    public DoctorTotpStatusDto confirmTotp(UUID userId, String code) {
        User user = requireDoctorUser(userId);
        ensureTotpReadyForVerification(user);

        if (!totpService.verifyCode(user.getTotpSecret(), code, Instant.now())) {
            throw new IllegalArgumentException("Ma xac thuc khong dung hoac da het han");
        }

        if (user.getTotpConfirmedAt() == null) {
            user.setTotpConfirmedAt(Instant.now());
            user.setUpdatedAt(Instant.now());
        }

        return toStatusDto(user);
    }

    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword, String code) {
        User user = requireDoctorUser(userId);

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Mat khau hien tai khong dung");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Mat khau moi phai co it nhat 6 ky tu");
        }
        ensureTotpConfirmed(user);
        if (!totpService.verifyCode(user.getTotpSecret(), code, Instant.now())) {
            throw new IllegalArgumentException("Ma xac thuc khong dung hoac da het han");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(Instant.now());
    }

    private User requireDoctorUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Tai khoan khong ton tai"));
        if (user.getRole() != User.UserRole.DOCTOR) {
            throw new IllegalArgumentException("Chi ap dung TOTP cho tai khoan bac si");
        }
        return user;
    }

    private void ensureTotpReadyForVerification(User user) {
        if (user.getTotpSecret() == null || user.getTotpSecret().isBlank()) {
            throw new IllegalArgumentException("Tai khoan bac si chua duoc cap ma TOTP");
        }
    }

    private void ensureTotpConfirmed(User user) {
        ensureTotpReadyForVerification(user);
        if (user.getTotpConfirmedAt() == null) {
            throw new IllegalArgumentException("Tai khoan bac si chua xac nhan TOTP");
        }
    }

    private DoctorTotpStatusDto toStatusDto(User user) {
        return new DoctorTotpStatusDto(
                user.getTotpSecret() != null && !user.getTotpSecret().isBlank(),
                user.getTotpConfirmedAt() != null,
                totpService.getIssuer(),
                buildAccountName(user));
    }

    private String buildAccountName(User user) {
        return user.getPhone();
    }

    private String formatManualEntryKey(String secret) {
        if (secret == null || secret.isBlank()) {
            return "";
        }

        StringBuilder formatted = new StringBuilder();
        for (int index = 0; index < secret.length(); index++) {
            if (index > 0 && index % 4 == 0) {
                formatted.append(' ');
            }
            formatted.append(secret.charAt(index));
        }
        return formatted.toString();
    }
}

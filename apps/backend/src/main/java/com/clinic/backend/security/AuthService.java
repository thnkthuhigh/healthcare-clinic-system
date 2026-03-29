package com.clinic.backend.security;

import com.clinic.backend.modules.doctor.entity.User;
import com.clinic.backend.modules.doctor.repository.UserRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final PasswordResetTokenRepository tokenRepository;
    private final JavaMailSender mailSender;
    private final SmsSender smsSender;
    private final TotpService totpService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       PasswordResetTokenRepository tokenRepository,
                       JavaMailSender mailSender,
                       SmsSender smsSender,
                       TotpService totpService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.tokenRepository = tokenRepository;
        this.mailSender = mailSender;
        this.smsSender = smsSender;
        this.totpService = totpService;
    }

    @Transactional
    public void register(String fullName, String phone, String password) {
        if (userRepository.existsByPhone(phone)) {
            throw new IllegalArgumentException("So dien thoai da duoc dang ky");
        }

        User user = new User();
        user.setFullName(fullName);
        user.setPhone(phone);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(User.UserRole.PATIENT);
        user.setStatus(User.AccountStatus.ACTIVE);

        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> login(String phone, String password) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new IllegalArgumentException("So dien thoai hoac mat khau khong dung"));

        if (user.getStatus() != User.AccountStatus.ACTIVE) {
            throw new IllegalArgumentException("Tai khoan da bi khoa");
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("So dien thoai hoac mat khau khong dung");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getPhone(), user.getRole().name());

        return Map.of(
                "token", token,
                "user", Map.of(
                        "id", user.getId().toString(),
                        "phone", user.getPhone(),
                        "role", user.getRole().name(),
                        "status", user.getStatus().name()
                )
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> me(String token) {
        if (!jwtUtil.isValid(token)) {
            throw new IllegalArgumentException("Token khong hop le");
        }

        var userId = jwtUtil.getUserId(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Nguoi dung khong ton tai"));

        return Map.of(
                "id", user.getId().toString(),
                "phone", user.getPhone(),
                "role", user.getRole().name(),
                "status", user.getStatus().name()
        );
    }

    @Transactional
    public Map<String, String> sendResetOtp(String phone) {
        Optional<User> maybeUser = userRepository.findByPhone(phone);
        if (maybeUser.isPresent() && maybeUser.get().getRole() == User.UserRole.DOCTOR) {
            User doctorUser = maybeUser.get();
            if (doctorUser.getTotpSecret() == null || doctorUser.getTotpSecret().isBlank()) {
                throw new IllegalArgumentException(
                        "Tai khoan bac si chua duoc admin cap QR xac thuc. Vui long lien he admin hoac owner.");
            }
            return Map.of(
                    "method", "TOTP",
                    "message", "Nhap ma 6 so trong app xac thuc da quet tu QR duoc admin cap.");
        }

        String code = String.format("%06d", (int) (Math.random() * 900000) + 100000);

        PasswordResetToken token = new PasswordResetToken();
        token.setPhone(phone);
        token.setCode(code);
        token.setExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        tokenRepository.deleteByPhone(phone);
        tokenRepository.save(token);

        try {
            if (smsSender.isConfigured()) {
                smsSender.sendOtp(phone, code);
                return Map.of(
                        "method", "SMS",
                        "message", "Ma OTP da duoc gui. Vui long kiem tra tin nhan hoac kenh debug.");
            }
        } catch (Exception ex) {
            System.out.println("Failed to send OTP SMS: " + ex.getMessage());
        }

        try {
            String recipient = System.getenv("OTP_TEST_RECIPIENT");
            if (recipient != null && !recipient.isBlank()) {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setTo(recipient);
                msg.setSubject("[Clinic] Ma OTP dat lai mat khau");
                msg.setText("Ma OTP cua ban: " + code + " (het han sau 10 phut)");
                mailSender.send(msg);
            } else {
                System.out.println("[DEBUG] OTP for phone=" + phone + " code=" + code);
            }
        } catch (Exception ex) {
            System.out.println("Failed to send OTP email: " + ex.getMessage());
        }

        return Map.of(
                "method", "SMS",
                "message", "Ma OTP da duoc gui. Vui long kiem tra tin nhan hoac kenh debug.");
    }

    @Transactional
    public Map<String, String> verifyResetChallenge(String phone, String otp) {
        Optional<User> maybeUser = userRepository.findByPhone(phone);
        if (maybeUser.isPresent() && maybeUser.get().getRole() == User.UserRole.DOCTOR) {
            verifyDoctorResetChallenge(maybeUser.get(), otp);
            return createResetSession(phone);
        }

        verifySmsResetChallenge(phone, otp);
        return createResetSession(phone);
    }

    @Transactional
    public void resetPassword(String phone, String resetToken, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Mat khau phai co it nhat 6 ky tu");
        }
        if (resetToken == null || resetToken.isBlank()) {
            throw new IllegalArgumentException("Thieu phien dat lai mat khau");
        }

        Optional<PasswordResetToken> maybe = tokenRepository.findFirstByPhoneOrderByCreatedAtDesc(phone);
        if (maybe.isEmpty()) {
            throw new IllegalArgumentException("Phien dat lai mat khau khong hop le hoac da het han");
        }

        PasswordResetToken token = maybe.get();
        if (token.getExpiresAt().isBefore(Instant.now())) {
            tokenRepository.deleteByPhone(phone);
            throw new IllegalArgumentException("Phien dat lai mat khau da het han");
        }
        if (!token.getCode().equals(resetToken)) {
            throw new IllegalArgumentException("Phien dat lai mat khau khong hop le");
        }

        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay nguoi dung voi so dien thoai nay"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        tokenRepository.deleteByPhone(phone);
    }

    private void verifyDoctorResetChallenge(User user, String otp) {
        if (user.getTotpSecret() == null || user.getTotpSecret().isBlank()) {
            throw new IllegalArgumentException(
                    "Tai khoan bac si chua duoc admin cap QR xac thuc. Vui long lien he admin hoac owner.");
        }
        if (!totpService.verifyCode(user.getTotpSecret(), otp, Instant.now())) {
            throw new IllegalArgumentException("Ma TOTP khong dung hoac da het han");
        }
        if (user.getTotpConfirmedAt() == null) {
            user.setTotpConfirmedAt(Instant.now());
            user.setUpdatedAt(Instant.now());
            userRepository.save(user);
        }
    }

    private void verifySmsResetChallenge(String phone, String otp) {
        Optional<PasswordResetToken> maybe = tokenRepository.findFirstByPhoneOrderByCreatedAtDesc(phone);
        if (maybe.isEmpty()) {
            throw new IllegalArgumentException("OTP khong hop le hoac da het han");
        }
        PasswordResetToken token = maybe.get();
        if (token.getExpiresAt().isBefore(Instant.now())) {
            tokenRepository.deleteByPhone(phone);
            throw new IllegalArgumentException("OTP da het han");
        }
        if (!token.getCode().equals(otp)) {
            throw new IllegalArgumentException("OTP khong dung");
        }
    }

    private Map<String, String> createResetSession(String phone) {
        String resetToken = UUID.randomUUID().toString().replace("-", "");

        PasswordResetToken session = new PasswordResetToken();
        session.setPhone(phone);
        session.setCode(resetToken);
        session.setExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));

        tokenRepository.deleteByPhone(phone);
        tokenRepository.save(session);

        return Map.of(
                "resetToken", resetToken,
                "message", "Da xac minh thanh cong. Hay dat mat khau moi trong 10 phut.");
    }
}

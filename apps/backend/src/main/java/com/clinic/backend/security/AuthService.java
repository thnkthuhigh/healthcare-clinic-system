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

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final PasswordResetTokenRepository tokenRepository;
    private final JavaMailSender mailSender;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
                       PasswordResetTokenRepository tokenRepository, JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.tokenRepository = tokenRepository;
        this.mailSender = mailSender;
    }

    @Transactional
    public void register(String fullName, String phone, String password) {
        if (userRepository.existsByPhone(phone)) {
            throw new IllegalArgumentException("Số điện thoại đã được đăng ký");
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
                .orElseThrow(() -> new IllegalArgumentException("Số điện thoại hoặc mật khẩu không đúng"));

        if (user.getStatus() != User.AccountStatus.ACTIVE) {
            throw new IllegalArgumentException("Tài khoản đã bị khóa");
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Số điện thoại hoặc mật khẩu không đúng");
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
            throw new IllegalArgumentException("Token không hợp lệ");
        }

        var userId = jwtUtil.getUserId(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

        return Map.of(
                "id", user.getId().toString(),
                "phone", user.getPhone(),
                "role", user.getRole().name(),
                "status", user.getStatus().name()
        );
    }

    // =====================================================
    // Forgot-password / OTP support
    // =====================================================

    @Transactional
    public void sendResetOtp(String phone) {
        // generate 6-digit OTP
        String code = String.format("%06d", (int) (Math.random() * 900000) + 100000);

        PasswordResetToken token = new PasswordResetToken();
        token.setPhone(phone);
        token.setCode(code);
        token.setExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        tokenRepository.deleteByPhone(phone); // remove previous tokens
        tokenRepository.save(token);

        // Try to send email if mailSender is configured — recipient email is not captured in registration
        // For demonstration, we will send to an admin/debug address if provided via spring.mail.username
        try {
            String recipient = System.getenv("OTP_TEST_RECIPIENT");
            if (recipient != null && !recipient.isBlank()) {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setTo(recipient);
                msg.setSubject("[Clinic] Mã OTP đặt lại mật khẩu");
                msg.setText("Mã OTP của bạn: " + code + " (hết hạn sau 10 phút)");
                mailSender.send(msg);
            } else {
                // fallback: log the OTP so developers can see it during testing
                System.out.println("[DEBUG] OTP for phone=" + phone + " code=" + code);
            }
        } catch (Exception ex) {
            // swallow — OTP stored and can be verified even if email sending fails
            System.out.println("Failed to send OTP email: " + ex.getMessage());
        }
    }

    @Transactional
    public void resetPassword(String phone, String otp, String newPassword) {
        Optional<PasswordResetToken> maybe = tokenRepository.findFirstByPhoneOrderByCreatedAtDesc(phone);
        if (maybe.isEmpty()) {
            throw new IllegalArgumentException("OTP không hợp lệ hoặc đã hết hạn");
        }
        PasswordResetToken token = maybe.get();
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("OTP đã hết hạn");
        }
        if (!token.getCode().equals(otp)) {
            throw new IllegalArgumentException("OTP không đúng");
        }

        // If newPassword is a special value '__verify_only__', just verify OTP
        if ("__verify_only__".equals(newPassword)) {
            return;
        }

        // Find user and update password
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với số điện thoại này"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        tokenRepository.deleteByPhone(phone);
    }
}

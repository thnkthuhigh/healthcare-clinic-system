package com.clinic.backend.security;

import com.clinic.backend.modules.doctor.entity.User;
import com.clinic.backend.modules.doctor.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
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
}

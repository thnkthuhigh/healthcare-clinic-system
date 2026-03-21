package com.clinic.backend.security;

import com.clinic.backend.modules.doctor.dto.request.LoginRequest;
import com.clinic.backend.modules.doctor.dto.request.RegisterRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Auth", description = "Authentication endpoints")
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Register", description = "Đăng ký tài khoản bệnh nhân mới")
    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request.fullName(), request.phone(), request.password());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(summary = "Login", description = "Đăng nhập bằng số điện thoại và mật khẩu")
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        Map<String, Object> result = authService.login(request.phone(), request.password());
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Get current user", description = "Lấy thông tin người dùng hiện tại từ JWT")
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        Map<String, Object> user = authService.me(token);
        return ResponseEntity.ok(user);
    }

    @Operation(summary = "Send reset OTP", description = "Gửi mã OTP để đặt lại mật khẩu (demo: logs OTP if email not configured)")
    @PostMapping("/forgot/send-otp")
    public ResponseEntity<Void> sendResetOtp(@RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        if (phone == null || phone.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        authService.sendResetOtp(phone);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Reset password using OTP", description = "Xác minh OTP và đặt lại mật khẩu")
    @PostMapping("/forgot/reset")
    public ResponseEntity<Void> resetPassword(@RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        String otp = body.get("otp");
        String newPassword = body.get("newPassword");
        if (phone == null || otp == null || newPassword == null) {
            return ResponseEntity.badRequest().build();
        }
        authService.resetPassword(phone, otp, newPassword);
        return ResponseEntity.ok().build();
    }
}

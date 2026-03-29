package com.clinic.backend.security;

import com.clinic.backend.modules.doctor.dto.request.LoginRequest;
import com.clinic.backend.modules.doctor.dto.request.RegisterRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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
    public ResponseEntity<Map<String, Object>> me(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || authHeader.isBlank() || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Thiếu hoặc sai định dạng token");
        }
        String token = authHeader.substring("Bearer ".length()).trim();
        if (token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token không hợp lệ");
        }
        Map<String, Object> user = authService.me(token);
        return ResponseEntity.ok(user);
    }

    @Operation(summary = "Send reset OTP", description = "Gửi mã OTP để đặt lại mật khẩu (demo: logs OTP if email not configured)")
    @PostMapping("/forgot/send-otp")
    public ResponseEntity<Map<String, String>> sendResetOtp(@RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        if (phone == null || phone.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(authService.sendResetOtp(phone));
    }

    @Operation(summary = "Verify reset challenge", description = "Xác minh OTP/TOTP và lấy reset token ngắn hạn")
    @PostMapping("/forgot/verify")
    public ResponseEntity<Map<String, String>> verifyResetOtp(@RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        String otp = body.get("otp");
        if (phone == null || otp == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(authService.verifyResetChallenge(phone, otp));
    }

    @Operation(summary = "Reset password using reset token", description = "Dùng reset token ngắn hạn để đặt lại mật khẩu")
    @PostMapping("/forgot/reset")
    public ResponseEntity<Void> resetPassword(@RequestBody Map<String, String> body) {
        String phone = body.get("phone");
        String resetToken = body.get("resetToken");
        String newPassword = body.get("newPassword");
        if (phone == null || resetToken == null || newPassword == null) {
            return ResponseEntity.badRequest().build();
        }
        authService.resetPassword(phone, resetToken, newPassword);
        return ResponseEntity.ok().build();
    }
}

package com.clinic.backend.modules.owner;

import com.clinic.backend.modules.owner.dto.AccountResponse;
import com.clinic.backend.modules.owner.dto.CreateAccountRequest;
import com.clinic.backend.modules.owner.dto.ResetPasswordRequest;
import com.clinic.backend.modules.owner.dto.UpdateAccountRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Owner - Account Management", description = "Quản lý tài khoản (chỉ OWNER)")
@RestController
@RequestMapping("/api/owner/accounts")
@PreAuthorize("hasRole('OWNER')")
public class OwnerController {

    private final OwnerService ownerService;

    public OwnerController(OwnerService ownerService) {
        this.ownerService = ownerService;
    }

    @Operation(summary = "Danh sách tài khoản", description = "Lấy danh sách tất cả tài khoản")
    @GetMapping
    public ResponseEntity<List<AccountResponse>> listAccounts() {
        return ResponseEntity.ok(ownerService.listAccounts());
    }

    @Operation(summary = "Chi tiết tài khoản", description = "Lấy thông tin chi tiết một tài khoản")
    @GetMapping("/{userId}")
    public ResponseEntity<AccountResponse> getAccount(@PathVariable UUID userId) {
        return ResponseEntity.ok(ownerService.getAccount(userId));
    }

    @Operation(summary = "Tạo tài khoản", description = "Tạo tài khoản nhân viên mới (ADMIN, DOCTOR, RECEPTIONIST, CASHIER)")
    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(@Valid @RequestBody CreateAccountRequest request) {
        AccountResponse account = ownerService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(account);
    }

    @Operation(summary = "Cập nhật tài khoản", description = "Cập nhật thông tin tài khoản")
    @PutMapping("/{userId}")
    public ResponseEntity<AccountResponse> updateAccount(
            @PathVariable UUID userId,
            @RequestBody UpdateAccountRequest request
    ) {
        return ResponseEntity.ok(ownerService.updateAccount(userId, request));
    }

    @Operation(summary = "Khóa/Mở khóa", description = "Chuyển đổi trạng thái khóa/mở khóa tài khoản")
    @PatchMapping("/{userId}/toggle-lock")
    public ResponseEntity<AccountResponse> toggleLock(@PathVariable UUID userId) {
        return ResponseEntity.ok(ownerService.toggleLock(userId));
    }

    @Operation(summary = "Đặt lại mật khẩu", description = "Đặt lại mật khẩu cho tài khoản")
    @PatchMapping("/{userId}/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @PathVariable UUID userId,
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        ownerService.resetPassword(userId, request);
        return ResponseEntity.ok(Map.of("message", "Đặt lại mật khẩu thành công"));
    }

    @Operation(summary = "Xóa tài khoản", description = "Xóa tài khoản (không thể xóa OWNER)")
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteAccount(@PathVariable UUID userId) {
        ownerService.deleteAccount(userId);
        return ResponseEntity.noContent().build();
    }
}

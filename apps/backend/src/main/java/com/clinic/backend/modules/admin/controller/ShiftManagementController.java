package com.clinic.backend.modules.admin.controller;

import com.clinic.backend.modules.admin.dto.AdminShiftDto;
import com.clinic.backend.modules.admin.dto.AdminSlotDto;
import com.clinic.backend.modules.admin.dto.CreateShiftRequest;
import com.clinic.backend.modules.admin.service.ShiftManagementService;
import com.clinic.backend.modules.doctor.entity.Shift;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/shifts")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class ShiftManagementController {

    private final ShiftManagementService shiftManagementService;

    public ShiftManagementController(ShiftManagementService shiftManagementService) {
        this.shiftManagementService = shiftManagementService;
    }

    /** GET /api/v1/admin/shifts?date=YYYY-MM-DD */
    @GetMapping
    public List<AdminShiftDto> getShifts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate target = date != null ? date : LocalDate.now();
        return shiftManagementService.getShiftsForDate(target);
    }

    /** POST /api/v1/admin/shifts */
    @PostMapping
    public AdminShiftDto createShift(@Valid @RequestBody CreateShiftRequest request) {
        return shiftManagementService.createShift(request);
    }

    /** POST /api/v1/admin/shifts/{id}/lock */
    @PostMapping("/{id}/lock")
    public AdminShiftDto lockShift(@PathVariable UUID id) {
        return shiftManagementService.setShiftStatus(id, Shift.ShiftStatus.CLOSED);
    }

    /** POST /api/v1/admin/shifts/{id}/open */
    @PostMapping("/{id}/open")
    public AdminShiftDto openShift(@PathVariable UUID id) {
        return shiftManagementService.setShiftStatus(id, Shift.ShiftStatus.OPEN);
    }

    /** DELETE /api/v1/admin/shifts/{id} */
    @DeleteMapping("/{id}")
    public void deleteShift(@PathVariable UUID id) {
        shiftManagementService.deleteShift(id);
    }

    /** GET /api/v1/admin/shifts/{id}/slots */
    @GetMapping("/{id}/slots")
    public List<AdminSlotDto> getSlots(@PathVariable UUID id) {
        return shiftManagementService.getSlots(id);
    }

    /** POST /api/v1/admin/shifts/slots/{slotId}/toggle */
    @PostMapping("/slots/{slotId}/toggle")
    public AdminSlotDto toggleSlot(@PathVariable UUID slotId) {
        return shiftManagementService.toggleSlot(slotId);
    }
}

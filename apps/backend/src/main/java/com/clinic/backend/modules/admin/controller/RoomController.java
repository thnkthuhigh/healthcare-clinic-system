package com.clinic.backend.modules.admin.controller;

import com.clinic.backend.modules.admin.dto.RoomDto;
import com.clinic.backend.modules.admin.service.RoomService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/rooms")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    public record CreateRoomRequest(
        @NotBlank String code,
        @NotBlank String name,
        @NotBlank String serviceId,
        String status
    ) {}

    public record UpdateRoomRequest(
        String code,
        String name,
        String serviceId,
        String status
    ) {}

    @GetMapping
    public List<RoomDto> getRooms(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String serviceId
    ) {
        return roomService.getRooms(status, serviceId);
    }

    @PostMapping
    public RoomDto createRoom(@Valid @RequestBody CreateRoomRequest request) {
        return roomService.createRoom(
            request.code(),
            request.name(),
            request.serviceId(),
            request.status()
        );
    }

    @PatchMapping("/{id}")
    public RoomDto updateRoom(@PathVariable UUID id, @RequestBody UpdateRoomRequest request) {
        return roomService.updateRoom(
            id,
            request.code(),
            request.name(),
            request.serviceId(),
            request.status()
        );
    }

    @PostMapping("/{id}/toggle")
    public RoomDto toggleRoom(@PathVariable UUID id) {
        return roomService.toggleActive(id);
    }
}

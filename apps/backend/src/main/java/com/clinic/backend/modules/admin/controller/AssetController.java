package com.clinic.backend.modules.admin.controller;

import com.clinic.backend.modules.admin.dto.AssetDto;
import com.clinic.backend.modules.admin.service.AssetService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/assets")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class AssetController {

    private final AssetService assetService;

    public AssetController(AssetService assetService) {
        this.assetService = assetService;
    }

    public record CreateAssetRequest(
        @NotBlank String name,
        String assetCode,
        @NotBlank String category,
        String roomId,
        String purchaseDate,
        Long purchasePriceCents,
        String status,
        String notes
    ) {}

    public record UpdateAssetRequest(
        String name,
        String assetCode,
        String category,
        String roomId,
        String purchaseDate,
        Long purchasePriceCents,
        String status,
        String notes
    ) {}

    @GetMapping
    public List<AssetDto> getAssets(
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String roomId
    ) {
        return assetService.getAssets(category, status, roomId);
    }

    @PostMapping
    public AssetDto createAsset(@Valid @RequestBody CreateAssetRequest request) {
        return assetService.createAsset(
            request.name(),
            request.assetCode(),
            request.category(),
            request.roomId(),
            request.purchaseDate(),
            request.purchasePriceCents(),
            request.status(),
            request.notes()
        );
    }

    @PatchMapping("/{id}")
    public AssetDto updateAsset(@PathVariable UUID id, @RequestBody UpdateAssetRequest request) {
        return assetService.updateAsset(
            id,
            request.name(),
            request.assetCode(),
            request.category(),
            request.roomId(),
            request.purchaseDate(),
            request.purchasePriceCents(),
            request.status(),
            request.notes()
        );
    }
}

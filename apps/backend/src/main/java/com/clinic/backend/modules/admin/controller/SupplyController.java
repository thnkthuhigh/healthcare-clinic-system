package com.clinic.backend.modules.admin.controller;

import com.clinic.backend.modules.admin.dto.SupplyDto;
import com.clinic.backend.modules.admin.service.SupplyService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/supplies")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class SupplyController {

    private final SupplyService supplyService;

    public SupplyController(SupplyService supplyService) {
        this.supplyService = supplyService;
    }

    public record CreateSupplyRequest(
        @NotBlank String name,
        @NotBlank String unit,
        Integer stockQty,
        Integer minQty,
        Long unitCostCents,
        Boolean active
    ) {}

    public record UpdateSupplyRequest(
        String name,
        String unit,
        Integer stockQty,
        Integer minQty,
        Long unitCostCents,
        Boolean active
    ) {}

    public record RestockSupplyRequest(
        @NotNull @Positive Integer qty,
        Long unitCostCents
    ) {}

    @GetMapping
    public List<SupplyDto> getSupplies(
        @RequestParam(required = false) Boolean active,
        @RequestParam(required = false) Boolean lowStock
    ) {
        return supplyService.getSupplies(active, lowStock);
    }

    @PostMapping
    public SupplyDto createSupply(@Valid @RequestBody CreateSupplyRequest request) {
        return supplyService.createSupply(
            request.name(),
            request.unit(),
            request.stockQty(),
            request.minQty(),
            request.unitCostCents(),
            request.active()
        );
    }

    @PatchMapping("/{id}")
    public SupplyDto updateSupply(@PathVariable UUID id, @RequestBody UpdateSupplyRequest request) {
        return supplyService.updateSupply(
            id,
            request.name(),
            request.unit(),
            request.stockQty(),
            request.minQty(),
            request.unitCostCents(),
            request.active()
        );
    }

    @PostMapping("/{id}/restock")
    public SupplyDto restock(@PathVariable UUID id, @Valid @RequestBody RestockSupplyRequest request) {
        return supplyService.restock(id, request.qty(), request.unitCostCents());
    }

    @PostMapping("/{id}/toggle")
    public SupplyDto toggle(@PathVariable UUID id) {
        return supplyService.toggle(id);
    }
}

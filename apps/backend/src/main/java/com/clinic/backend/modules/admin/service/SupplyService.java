package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.SupplyDto;
import com.clinic.backend.modules.admin.entity.Supply;
import com.clinic.backend.modules.admin.repository.SupplyRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SupplyService {

    @PersistenceContext
    private EntityManager em;

    private final SupplyRepository supplyRepository;
    private final AuditLogService auditLogService;

    public SupplyService(SupplyRepository supplyRepository,
                         AuditLogService auditLogService) {
        this.supplyRepository = supplyRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<SupplyDto> getSupplies(Boolean active, Boolean lowStock) {
        return supplyRepository.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
            .filter(supply -> active == null || supply.getIsActive().equals(active))
            .filter(supply -> lowStock == null || !lowStock || isLowStock(supply))
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    @Transactional
    public SupplyDto createSupply(String name,
                                  String unit,
                                  Integer stockQty,
                                  Integer minQty,
                                  Long unitCostCents,
                                  Boolean active) {
        Supply supply = new Supply();
        supply.setName(normalizeRequired(name, "Ten vat tu la bat buoc"));
        supply.setUnit(normalizeRequired(unit, "Don vi la bat buoc"));
        supply.setStockQty(nonNegative(stockQty, "stockQty", 0));
        supply.setMinQty(nonNegative(minQty, "minQty", 0));
        supply.setUnitCostCents(nonNegativeLong(unitCostCents, "unitCostCents", 0L));
        supply.setIsActive(active == null || active);

        Supply saved = supplyRepository.save(supply);

        // Trigger only tracks UPDATE stock_qty, so create with initial stock is inserted manually.
        if (saved.getStockQty() > 0) {
            em.createNativeQuery("""
                    INSERT INTO finance_ledger (
                        id, entry_date, entry_type, category, ref_type, ref_id,
                        description, qty, unit, amount_cents, actor_user_id, created_at
                    ) VALUES (
                        gen_random_uuid(), CURRENT_DATE, 'EXPENSE', 'SUPPLY_PURCHASE', 'SUPPLY', :refId,
                        :description, :qty, :unit, :amount, :actorUserId, now()
                    )
                    """)
                .setParameter("refId", saved.getId())
                .setParameter("description", "Nhap kho vat tu ban dau: " + saved.getName())
                .setParameter("qty", saved.getStockQty())
                .setParameter("unit", saved.getUnit())
                .setParameter("amount", (long) saved.getStockQty() * saved.getUnitCostCents())
                .setParameter("actorUserId", auditLogService.getCurrentActorUserIdOrNull())
                .executeUpdate();
        }

        return toDto(saved);
    }

    @Transactional
    public SupplyDto updateSupply(UUID id,
                                  String name,
                                  String unit,
                                  Integer stockQty,
                                  Integer minQty,
                                  Long unitCostCents,
                                  Boolean active) {
        Supply supply = supplyRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay vat tu"));

        if (name != null) {
            supply.setName(normalizeRequired(name, "Ten vat tu khong hop le"));
        }
        if (unit != null) {
            supply.setUnit(normalizeRequired(unit, "Don vi khong hop le"));
        }
        if (stockQty != null) {
            int oldQty = supply.getStockQty();
            int newQty = nonNegative(stockQty, "stockQty", 0);
            supply.setStockQty(newQty);
            if (newQty != oldQty) {
                auditLogService.log(
                    "STOCK_EDIT",
                    "SUPPLY",
                    supply.getId(),
                    Map.of(
                        "supplyName", supply.getName(),
                        "oldQty", oldQty,
                        "newQty", newQty,
                        "type", newQty > oldQty ? "RESTOCK" : "ADJUST"
                    )
                );
            }
        }
        if (minQty != null) {
            supply.setMinQty(nonNegative(minQty, "minQty", 0));
        }
        if (unitCostCents != null) {
            supply.setUnitCostCents(nonNegativeLong(unitCostCents, "unitCostCents", 0L));
        }
        if (active != null) {
            supply.setIsActive(active);
        }

        return toDto(supplyRepository.save(supply));
    }

    @Transactional
    public SupplyDto restock(UUID id, Integer qty, Long unitCostCents) {
        Supply supply = supplyRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay vat tu"));

        if (qty == null || qty < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "qty phai >= 1");
        }

        if (unitCostCents != null) {
            supply.setUnitCostCents(nonNegativeLong(unitCostCents, "unitCostCents", 0L));
        }

        int oldQty = supply.getStockQty();
        int newQty = oldQty + qty;
        supply.setStockQty(newQty);

        Supply saved = supplyRepository.save(supply);

        auditLogService.log(
            "STOCK_EDIT",
            "SUPPLY",
            saved.getId(),
            Map.of(
                "supplyName", saved.getName(),
                "oldQty", oldQty,
                "newQty", newQty,
                "type", "RESTOCK"
            )
        );

        return toDto(saved);
    }

    @Transactional
    public SupplyDto toggle(UUID id) {
        Supply supply = supplyRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay vat tu"));
        supply.setIsActive(!supply.getIsActive());
        return toDto(supplyRepository.save(supply));
    }

    private SupplyDto toDto(Supply supply) {
        SupplyDto dto = new SupplyDto();
        dto.setId(supply.getId().toString());
        dto.setName(supply.getName());
        dto.setUnit(supply.getUnit());
        dto.setStockQty(supply.getStockQty());
        dto.setMinQty(supply.getMinQty());
        dto.setUnitCostCents(supply.getUnitCostCents());
        dto.setActive(supply.getIsActive());
        dto.setLowStock(isLowStock(supply));
        dto.setCreatedAt(supply.getCreatedAt() != null ? supply.getCreatedAt().toString() : null);
        return dto;
    }

    private boolean isLowStock(Supply supply) {
        return supply.getStockQty() <= supply.getMinQty();
    }

    private String normalizeRequired(String value, String message) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return normalized;
    }

    private int nonNegative(Integer value, String fieldName, int defaultValue) {
        int normalized = value == null ? defaultValue : value;
        if (normalized < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " phai >= 0");
        }
        return normalized;
    }

    private long nonNegativeLong(Long value, String fieldName, long defaultValue) {
        long normalized = value == null ? defaultValue : value;
        if (normalized < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " phai >= 0");
        }
        return normalized;
    }
}

package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.AssetDto;
import com.clinic.backend.modules.admin.entity.Asset;
import com.clinic.backend.modules.admin.entity.Room;
import com.clinic.backend.modules.admin.repository.AssetRepository;
import com.clinic.backend.modules.admin.repository.RoomRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AssetService {

    private static final Set<String> ALLOWED_STATUSES = Set.of("ACTIVE", "MAINTENANCE", "RETIRED");

    private final AssetRepository assetRepository;
    private final RoomRepository roomRepository;

    public AssetService(AssetRepository assetRepository, RoomRepository roomRepository) {
        this.assetRepository = assetRepository;
        this.roomRepository = roomRepository;
    }

    @Transactional(readOnly = true)
    public List<AssetDto> getAssets(String category, String status, String roomId) {
        String normalizedCategory = normalizeNullable(category);
        String normalizedStatus = normalizeUpperNullable(status);
        UUID roomUuid = parseOptionalUuid(roomId, "roomId");

        List<Asset> assets = assetRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        Map<UUID, String> roomNames = loadRoomNameMap(assets);

        return assets.stream()
            .filter(asset -> normalizedCategory == null
                || asset.getCategory().equalsIgnoreCase(normalizedCategory))
            .filter(asset -> normalizedStatus == null
                || asset.getStatus().equalsIgnoreCase(normalizedStatus))
            .filter(asset -> roomUuid == null || roomUuid.equals(asset.getRoomId()))
            .map(asset -> toDto(asset, roomNames.get(asset.getRoomId())))
            .collect(Collectors.toList());
    }

    @Transactional
    public AssetDto createAsset(String name,
                                String assetCode,
                                String category,
                                String roomId,
                                String purchaseDate,
                                Long purchasePriceCents,
                                String status,
                                String notes) {
        Asset asset = new Asset();
        asset.setName(normalizeRequired(name, "Tên tài sản là bắt buộc"));
        asset.setAssetCode(normalizeUniqueAssetCode(null, assetCode));
        asset.setCategory(normalizeRequired(category, "Danh mục là bắt buộc").toUpperCase());
        asset.setRoomId(parseOptionalRoom(roomId));
        asset.setPurchaseDate(parseOptionalDate(purchaseDate, "purchaseDate"));
        asset.setPurchasePriceCents(nonNegativeLong(purchasePriceCents, "purchasePriceCents", 0L));
        asset.setStatus(normalizeStatus(status));
        asset.setNotes(normalizeNullable(notes));

        Asset saved = assetRepository.save(asset);
        String roomName = resolveRoomName(saved.getRoomId());
        return toDto(saved, roomName);
    }

    @Transactional
    public AssetDto updateAsset(UUID id,
                                String name,
                                String assetCode,
                                String category,
                                String roomId,
                                String purchaseDate,
                                Long purchasePriceCents,
                                String status,
                                String notes) {
        Asset asset = assetRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài sản"));

        if (name != null) {
            asset.setName(normalizeRequired(name, "Tên tài sản không hợp lệ"));
        }
        if (assetCode != null) {
            asset.setAssetCode(normalizeUniqueAssetCode(id, assetCode));
        }
        if (category != null) {
            asset.setCategory(normalizeRequired(category, "Danh mục không hợp lệ").toUpperCase());
        }
        if (roomId != null) {
            asset.setRoomId(parseOptionalRoom(roomId));
        }
        if (purchaseDate != null) {
            asset.setPurchaseDate(parseOptionalDate(purchaseDate, "purchaseDate"));
        }
        if (purchasePriceCents != null) {
            asset.setPurchasePriceCents(nonNegativeLong(purchasePriceCents, "purchasePriceCents", 0L));
        }
        if (status != null) {
            asset.setStatus(normalizeStatus(status));
        }
        if (notes != null) {
            asset.setNotes(normalizeNullable(notes));
        }

        Asset saved = assetRepository.save(asset);
        String roomName = resolveRoomName(saved.getRoomId());
        return toDto(saved, roomName);
    }

    private AssetDto toDto(Asset asset, String roomName) {
        AssetDto dto = new AssetDto();
        dto.setId(asset.getId().toString());
        dto.setName(asset.getName());
        dto.setAssetCode(asset.getAssetCode());
        dto.setCategory(asset.getCategory());
        dto.setRoomId(asset.getRoomId() != null ? asset.getRoomId().toString() : null);
        dto.setRoomName(roomName);
        dto.setPurchaseDate(asset.getPurchaseDate() != null ? asset.getPurchaseDate().toString() : null);
        dto.setPurchasePriceCents(asset.getPurchasePriceCents());
        dto.setStatus(asset.getStatus());
        dto.setNotes(asset.getNotes());
        dto.setCreatedAt(asset.getCreatedAt() != null ? asset.getCreatedAt().toString() : null);
        return dto;
    }

    private Map<UUID, String> loadRoomNameMap(List<Asset> assets) {
        Set<UUID> roomIds = assets.stream()
            .map(Asset::getRoomId)
            .filter(roomId -> roomId != null)
            .collect(Collectors.toSet());

        if (roomIds.isEmpty()) {
            return Map.of();
        }

        return roomRepository.findAllById(roomIds).stream()
            .collect(Collectors.toMap(Room::getId, Room::getName, (left, _right) -> left));
    }

    private String resolveRoomName(UUID roomId) {
        if (roomId == null) {
            return null;
        }
        return roomRepository.findById(roomId).map(Room::getName).orElse(null);
    }

    private UUID parseOptionalRoom(String roomId) {
        UUID roomUuid = parseOptionalUuid(roomId, "roomId");
        if (roomUuid != null && !roomRepository.existsById(roomUuid)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roomId không tồn tại");
        }
        return roomUuid;
    }

    private UUID parseOptionalUuid(String value, String fieldName) {
        String normalized = normalizeNullable(value);
        if (normalized == null) {
            return null;
        }
        try {
            return UUID.fromString(normalized);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không hợp lệ");
        }
    }

    private LocalDate parseOptionalDate(String value, String fieldName) {
        String normalized = normalizeNullable(value);
        if (normalized == null) {
            return null;
        }
        try {
            return LocalDate.parse(normalized);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " không hợp lệ");
        }
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

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeUpperNullable(String value) {
        String normalized = normalizeNullable(value);
        return normalized == null ? null : normalized.toUpperCase();
    }

    private String normalizeStatus(String status) {
        String normalized = normalizeUpperNullable(status);
        if (normalized == null) {
            return "ACTIVE";
        }
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status không hợp lệ");
        }
        return normalized;
    }

    private long nonNegativeLong(Long value, String fieldName, long defaultValue) {
        long normalized = value == null ? defaultValue : value;
        if (normalized < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " phải >= 0");
        }
        return normalized;
    }

    private String normalizeUniqueAssetCode(UUID currentId, String assetCode) {
        String normalized = normalizeNullable(assetCode);
        if (normalized == null) {
            return null;
        }

        boolean exists = currentId == null
            ? assetRepository.findByAssetCodeIgnoreCase(normalized).isPresent()
            : assetRepository.findByAssetCodeIgnoreCaseAndIdNot(normalized, currentId).isPresent();
        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "assetCode đã tồn tại");
        }

        return normalized;
    }
}

package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.RoomDto;
import com.clinic.backend.modules.admin.entity.Room;
import com.clinic.backend.modules.admin.repository.RoomRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class RoomService {

    private static final Set<String> ALLOWED_STATUSES = Set.of("ACTIVE", "INACTIVE", "MAINTENANCE");

    private final RoomRepository roomRepository;

    @PersistenceContext
    private EntityManager em;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<RoomDto> getRooms(String status, String roomType) {
        String normalizedStatus = normalizeOptionalUpper(status);
        String normalizedRoomType = normalizeOptionalUpper(roomType);

        List<Object[]> rows = em.createNativeQuery(
            "SELECT " +
                "r.id::text, r.code, r.name, r.area, r.room_type, r.status, r.created_at, " +
                "COUNT(a.id) AS asset_count " +
            "FROM rooms r " +
            "LEFT JOIN assets a ON a.room_id = r.id " +
            "WHERE (:status IS NULL OR upper(r.status) = :status) " +
              "AND (:roomType IS NULL OR upper(r.room_type) = :roomType) " +
            "GROUP BY r.id, r.code, r.name, r.area, r.room_type, r.status, r.created_at " +
            "ORDER BY r.code")
            .setParameter("status", normalizedStatus)
            .setParameter("roomType", normalizedRoomType)
            .getResultList();

        List<RoomDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            result.add(toDto(row));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public RoomDto getRoom(UUID id) {
        return fetchRoomDtoById(id);
    }

    @Transactional
    public RoomDto createRoom(String code, String name, String area, String roomType, String status) {
        String normalizedCode = normalizeRequired(code, "Ma phong la bat buoc").toUpperCase();
        String normalizedName = normalizeRequired(name, "Ten phong la bat buoc");
        String normalizedRoomType = normalizeRequired(roomType, "Loai phong la bat buoc").toUpperCase();
        String normalizedStatus = normalizeStatus(status);

        if (roomRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ma phong da ton tai");
        }

        Room room = new Room();
        room.setCode(normalizedCode);
        room.setName(normalizedName);
        room.setArea(normalizeNullable(area));
        room.setRoomType(normalizedRoomType);
        room.setStatus(normalizedStatus);
        Room saved = roomRepository.saveAndFlush(room);

        return fetchRoomDtoById(saved.getId());
    }

    @Transactional
    public RoomDto updateRoom(UUID id, String code, String name, String area, String roomType, String status) {
        Room room = roomRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay phong"));

        if (code != null) {
            String normalizedCode = normalizeRequired(code, "Ma phong khong hop le").toUpperCase();
            if (!normalizedCode.equalsIgnoreCase(room.getCode())
                && roomRepository.existsByCodeIgnoreCaseAndIdNot(normalizedCode, id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Ma phong da ton tai");
            }
            room.setCode(normalizedCode);
        }

        if (name != null) {
            room.setName(normalizeRequired(name, "Ten phong khong hop le"));
        }

        if (area != null) {
            room.setArea(normalizeNullable(area));
        }

        if (roomType != null) {
            room.setRoomType(normalizeRequired(roomType, "Loai phong khong hop le").toUpperCase());
        }

        if (status != null) {
            room.setStatus(normalizeStatus(status));
        }

        roomRepository.saveAndFlush(room);
        return fetchRoomDtoById(id);
    }

    @Transactional
    public RoomDto toggleActive(UUID id) {
        Room room = roomRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay phong"));

        String current = room.getStatus() == null ? "ACTIVE" : room.getStatus().toUpperCase();
        room.setStatus("ACTIVE".equals(current) ? "INACTIVE" : "ACTIVE");
        roomRepository.saveAndFlush(room);
        return fetchRoomDtoById(id);
    }

    @SuppressWarnings("unchecked")
    private RoomDto fetchRoomDtoById(UUID id) {
        List<Object[]> rows = em.createNativeQuery(
            "SELECT " +
                "r.id::text, r.code, r.name, r.area, r.room_type, r.status, r.created_at, " +
                "COUNT(a.id) AS asset_count " +
            "FROM rooms r " +
            "LEFT JOIN assets a ON a.room_id = r.id " +
            "WHERE r.id = :id " +
            "GROUP BY r.id, r.code, r.name, r.area, r.room_type, r.status, r.created_at")
            .setParameter("id", id)
            .getResultList();

        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay phong");
        }

        return toDto(rows.get(0));
    }

    private RoomDto toDto(Object[] row) {
        RoomDto dto = new RoomDto();
        dto.setId(row[0].toString());
        dto.setCode(row[1].toString());
        dto.setName(row[2].toString());
        dto.setArea(row[3] != null ? row[3].toString() : null);
        dto.setRoomType(row[4].toString());
        dto.setStatus(row[5].toString());
        dto.setCreatedAt(row[6].toString());
        dto.setAssetCount(((Number) row[7]).intValue());
        return dto;
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

    private String normalizeOptionalUpper(String value) {
        String normalized = normalizeNullable(value);
        return normalized == null ? null : normalized.toUpperCase();
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "ACTIVE";
        }

        String normalized = status.trim().toUpperCase();
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trang thai phong khong hop le");
        }
        return normalized;
    }
}

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
    public List<RoomDto> getRooms(String status, String serviceId) {
        String normalizedStatus = normalizeOptionalUpper(status);
        UUID serviceUuid = parseOptionalUuid(serviceId, "serviceId");

        StringBuilder sql = new StringBuilder(
            "SELECT " +
                "r.id, r.code, r.name, r.area, r.room_type, r.service_id, sv.name, r.status, r.created_at, " +
                "COUNT(a.id) AS asset_count " +
            "FROM rooms r " +
            "LEFT JOIN services sv ON sv.id = r.service_id " +
            "LEFT JOIN assets a ON a.room_id = r.id " +
            "WHERE 1=1 ");

        if (normalizedStatus != null) {
            sql.append("AND upper(r.status) = :status ");
        }
        if (serviceUuid != null) {
            sql.append("AND r.service_id = :serviceId ");
        }

        sql.append(
            "GROUP BY r.id, r.code, r.name, r.area, r.room_type, r.service_id, sv.name, r.status, r.created_at " +
            "ORDER BY r.code");

        var query = em.createNativeQuery(sql.toString());
        if (normalizedStatus != null) {
            query.setParameter("status", normalizedStatus);
        }
        if (serviceUuid != null) {
            query.setParameter("serviceId", serviceUuid);
        }

        List<Object[]> rows = query.getResultList();

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
    public RoomDto createRoom(String code, String name, String serviceId, String status) {
        String normalizedCode = normalizeRequired(code, "Ma phong la bat buoc").toUpperCase();
        String normalizedName = normalizeRequired(name, "Ten phong la bat buoc");
        UUID serviceUuid = parseUuid(serviceId, "serviceId");
        String normalizedStatus = normalizeStatus(status);

        if (roomRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ma phong da ton tai");
        }

        String derivedRoomType = deriveRoomTypeFromService(serviceUuid);

        Room room = new Room();
        room.setCode(normalizedCode);
        room.setName(normalizedName);
        room.setArea(null);
        room.setServiceId(serviceUuid);
        room.setRoomType(derivedRoomType);
        room.setStatus(normalizedStatus);
        Room saved = roomRepository.saveAndFlush(room);

        return fetchRoomDtoById(saved.getId());
    }

    @Transactional
    public RoomDto updateRoom(UUID id, String code, String name, String serviceId, String status) {
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

        if (serviceId != null) {
            UUID serviceUuid = parseUuid(serviceId, "serviceId");
            room.setServiceId(serviceUuid);
            room.setRoomType(deriveRoomTypeFromService(serviceUuid));
            room.setArea(null);
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
                "r.id, r.code, r.name, r.area, r.room_type, r.service_id, sv.name, r.status, r.created_at, " +
                "COUNT(a.id) AS asset_count " +
            "FROM rooms r " +
            "LEFT JOIN services sv ON sv.id = r.service_id " +
            "LEFT JOIN assets a ON a.room_id = r.id " +
            "WHERE r.id = :id " +
            "GROUP BY r.id, r.code, r.name, r.area, r.room_type, r.service_id, sv.name, r.status, r.created_at")
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
        dto.setServiceId(row[5] != null ? row[5].toString() : null);
        dto.setServiceName(row[6] != null ? row[6].toString() : null);
        dto.setStatus(row[7].toString());
        dto.setCreatedAt(row[8].toString());
        dto.setAssetCount(((Number) row[9]).intValue());
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

    private UUID parseUuid(String value, String fieldName) {
        String normalized = normalizeRequired(value, fieldName + " la bat buoc");
        try {
            return UUID.fromString(normalized);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " khong hop le");
        }
    }

    private UUID parseOptionalUuid(String value, String fieldName) {
        String normalized = normalizeNullable(value);
        if (normalized == null) {
            return null;
        }
        try {
            return UUID.fromString(normalized);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " khong hop le");
        }
    }

    @SuppressWarnings("unchecked")
    private String deriveRoomTypeFromService(UUID serviceId) {
        List<Object[]> rows = em.createNativeQuery(
                "SELECT sv.name, dep.name " +
                "FROM services sv " +
                "LEFT JOIN departments dep ON dep.id = sv.specialty_id " +
                "WHERE sv.id = :serviceId")
            .setParameter("serviceId", serviceId)
            .getResultList();

        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Dich vu khong ton tai");
        }

        String departmentName = rows.get(0)[1] != null ? rows.get(0)[1].toString().trim() : "";
        String serviceName = rows.get(0)[0] != null ? rows.get(0)[0].toString().trim() : "";
        String source = !departmentName.isEmpty() ? departmentName : serviceName;
        if (source.isEmpty()) {
            return "SERVICE";
        }
        return source.toUpperCase().replace(' ', '_');
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

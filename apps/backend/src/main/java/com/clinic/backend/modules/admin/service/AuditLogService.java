package com.clinic.backend.modules.admin.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
public class AuditLogService {

    @PersistenceContext
    private EntityManager em;

    private final ObjectMapper objectMapper;

    public AuditLogService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void log(String action, String entityType, UUID entityId, Map<String, Object> meta) {
        String metaJson = toJson(meta);

        em.createNativeQuery("""
                INSERT INTO audit_logs (
                    id, actor_user_id, action, entity_type, entity_id, meta_json, created_at
                ) VALUES (
                    gen_random_uuid(),
                    :actorUserId,
                    :action,
                    :entityType,
                    :entityId,
                    CAST(:metaJson AS jsonb),
                    now()
                )
                """)
            .setParameter("actorUserId", getCurrentActorUserIdOrNull())
            .setParameter("action", action)
            .setParameter("entityType", entityType)
            .setParameter("entityId", entityId != null ? entityId.toString() : null)
            .setParameter("metaJson", metaJson)
            .executeUpdate();
    }

    public UUID getCurrentActorUserIdOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UUID uuid) {
            return uuid;
        }

        if (principal instanceof String raw) {
            try {
                return UUID.fromString(raw);
            } catch (IllegalArgumentException ignored) {
                return null;
            }
        }
        return null;
    }

    private String toJson(Map<String, Object> meta) {
        Map<String, Object> safeMeta = meta == null ? Map.of() : meta;
        try {
            return objectMapper.writeValueAsString(safeMeta);
        } catch (JsonProcessingException ex) {
            return "{}";
        }
    }
}

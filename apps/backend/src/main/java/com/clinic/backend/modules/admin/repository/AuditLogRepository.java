package com.clinic.backend.modules.admin.repository;

import com.clinic.backend.modules.admin.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("""
        SELECT a FROM AuditLog a
        LEFT JOIN FETCH a.actorUser
        WHERE a.createdAt >= :from AND a.createdAt < :to
        ORDER BY a.createdAt DESC
        """)
    List<AuditLog> findByDateRange(@Param("from") Instant from, @Param("to") Instant to);

    @Query("""
        SELECT a FROM AuditLog a
        LEFT JOIN FETCH a.actorUser
        WHERE a.createdAt >= :from AND a.createdAt < :to
        AND (:entityType IS NULL OR a.entityType = :entityType)
        ORDER BY a.createdAt DESC
        """)
    List<AuditLog> findByDateRangeAndEntityType(
            @Param("from") Instant from,
            @Param("to") Instant to,
            @Param("entityType") String entityType);
}

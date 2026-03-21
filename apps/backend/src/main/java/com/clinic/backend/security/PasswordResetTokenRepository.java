package com.clinic.backend.security;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findFirstByPhoneOrderByCreatedAtDesc(String phone);
    void deleteByPhone(String phone);
}

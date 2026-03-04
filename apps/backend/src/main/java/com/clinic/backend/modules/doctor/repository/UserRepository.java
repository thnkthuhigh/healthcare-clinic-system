package com.clinic.backend.modules.doctor.repository;

import com.clinic.backend.modules.doctor.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    Optional<User> findByPhone(String phone);
    
    boolean existsByPhone(String phone);
    
    boolean existsByRole(User.UserRole role);
}

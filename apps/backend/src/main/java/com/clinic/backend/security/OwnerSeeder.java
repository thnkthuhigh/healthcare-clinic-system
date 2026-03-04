package com.clinic.backend.security;

import com.clinic.backend.modules.doctor.entity.User;
import com.clinic.backend.modules.doctor.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Auto-seeds the OWNER user on application startup if one doesn't exist.
 * OWNER has full system access and cannot be deleted.
 */
@Component
public class OwnerSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(OwnerSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.owner.phone}")
    private String ownerPhone;

    @Value("${app.owner.password}")
    private String ownerPassword;

    public OwnerSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        boolean ownerExists = userRepository.existsByRole(User.UserRole.OWNER);

        if (!ownerExists) {
            User owner = new User();
            owner.setPhone(ownerPhone);
            owner.setPasswordHash(passwordEncoder.encode(ownerPassword));
            owner.setRole(User.UserRole.OWNER);
            owner.setStatus(User.AccountStatus.ACTIVE);

            userRepository.save(owner);
            log.info("✅ OWNER account created: phone={}", ownerPhone);
        } else {
            log.info("✅ OWNER account already exists, skipping seed.");
        }
    }
}

package com.clinic.backend.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Refreshes demo seed data to today's date on every server startup.
 * Calls the refresh_demo_data() PostgreSQL function defined in V9 migration.
 * This ensures shifts and bookings always appear as "today" during development.
 */
@Component
@Order(10) // Run after OwnerSeeder (which has default order)
public class DemoDataRefresher implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataRefresher.class);

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        try {
            String result = (String) entityManager
                    .createNativeQuery("SELECT refresh_demo_data()")
                    .getSingleResult();
            log.info("✅ Demo data refreshed: {}", result);
        } catch (Exception e) {
            // Function may not exist on first boot (before V9 runs) — safe to ignore
            log.warn("⚠️  Could not refresh demo data (safe to ignore on first boot): {}", e.getMessage());
        }
    }
}

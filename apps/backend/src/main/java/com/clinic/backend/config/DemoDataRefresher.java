package com.clinic.backend.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Refreshes demo seed data to today's date on server startup.
 * Disabled by default so real bookings keep their original shift dates.
 * Enable explicitly with APP_DEMO_REFRESH_ON_STARTUP=true when demo-only behavior is needed.
 */
@Component
@Order(10)
@ConditionalOnProperty(name = "app.demo.refresh-on-startup", havingValue = "true")
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
            log.info("Demo data refreshed: {}", result);
        } catch (Exception e) {
            log.warn("Could not refresh demo data (safe to ignore on first boot): {}", e.getMessage());
        }
    }
}

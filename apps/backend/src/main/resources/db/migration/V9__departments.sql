-- ============================================
-- V9: Department (Khoa) management
-- ============================================

CREATE TABLE departments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed common specialties (include ones already used in doctor seed data)
INSERT INTO departments (name) VALUES
    ('Nội tổng quát'),
    ('Tim mạch'),
    ('Nhi khoa'),
    ('Phụ sản'),
    ('Ngoại khoa'),
    ('Tai Mũi Họng'),
    ('Mắt'),
    ('Da liễu'),
    ('Thần kinh'),
    ('Cơ xương khớp'),
    ('Tiêu hóa'),
    ('Hô hấp'),
    ('Nội tiết'),
    ('Ung bướu'),
    ('Tâm thần');

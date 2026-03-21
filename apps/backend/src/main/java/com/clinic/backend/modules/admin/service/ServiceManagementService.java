package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.AdminServiceDto;
import com.clinic.backend.modules.admin.dto.CreateServiceRequest;
import com.clinic.backend.modules.admin.dto.UpdateServiceRequest;
import com.clinic.backend.modules.admin.repository.DepartmentRepository;
import com.clinic.backend.modules.doctor.entity.Service;
import com.clinic.backend.modules.doctor.repository.ServiceRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@org.springframework.stereotype.Service
public class ServiceManagementService {

    private final ServiceRepository serviceRepository;
    private final DepartmentRepository departmentRepository;

    @PersistenceContext
    private EntityManager em;

    public ServiceManagementService(ServiceRepository serviceRepository,
                                    DepartmentRepository departmentRepository) {
        this.serviceRepository = serviceRepository;
        this.departmentRepository = departmentRepository;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<AdminServiceDto> getAllServices() {
        List<Object[]> rows = em.createNativeQuery(
                "SELECT s.id, s.name, s.price_cents, s.is_active, s.specialty_id, dep.name " +
                "FROM services s " +
                "LEFT JOIN departments dep ON dep.id = s.specialty_id " +
                "ORDER BY s.name")
            .getResultList();

        List<AdminServiceDto> result = new ArrayList<>();
        for (Object[] row : rows) {
            AdminServiceDto dto = new AdminServiceDto();
            dto.setId(row[0].toString());
            dto.setName(row[1].toString());
            dto.setPriceCents(((Number) row[2]).intValue());
            dto.setActive((Boolean) row[3]);
            dto.setSpecialtyId(row[4] != null ? row[4].toString() : null);
            dto.setSpecialtyName(row[5] != null ? row[5].toString() : null);
            result.add(dto);
        }
        return result;
    }

    @Transactional
    public AdminServiceDto createService(CreateServiceRequest request) {
        if (serviceRepository.existsByName(request.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ten dich vu da ton tai");
        }
        UUID specialtyId = parseOptionalDepartmentId(request.getSpecialtyId());

        Service service = new Service();
        service.setName(request.getName());
        service.setDurationMin(0);
        service.setPriceCents(request.getPriceCents());
        service.setIsActive(true);
        service.setSpecialtyId(specialtyId);
        return toDto(serviceRepository.save(service));
    }

    @Transactional
    public AdminServiceDto updateService(UUID id, UpdateServiceRequest request) {
        Service service = serviceRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay dich vu"));
        if (request.getName() != null && !request.getName().isBlank()) {
            if (!request.getName().equals(service.getName()) &&
                    serviceRepository.existsByName(request.getName())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Ten dich vu da ton tai");
            }
            service.setName(request.getName());
        }
        if (request.getPriceCents() != null) service.setPriceCents(request.getPriceCents());
        if (request.getSpecialtyId() != null) {
            service.setSpecialtyId(parseOptionalDepartmentId(request.getSpecialtyId()));
        }
        return toDto(serviceRepository.save(service));
    }

    @Transactional
    public AdminServiceDto toggleActive(UUID id) {
        Service service = serviceRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay dich vu"));
        service.setIsActive(!service.getIsActive());
        return toDto(serviceRepository.save(service));
    }

    @SuppressWarnings("unchecked")
    private AdminServiceDto toDto(Service service) {
        AdminServiceDto dto = new AdminServiceDto();
        dto.setId(service.getId().toString());
        dto.setName(service.getName());
        dto.setPriceCents(service.getPriceCents());
        dto.setActive(service.getIsActive());

        List<Object[]> rows = em.createNativeQuery(
                "SELECT s.specialty_id, dep.name " +
                "FROM services s LEFT JOIN departments dep ON dep.id = s.specialty_id " +
                "WHERE s.id = :serviceId")
            .setParameter("serviceId", service.getId())
            .getResultList();
        if (!rows.isEmpty()) {
            Object[] row = rows.get(0);
            dto.setSpecialtyId(row[0] != null ? row[0].toString() : null);
            dto.setSpecialtyName(row[1] != null ? row[1].toString() : null);
        }

        return dto;
    }

    private UUID parseOptionalDepartmentId(String specialtyId) {
        if (specialtyId == null || specialtyId.isBlank()) {
            return null;
        }

        final UUID specialtyUuid;
        try {
            specialtyUuid = UUID.fromString(specialtyId.trim());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "specialtyId khong hop le");
        }

        if (!departmentRepository.existsById(specialtyUuid)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "specialtyId khong ton tai");
        }

        return specialtyUuid;
    }
}

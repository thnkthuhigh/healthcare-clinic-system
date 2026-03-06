package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.dto.AdminServiceDto;
import com.clinic.backend.modules.admin.dto.CreateServiceRequest;
import com.clinic.backend.modules.admin.dto.UpdateServiceRequest;
import com.clinic.backend.modules.doctor.entity.Service;
import com.clinic.backend.modules.doctor.repository.ServiceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
public class ServiceManagementService {

    private final ServiceRepository serviceRepository;

    public ServiceManagementService(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminServiceDto> getAllServices() {
        return serviceRepository.findAllByOrderByNameAsc().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    @Transactional
    public AdminServiceDto createService(CreateServiceRequest request) {
        if (serviceRepository.existsByName(request.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên dịch vụ đã tồn tại");
        }
        Service service = new Service();
        service.setName(request.getName());
        service.setDurationMin(request.getDurationMin());
        service.setPriceCents(request.getPriceCents());
        service.setIsActive(true);
        return toDto(serviceRepository.save(service));
    }

    @Transactional
    public AdminServiceDto updateService(UUID id, UpdateServiceRequest request) {
        Service service = serviceRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy dịch vụ"));
        if (request.getName() != null && !request.getName().isBlank()) {
            if (!request.getName().equals(service.getName()) &&
                    serviceRepository.existsByName(request.getName())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên dịch vụ đã tồn tại");
            }
            service.setName(request.getName());
        }
        if (request.getDurationMin() != null) service.setDurationMin(request.getDurationMin());
        if (request.getPriceCents() != null) service.setPriceCents(request.getPriceCents());
        return toDto(serviceRepository.save(service));
    }

    @Transactional
    public AdminServiceDto toggleActive(UUID id) {
        Service service = serviceRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy dịch vụ"));
        service.setIsActive(!service.getIsActive());
        return toDto(serviceRepository.save(service));
    }

    private AdminServiceDto toDto(Service service) {
        AdminServiceDto dto = new AdminServiceDto();
        dto.setId(service.getId().toString());
        dto.setName(service.getName());
        dto.setDurationMin(service.getDurationMin());
        dto.setPriceCents(service.getPriceCents());
        dto.setActive(service.getIsActive());
        return dto;
    }
}

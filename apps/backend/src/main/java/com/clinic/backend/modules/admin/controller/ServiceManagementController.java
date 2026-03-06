package com.clinic.backend.modules.admin.controller;

import com.clinic.backend.modules.admin.dto.AdminServiceDto;
import com.clinic.backend.modules.admin.dto.CreateServiceRequest;
import com.clinic.backend.modules.admin.dto.UpdateServiceRequest;
import com.clinic.backend.modules.admin.service.ServiceManagementService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/services")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class ServiceManagementController {

    private final ServiceManagementService serviceManagementService;

    public ServiceManagementController(ServiceManagementService serviceManagementService) {
        this.serviceManagementService = serviceManagementService;
    }

    /** GET /api/v1/admin/services */
    @GetMapping
    public List<AdminServiceDto> getServices() {
        return serviceManagementService.getAllServices();
    }

    /** POST /api/v1/admin/services */
    @PostMapping
    public AdminServiceDto createService(@Valid @RequestBody CreateServiceRequest request) {
        return serviceManagementService.createService(request);
    }

    /** PATCH /api/v1/admin/services/{id} */
    @PatchMapping("/{id}")
    public AdminServiceDto updateService(@PathVariable UUID id,
                                         @RequestBody UpdateServiceRequest request) {
        return serviceManagementService.updateService(id, request);
    }

    /** POST /api/v1/admin/services/{id}/toggle */
    @PostMapping("/{id}/toggle")
    public AdminServiceDto toggleActive(@PathVariable UUID id) {
        return serviceManagementService.toggleActive(id);
    }
}

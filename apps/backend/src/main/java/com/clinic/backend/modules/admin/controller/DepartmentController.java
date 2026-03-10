package com.clinic.backend.modules.admin.controller;

import com.clinic.backend.modules.admin.entity.Department;
import com.clinic.backend.modules.admin.service.DepartmentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/departments")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    record DepartmentDto(UUID id, String name, String createdAt) {
        static DepartmentDto from(Department d) {
            return new DepartmentDto(d.getId(), d.getName(), d.getCreatedAt().toString());
        }
    }

    record NameRequest(@NotBlank String name) {}

    @GetMapping
    public List<DepartmentDto> list() {
        return departmentService.getAllDepartments().stream()
                .map(DepartmentDto::from)
                .toList();
    }

    @PostMapping
    public DepartmentDto create(@Valid @RequestBody NameRequest req) {
        return DepartmentDto.from(departmentService.createDepartment(req.name()));
    }

    @PutMapping("/{id}")
    public DepartmentDto rename(@PathVariable UUID id, @Valid @RequestBody NameRequest req) {
        return DepartmentDto.from(departmentService.renameDepartment(id, req.name()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable UUID id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa khoa"));
    }
}

package com.clinic.backend.modules.admin.service;

import com.clinic.backend.modules.admin.entity.Department;
import com.clinic.backend.modules.admin.repository.DepartmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @Transactional(readOnly = true)
    public List<Department> getAllDepartments() {
        return departmentRepository.findAllByOrderByNameAsc();
    }

    @Transactional
    public Department createDepartment(String name) {
        String trimmed = name.trim();
        if (departmentRepository.existsByName(trimmed)) {
            throw new IllegalArgumentException("Khoa \"" + trimmed + "\" đã tồn tại");
        }
        Department dept = new Department();
        dept.setName(trimmed);
        return departmentRepository.save(dept);
    }

    @Transactional
    public Department renameDepartment(UUID id, String newName) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khoa"));
        String trimmed = newName.trim();
        if (departmentRepository.existsByNameAndIdNot(trimmed, id)) {
            throw new IllegalArgumentException("Khoa \"" + trimmed + "\" đã tồn tại");
        }
        dept.setName(trimmed);
        return departmentRepository.save(dept);
    }

    @Transactional
    public void deleteDepartment(UUID id) {
        if (!departmentRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy khoa");
        }
        departmentRepository.deleteById(id);
    }
}

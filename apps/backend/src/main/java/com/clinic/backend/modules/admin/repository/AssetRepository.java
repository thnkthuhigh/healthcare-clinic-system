package com.clinic.backend.modules.admin.repository;

import com.clinic.backend.modules.admin.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AssetRepository extends JpaRepository<Asset, UUID> {

    Optional<Asset> findByAssetCodeIgnoreCase(String assetCode);

    Optional<Asset> findByAssetCodeIgnoreCaseAndIdNot(String assetCode, UUID id);
}

package com.healthapp.healthcare_monitoring_system.inventory.repository;

import com.healthapp.healthcare_monitoring_system.inventory.entity.MedicineInventoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MedicineInventoryRepository extends JpaRepository<MedicineInventoryEntity, Long> {

    List<MedicineInventoryEntity> findByUserId(Long userId);

    Optional<MedicineInventoryEntity> findByIdAndUserId(Long id, Long userId);

    Optional<MedicineInventoryEntity> findByMedicineIdAndUserId(Long medicineId, Long userId);

    boolean existsByMedicineIdAndUserId(Long medicineId, Long userId);

    // system-wide (not user-scoped) — used by the daily "expiring soon" notification job
    List<MedicineInventoryEntity> findByExpiryDateBetween(LocalDate from, LocalDate to);
}
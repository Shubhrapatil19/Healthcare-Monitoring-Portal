package com.healthapp.healthcare_monitoring_system.medicine.repository;

import com.healthapp.healthcare_monitoring_system.medicine.entity.MedicineEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MedicineRepository extends JpaRepository<MedicineEntity, Long> {

    List<MedicineEntity> findByUserId(Long userId);

    Optional<MedicineEntity> findByIdAndUserId(Long medicineId, Long userId);

    boolean existsByIdAndUserId(Long medicineId, Long userId);

    List<MedicineEntity> findByStartDateLessThanEqualAndEndDateGreaterThanEqual(
            LocalDate date1, LocalDate date2
    );
}
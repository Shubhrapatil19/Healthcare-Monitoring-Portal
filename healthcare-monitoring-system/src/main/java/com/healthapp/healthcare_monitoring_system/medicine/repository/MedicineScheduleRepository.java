package com.healthapp.healthcare_monitoring_system.medicine.repository;

import com.healthapp.healthcare_monitoring_system.medicine.entity.MedicineScheduleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicineScheduleRepository
        extends JpaRepository<MedicineScheduleEntity, Long> {

    List<MedicineScheduleEntity> findByMedicineId(Long medicineId);
}
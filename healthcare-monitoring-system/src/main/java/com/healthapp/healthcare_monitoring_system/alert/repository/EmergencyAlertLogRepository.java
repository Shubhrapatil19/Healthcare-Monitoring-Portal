package com.healthapp.healthcare_monitoring_system.alert.repository;

import com.healthapp.healthcare_monitoring_system.alert.entity.EmergencyAlertLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmergencyAlertLogRepository extends JpaRepository<EmergencyAlertLogEntity, Long> {

    List<EmergencyAlertLogEntity> findByUserIdOrderBySentAtDesc(Long userId);
}

package com.healthapp.healthcare_monitoring_system.alert.repository;

import com.healthapp.healthcare_monitoring_system.alert.entity.AlertEntity;
import com.healthapp.healthcare_monitoring_system.alert.enums.AlertStatus;
import com.healthapp.healthcare_monitoring_system.alert.enums.AlertType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AlertRepository extends JpaRepository<AlertEntity, Long> {

    List<AlertEntity> findByUserIdOrderByAlertTimeDesc(Long userId);

    List<AlertEntity> findByUserIdAndAlertTypeOrderByAlertTimeDesc(Long userId, AlertType alertType);

    Optional<AlertEntity> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndMedicineIdAndAlertTypeAndAlertTimeAfter(
            Long userId, Long medicineId, AlertType alertType, LocalDateTime after);

    long countByUserIdAndStatus(Long userId, AlertStatus status);

    // NEW — system-wide — used by the SMS escalation job to find MISSED_DOSE alerts that
    // are still unacknowledged and haven't already escalated all the way to contact 2
    List<AlertEntity> findByAlertTypeAndAcknowledgedFalseAndEscalationLevelLessThanAndSmsSentAtIsNotNull(
            AlertType alertType, int escalationLevel);
}
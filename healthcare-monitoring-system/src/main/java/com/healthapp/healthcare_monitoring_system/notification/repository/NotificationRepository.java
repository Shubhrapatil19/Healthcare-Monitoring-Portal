package com.healthapp.healthcare_monitoring_system.notification.repository;

import com.healthapp.healthcare_monitoring_system.notification.entity.NotificationEntity;
import com.healthapp.healthcare_monitoring_system.notification.enums.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    List<NotificationEntity> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<NotificationEntity> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, NotificationStatus status);

    Optional<NotificationEntity> findByIdAndUserId(Long id, Long userId);

    long countByUserIdAndStatus(Long userId, NotificationStatus status);

    // dedupe check used for auto-generated notifications (reminder-due, expiring-soon)
    // so the same event doesn't spam multiple rows within a short window
    boolean existsByUserIdAndTitleAndMessageAndCreatedAtAfter(
            Long userId, String title, String message, LocalDateTime after);

    void deleteByUserId(Long userId);
}
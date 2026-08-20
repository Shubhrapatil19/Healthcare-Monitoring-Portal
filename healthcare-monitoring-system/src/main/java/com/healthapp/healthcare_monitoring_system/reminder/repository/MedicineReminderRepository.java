package com.healthapp.healthcare_monitoring_system.reminder.repository;

import com.healthapp.healthcare_monitoring_system.reminder.entity.MedicineReminderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MedicineReminderRepository extends JpaRepository<MedicineReminderEntity, Long> {

    Optional<MedicineReminderEntity> findByIdAndUserId(Long id, Long userId);

    List<MedicineReminderEntity> findByUserIdAndDoseLog_ScheduledDate(Long userId, LocalDate scheduledDate);

    List<MedicineReminderEntity> findByUserIdOrderByReminderTimeDesc(Long userId);

    boolean existsByDoseLogId(Long doseLogId);
}
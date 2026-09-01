package com.healthapp.healthcare_monitoring_system.reminder.repository;

import com.healthapp.healthcare_monitoring_system.reminder.entity.MedicineReminderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MedicineReminderRepository extends JpaRepository<MedicineReminderEntity, Long> {

    Optional<MedicineReminderEntity> findByIdAndUserId(Long id, Long userId);

    List<MedicineReminderEntity> findByUserIdAndDoseLog_ScheduledDate(Long userId, LocalDate scheduledDate);

    List<MedicineReminderEntity> findByUserIdOrderByReminderTimeDesc(Long userId);

    boolean existsByDoseLogId(Long doseLogId);

    Optional<MedicineReminderEntity> findByDoseLogId(Long doseLogId);

    // system-wide (not user-scoped) — used by the "reminder due -> notify" scheduled job
    List<MedicineReminderEntity> findByStatusAndReminderTimeLessThanEqual(String status, LocalDateTime now);

    // NEW — system-wide — used by the SMS escalation job to find reminders whose patient
    // SMS is still unactioned (status still PENDING, an SMS was sent, and we haven't
    // already escalated all the way to contact 2)
    List<MedicineReminderEntity> findByStatusAndEscalationLevelLessThanAndSmsSentAtIsNotNull(
            String status, int escalationLevel);
}
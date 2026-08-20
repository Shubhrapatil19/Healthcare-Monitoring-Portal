package com.healthapp.healthcare_monitoring_system.dose.repository;

import com.healthapp.healthcare_monitoring_system.dose.entity.MedicineDoseLogEntity;
import com.healthapp.healthcare_monitoring_system.dose.enums.DoseStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MedicineDoseLogRepository extends JpaRepository<MedicineDoseLogEntity, Long> {

    List<MedicineDoseLogEntity> findByUserIdAndScheduledDate(Long userId, LocalDate scheduledDate);

    Optional<MedicineDoseLogEntity> findByIdAndUserId(Long id, Long userId);

    boolean existsByMedicineIdAndScheduleIdAndScheduledDate(
            Long medicineId, Long scheduleId, LocalDate scheduledDate);

    List<MedicineDoseLogEntity> findByUserIdAndScheduledDateBetween(
            Long userId, LocalDate start, LocalDate end);

    List<MedicineDoseLogEntity> findByStatusAndScheduledDateBefore(
            DoseStatus status, LocalDate date);

    List<MedicineDoseLogEntity> findByScheduledDateAndStatus(
            LocalDate date, DoseStatus status);

    long countByUserIdAndScheduledDate(Long userId, LocalDate scheduledDate);

    long countByUserIdAndScheduledDateAndStatus(
            Long userId, LocalDate scheduledDate, DoseStatus status);
}
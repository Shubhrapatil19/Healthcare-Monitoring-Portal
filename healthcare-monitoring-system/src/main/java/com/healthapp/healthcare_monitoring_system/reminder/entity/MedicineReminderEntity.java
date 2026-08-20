package com.healthapp.healthcare_monitoring_system.reminder.entity;

import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import com.healthapp.healthcare_monitoring_system.dose.entity.MedicineDoseLogEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "medicine_reminder")
@Getter
@Setter
public class MedicineReminderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dose_log_id", nullable = false)
    private MedicineDoseLogEntity doseLog;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private RegisterEntity user;

    @Column(name = "reminder_time", nullable = false)
    private LocalDateTime reminderTime;

    // PENDING, TAKEN, MISSED (matches chk_reminder_status in your schema)
    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "snooze_until")
    private LocalDateTime snoozeUntil;

    @Column(name = "snooze_count", nullable = false)
    private int snoozeCount = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
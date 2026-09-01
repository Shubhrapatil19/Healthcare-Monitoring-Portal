package com.healthapp.healthcare_monitoring_system.alert.entity;

import com.healthapp.healthcare_monitoring_system.alert.enums.RecipientType;
import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_alert_log")
@Getter
@Setter
public class EmergencyAlertLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private RegisterEntity user;

    @Enumerated(EnumType.STRING)
    @Column(name = "recipient_type", nullable = false, length = 20)
    private RecipientType recipientType;

    // human-readable label for the UI, e.g. "You", "Emergency Contact 1 (Mother)"
    @Column(name = "recipient_label", nullable = false, length = 100)
    private String recipientLabel;

    @Column(name = "recipient_phone", nullable = false, length = 20)
    private String recipientPhone;

    // "REMINDER" or "MISSED_DOSE_ALERT"
    @Column(name = "event_type", nullable = false, length = 30)
    private String eventType;

    @Column(name = "medicine_name", length = 150)
    private String medicineName;

    // "SENT" or "FAILED"
    @Column(name = "status", nullable = false, length = 10)
    private String status;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @PrePersist
    protected void onCreate() {
        if (sentAt == null) {
            sentAt = LocalDateTime.now();
        }
    }
}
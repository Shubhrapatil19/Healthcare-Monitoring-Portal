package com.healthapp.healthcare_monitoring_system.actiontoken.entity;

import com.healthapp.healthcare_monitoring_system.actiontoken.enums.ActionType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "action_token")
@Getter
@Setter
public class ActionTokenEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token", nullable = false, unique = true, length = 64)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 20)
    private ActionType actionType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used", nullable = false)
    private boolean used = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
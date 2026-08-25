package com.healthapp.healthcare_monitoring_system.notification.dto;

import com.healthapp.healthcare_monitoring_system.notification.enums.NotificationStatus;
import com.healthapp.healthcare_monitoring_system.notification.enums.NotificationType;

import java.time.LocalDateTime;

public class NotificationResponseDto {

    private Long id;
    private NotificationType type;
    private String title;
    private String message;
    private NotificationStatus status;
    private LocalDateTime createdAt;

    public NotificationResponseDto() {
    }

    public NotificationResponseDto(Long id, NotificationType type, String title, String message,
                                   NotificationStatus status, LocalDateTime createdAt) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.message = message;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public NotificationStatus getStatus() { return status; }
    public void setStatus(NotificationStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
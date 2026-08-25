package com.healthapp.healthcare_monitoring_system.alert.dto;

import com.healthapp.healthcare_monitoring_system.alert.enums.AlertStatus;
import com.healthapp.healthcare_monitoring_system.alert.enums.AlertType;

import java.time.LocalDateTime;

public class AlertResponseDto {

    private Long id;
    private String medicineName;
    private AlertType alertType;
    private Integer currentStock;
    private Integer minimumStock;
    private String message;
    private AlertStatus status;
    private LocalDateTime alertTime;

    public AlertResponseDto() {
    }

    public AlertResponseDto(Long id, String medicineName, AlertType alertType, Integer currentStock,
                            Integer minimumStock, String message, AlertStatus status, LocalDateTime alertTime) {
        this.id = id;
        this.medicineName = medicineName;
        this.alertType = alertType;
        this.currentStock = currentStock;
        this.minimumStock = minimumStock;
        this.message = message;
        this.status = status;
        this.alertTime = alertTime;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public AlertType getAlertType() { return alertType; }
    public void setAlertType(AlertType alertType) { this.alertType = alertType; }

    public Integer getCurrentStock() { return currentStock; }
    public void setCurrentStock(Integer currentStock) { this.currentStock = currentStock; }

    public Integer getMinimumStock() { return minimumStock; }
    public void setMinimumStock(Integer minimumStock) { this.minimumStock = minimumStock; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public AlertStatus getStatus() { return status; }
    public void setStatus(AlertStatus status) { this.status = status; }

    public LocalDateTime getAlertTime() { return alertTime; }
    public void setAlertTime(LocalDateTime alertTime) { this.alertTime = alertTime; }
}
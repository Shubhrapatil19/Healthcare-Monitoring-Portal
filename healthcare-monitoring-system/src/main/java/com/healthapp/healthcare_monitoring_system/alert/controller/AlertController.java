package com.healthapp.healthcare_monitoring_system.alert.controller;

import com.healthapp.healthcare_monitoring_system.alert.dto.AlertResponseDto;
import com.healthapp.healthcare_monitoring_system.alert.dto.EmergencyAlertLogResponseDto;
import com.healthapp.healthcare_monitoring_system.alert.enums.AlertType;
import com.healthapp.healthcare_monitoring_system.alert.service.AlertService;

import com.healthapp.healthcare_monitoring_system.alert.service.EmergencyAlertLogService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService alertService;
    private final EmergencyAlertLogService emergencyAlertLogService;

    public AlertController(
            AlertService alertService,
            EmergencyAlertLogService emergencyAlertLogService
    ) {
        this.alertService = alertService;
        this.emergencyAlertLogService = emergencyAlertLogService;
    }

    /**
     * GET /api/alerts               -> all alerts
     * GET /api/alerts?type=LOW_STOCK -> filtered (LOW_STOCK, OUT_OF_STOCK, MISSED_DOSE, EMERGENCY)
     */
    @GetMapping
    public List<AlertResponseDto> getAlerts(
            @RequestParam(required = false) AlertType type
    ) {
        return alertService.getAlerts(type);
    }

    @GetMapping("/{alertId}")
    public AlertResponseDto getAlertById(@PathVariable Long alertId) {
        return alertService.getAlertById(alertId);
    }

    @PatchMapping("/{alertId}/read")
    public AlertResponseDto markAsRead(@PathVariable Long alertId) {
        return alertService.markAsRead(alertId);
    }
    // "Recent Emergency Alerts" panel
    @GetMapping("/emergency-log")
    public List<EmergencyAlertLogResponseDto> getRecentEmergencyAlerts() {
        return emergencyAlertLogService.getRecentEmergencyAlerts();
    }

}
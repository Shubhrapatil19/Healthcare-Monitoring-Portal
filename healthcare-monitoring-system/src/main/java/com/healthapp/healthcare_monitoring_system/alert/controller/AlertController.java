package com.healthapp.healthcare_monitoring_system.alert.controller;

import com.healthapp.healthcare_monitoring_system.alert.dto.AlertResponseDto;
import com.healthapp.healthcare_monitoring_system.alert.dto.EmergencyAlertLogResponseDto;
import com.healthapp.healthcare_monitoring_system.alert.enums.AlertType;
import com.healthapp.healthcare_monitoring_system.alert.service.AlertService;
import com.healthapp.healthcare_monitoring_system.alert.service.EmergencyAlertLogService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Alert", description = "Low-stock, out-of-stock, and missed-dose alerts, plus the emergency-notification history log " +
        "(shows Sent/Failed status and recipient for every reminder/alert email that was sent).")
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

    @Operation(
            summary = "List alerts",
            description = "Returns all alerts for the logged-in patient, most recent first. " +
                    "Optionally filter by type using the `type` query param: LOW_STOCK, OUT_OF_STOCK, MISSED_DOSE, or EMERGENCY."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned (may be empty)"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @GetMapping
    public List<AlertResponseDto> getAlerts(
            @Parameter(description = "Optional filter: LOW_STOCK, OUT_OF_STOCK, MISSED_DOSE, or EMERGENCY")
            @RequestParam(required = false) AlertType type
    ) {
        return alertService.getAlerts(type);
    }

    @Operation(
            summary = "Get a single alert",
            description = "Returns full details for one alert, only if it belongs to the logged-in patient."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Alert found"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token"),
            @ApiResponse(responseCode = "404", description = "Alert not found, or doesn't belong to this user")
    })
    @GetMapping("/{alertId}")
    public AlertResponseDto getAlertById(
            @Parameter(description = "ID of the alert to fetch") @PathVariable Long alertId) {
        return alertService.getAlertById(alertId);
    }

    @Operation(
            summary = "Mark an alert as read",
            description = "Marks an alert as READ so it stops showing as unread in the notification bell/list."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Marked as read successfully"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token"),
            @ApiResponse(responseCode = "404", description = "Alert not found, or doesn't belong to this user")
    })
    @PatchMapping("/{alertId}/read")
    public AlertResponseDto markAsRead(
            @Parameter(description = "ID of the alert to mark as read") @PathVariable Long alertId) {
        return alertService.markAsRead(alertId);
    }

    @Operation(
            summary = "Recent emergency notification history",
            description = "Returns the log of every reminder/missed-dose email that was sent (or attempted), " +
                    "with date/time, delivery status (Sent/Failed), and the recipient (currently the patient's own email; " +
                    "Emergency Contact rows will appear here once contact emails are supported)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned (may be empty)"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @GetMapping("/emergency-log")
    public List<EmergencyAlertLogResponseDto> getRecentEmergencyAlerts() {
        return emergencyAlertLogService.getRecentEmergencyAlerts();
    }
}

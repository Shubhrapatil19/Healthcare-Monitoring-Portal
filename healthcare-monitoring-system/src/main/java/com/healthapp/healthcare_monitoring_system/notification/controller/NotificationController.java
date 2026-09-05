package com.healthapp.healthcare_monitoring_system.notification.controller;

import com.healthapp.healthcare_monitoring_system.notification.dto.NotificationListResponseDto;
import com.healthapp.healthcare_monitoring_system.notification.dto.NotificationResponseDto;
import com.healthapp.healthcare_monitoring_system.notification.enums.NotificationStatus;
import com.healthapp.healthcare_monitoring_system.notification.service.NotificationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Notification", description = "The in-app notification bell/feed — success, info, warning, critical, and system messages.")
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Operation(
            summary = "List notifications",
            description = "Returns notifications for the logged-in user. Supports filtering by read/unread status and a text search."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned (may be empty)"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @GetMapping
    public NotificationListResponseDto getNotifications(
            @Parameter(description = "Filter tab: UNREAD or READ. Omit for all.")
            @RequestParam(required = false) NotificationStatus status,
            @Parameter(description = "Free-text search across the notification title/message")
            @RequestParam(required = false) String search
    ) {
        return notificationService.getNotifications(status, search);
    }

    @Operation(
            summary = "Unread notification count",
            description = "Returns the count shown as a badge on the notification bell icon."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Count returned"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount() {
        return Map.of("unreadCount", notificationService.getUnreadCount());
    }

    @Operation(summary = "Mark one notification as read")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Marked as read successfully"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token"),
            @ApiResponse(responseCode = "404", description = "Notification not found, or doesn't belong to this user")
    })
    @PatchMapping("/{notificationId}/read")
    public NotificationResponseDto markAsRead(
            @Parameter(description = "ID of the notification to mark as read") @PathVariable Long notificationId) {
        return notificationService.markAsRead(notificationId);
    }

    @Operation(summary = "Mark all notifications as read", description = "\"Mark All Read\" button.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "All notifications marked as read"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @PatchMapping("/read-all")
    public void markAllAsRead() {
        notificationService.markAllAsRead();
    }

    @Operation(summary = "Delete a single notification", description = "Trash icon on a notification row.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token"),
            @ApiResponse(responseCode = "404", description = "Notification not found, or doesn't belong to this user")
    })
    @DeleteMapping("/{notificationId}")
    public void deleteNotification(
            @Parameter(description = "ID of the notification to delete") @PathVariable Long notificationId) {
        notificationService.deleteNotification(notificationId);
    }

    @Operation(summary = "Clear all notifications", description = "\"Clear All\" button.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "All notifications cleared"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @DeleteMapping
    public void clearAll() {
        notificationService.clearAll();
    }
}

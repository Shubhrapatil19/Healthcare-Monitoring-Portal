package com.healthapp.healthcare_monitoring_system.notification.controller;

import com.healthapp.healthcare_monitoring_system.notification.dto.NotificationListResponseDto;
import com.healthapp.healthcare_monitoring_system.notification.dto.NotificationResponseDto;
import com.healthapp.healthcare_monitoring_system.notification.enums.NotificationStatus;
import com.healthapp.healthcare_monitoring_system.notification.service.NotificationService;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * GET /api/notifications                       -> all
     * GET /api/notifications?status=UNREAD          -> filter tabs (All/Unread/Read)
     * GET /api/notifications?search=metformin       -> search box
     */
    @GetMapping
    public NotificationListResponseDto getNotifications(
            @RequestParam(required = false) NotificationStatus status,
            @RequestParam(required = false) String search
    ) {
        return notificationService.getNotifications(status, search);
    }

    /** For the bell-icon unread badge. */
    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount() {
        return Map.of("unreadCount", notificationService.getUnreadCount());
    }

    @PatchMapping("/{notificationId}/read")
    public NotificationResponseDto markAsRead(@PathVariable Long notificationId) {
        return notificationService.markAsRead(notificationId);
    }

    /** "Mark All Read" button. */
    @PatchMapping("/read-all")
    public void markAllAsRead() {
        notificationService.markAllAsRead();
    }

    /** Trash icon on a single row. */
    @DeleteMapping("/{notificationId}")
    public void deleteNotification(@PathVariable Long notificationId) {
        notificationService.deleteNotification(notificationId);
    }

    /** "Clear All" button. */
    @DeleteMapping
    public void clearAll() {
        notificationService.clearAll();
    }
}
package com.healthapp.healthcare_monitoring_system.notification.service;

import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;
import com.healthapp.healthcare_monitoring_system.notification.dto.NotificationListResponseDto;
import com.healthapp.healthcare_monitoring_system.notification.dto.NotificationResponseDto;
import com.healthapp.healthcare_monitoring_system.notification.entity.NotificationEntity;
import com.healthapp.healthcare_monitoring_system.notification.enums.NotificationStatus;
import com.healthapp.healthcare_monitoring_system.notification.enums.NotificationType;
import com.healthapp.healthcare_monitoring_system.notification.repository.NotificationRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Central place that creates and reads Notifications (the bell-icon feed).
 * Every other module (medicine, dose, inventory, profile, reminder, alert) calls
 * notify(...) / notifyOnce(...) here instead of writing to the notification table directly.
 *
 * Flow this mirrors (as decided):
 *   SUCCESS  -> Medicine Added / Medicine Taken / Stock Added / Profile Updated
 *   INFO     -> Medicine Reminder (10 min before) / Snoozed Reminder
 *   WARNING  -> Low Stock / Medicine Expiring Soon
 *   CRITICAL -> Missed Medicine / Out of Stock
 *   SYSTEM   -> Important System Update (reserved — no automatic trigger yet, see doc)
 */
@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final RegisterRepository registerRepository;

    public NotificationService(NotificationRepository notificationRepository, RegisterRepository registerRepository) {
        this.notificationRepository = notificationRepository;
        this.registerRepository = registerRepository;
    }

    // ---------- creation (called by other services) ----------

    /** Always creates a new notification row. Use for direct user actions (taken, added, updated...). */
    public void notify(RegisterEntity user, NotificationType type, String title, String message) {

        NotificationEntity notification = new NotificationEntity();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setStatus(NotificationStatus.UNREAD);

        notificationRepository.save(notification);
    }

    /**
     * Creates a notification only if an identical one (same title + message) wasn't
     * already raised for this user within `dedupeWindowMinutes`. Use for scheduled /
     * repeatedly-checked events (reminder due, expiring soon) to avoid spamming duplicates.
     */
    public void notifyOnce(RegisterEntity user, NotificationType type, String title, String message,
                           int dedupeWindowMinutes) {

        boolean alreadySent = notificationRepository.existsByUserIdAndTitleAndMessageAndCreatedAtAfter(
                user.getId(), title, message, LocalDateTime.now().minusMinutes(dedupeWindowMinutes));

        if (alreadySent) {
            return;
        }

        notify(user, type, title, message);
    }

    // ---------- read / search ----------

    @Transactional(readOnly = true)
    public NotificationListResponseDto getNotifications(NotificationStatus status, String search) {

        RegisterEntity user = getLoggedInUser();

        List<NotificationEntity> notifications = (status == null)
                ? notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                : notificationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), status);

        if (search != null && !search.trim().isEmpty()) {
            String needle = search.trim().toLowerCase();
            notifications = notifications.stream()
                    .filter(n -> n.getTitle().toLowerCase().contains(needle)
                            || n.getMessage().toLowerCase().contains(needle))
                    .collect(Collectors.toList());
        }

        long unreadCount = notificationRepository.countByUserIdAndStatus(user.getId(), NotificationStatus.UNREAD);

        List<NotificationResponseDto> dtoList = notifications.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return new NotificationListResponseDto(dtoList.size(), unreadCount, dtoList);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {

        RegisterEntity user = getLoggedInUser();

        return notificationRepository.countByUserIdAndStatus(user.getId(), NotificationStatus.UNREAD);
    }

    // ---------- state changes ----------

    public NotificationResponseDto markAsRead(Long notificationId) {

        RegisterEntity user = getLoggedInUser();

        NotificationEntity notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Notification not found."));

        notification.setStatus(NotificationStatus.READ);

        return convertToResponse(notificationRepository.save(notification));
    }

    public void markAllAsRead() {

        RegisterEntity user = getLoggedInUser();

        List<NotificationEntity> unread =
                notificationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), NotificationStatus.UNREAD);

        for (NotificationEntity notification : unread) {
            notification.setStatus(NotificationStatus.READ);
        }

        notificationRepository.saveAll(unread);
    }

    public void deleteNotification(Long notificationId) {

        RegisterEntity user = getLoggedInUser();

        NotificationEntity notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Notification not found."));

        notificationRepository.delete(notification);
    }

    public void clearAll() {

        RegisterEntity user = getLoggedInUser();

        notificationRepository.deleteByUserId(user.getId());
    }

    // ---------- helpers ----------

    private RegisterEntity getLoggedInUser() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("Authentication required. Please provide a valid Bearer token.");
        }

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof Long userId)) {
            throw new IllegalArgumentException("Invalid authenticated user.");
        }

        return registerRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Logged-in user not found."));
    }

    private NotificationResponseDto convertToResponse(NotificationEntity notification) {

        return new NotificationResponseDto(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getStatus(),
                notification.getCreatedAt()
        );
    }
}
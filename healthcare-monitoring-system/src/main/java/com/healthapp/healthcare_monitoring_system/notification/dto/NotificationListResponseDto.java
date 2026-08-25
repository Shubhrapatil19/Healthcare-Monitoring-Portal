package com.healthapp.healthcare_monitoring_system.notification.dto;

import java.util.List;

public class NotificationListResponseDto {

    private long totalCount;
    private long unreadCount;
    private List<NotificationResponseDto> notifications;

    public NotificationListResponseDto() {
    }

    public NotificationListResponseDto(long totalCount, long unreadCount, List<NotificationResponseDto> notifications) {
        this.totalCount = totalCount;
        this.unreadCount = unreadCount;
        this.notifications = notifications;
    }

    public long getTotalCount() { return totalCount; }
    public void setTotalCount(long totalCount) { this.totalCount = totalCount; }

    public long getUnreadCount() { return unreadCount; }
    public void setUnreadCount(long unreadCount) { this.unreadCount = unreadCount; }

    public List<NotificationResponseDto> getNotifications() { return notifications; }
    public void setNotifications(List<NotificationResponseDto> notifications) { this.notifications = notifications; }
}
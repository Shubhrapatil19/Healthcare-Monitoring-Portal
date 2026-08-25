package com.healthapp.healthcare_monitoring_system.alert.service;

import com.healthapp.healthcare_monitoring_system.alert.dto.AlertResponseDto;
import com.healthapp.healthcare_monitoring_system.alert.entity.AlertEntity;
import com.healthapp.healthcare_monitoring_system.alert.enums.AlertStatus;
import com.healthapp.healthcare_monitoring_system.alert.enums.AlertType;
import com.healthapp.healthcare_monitoring_system.alert.repository.AlertRepository;
import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;
import com.healthapp.healthcare_monitoring_system.dose.entity.MedicineDoseLogEntity;
import com.healthapp.healthcare_monitoring_system.inventory.entity.MedicineInventoryEntity;
import com.healthapp.healthcare_monitoring_system.medicine.entity.MedicineEntity;
import com.healthapp.healthcare_monitoring_system.notification.enums.NotificationType;
import com.healthapp.healthcare_monitoring_system.notification.service.NotificationService;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Central place that creates and reads Alerts.
 * Called by:
 *  - DoseService        -> creates MISSED_DOSE alerts (30 min after scheduled time, still pending)
 *  - MedicineInventoryService / DoseService (stock reduction) -> creates LOW_STOCK / OUT_OF_STOCK alerts
 * Also feeds the same events into NotificationService so they show up in the bell-icon feed too.
 */
@Service
@Transactional
public class AlertService {

    private final AlertRepository alertRepository;
    private final RegisterRepository registerRepository;
    private final NotificationService notificationService;

    public AlertService(AlertRepository alertRepository, RegisterRepository registerRepository,
                        NotificationService notificationService) {
        this.alertRepository = alertRepository;
        this.registerRepository = registerRepository;
        this.notificationService = notificationService;
    }

    /** Creates a MISSED_DOSE alert for a dose log that just crossed the 30-minute grace period. */
    public void createMissedDoseAlert(MedicineDoseLogEntity doseLog) {

        Long userId = doseLog.getUser().getId();
        Long medicineId = doseLog.getMedicine().getId();

        // don't spam - skip if a missed-dose alert for this medicine was already raised in the last hour
        boolean alreadyRaised = alertRepository.existsByUserIdAndMedicineIdAndAlertTypeAndAlertTimeAfter(
                userId, medicineId, AlertType.MISSED_DOSE, LocalDateTime.now().minusHours(1));

        if (alreadyRaised) {
            return;
        }

        AlertEntity alert = new AlertEntity();
        alert.setUser(doseLog.getUser());
        alert.setMedicine(doseLog.getMedicine());
        alert.setAlertType(AlertType.MISSED_DOSE);
        alert.setCurrentStock(null);
        alert.setMinimumStock(null);
        alert.setMessage("Patient missed their scheduled dose. Please check.");
        alert.setStatus(AlertStatus.UNREAD);
        alert.setAlertTime(LocalDateTime.now());

        alertRepository.save(alert);
    }

    /** Creates LOW_STOCK / OUT_OF_STOCK alert based on current inventory numbers (no-op if stock is healthy). */
    public void checkAndRaiseStockAlert(MedicineInventoryEntity inventory) {

        MedicineEntity medicine = inventory.getMedicine();
        RegisterEntity user = inventory.getUser();

        AlertType type;
        String message;

        if (inventory.getCurrentStock() <= 0) {
            type = AlertType.OUT_OF_STOCK;
            message = "Medicine is out of stock. Order immediately.";
        } else if (inventory.getCurrentStock() <= inventory.getMinimumStock()) {
            type = AlertType.LOW_STOCK;
            message = "Stock is running low. Please refill medicine.";
        } else {
            return; // stock is healthy, nothing to raise
        }

        // don't spam - skip if the same alert type for this medicine was already raised in the last 6 hours
        boolean alreadyRaised = alertRepository.existsByUserIdAndMedicineIdAndAlertTypeAndAlertTimeAfter(
                user.getId(), medicine.getId(), type, LocalDateTime.now().minusHours(6));

        if (alreadyRaised) {
            return;
        }

        AlertEntity alert = new AlertEntity();
        alert.setUser(user);
        alert.setMedicine(medicine);
        alert.setAlertType(type);
        alert.setCurrentStock(inventory.getCurrentStock());
        alert.setMinimumStock(inventory.getMinimumStock());
        alert.setMessage(message);
        alert.setStatus(AlertStatus.UNREAD);
        alert.setAlertTime(LocalDateTime.now());

        alertRepository.save(alert);

        // same event also feeds the bell-icon Notifications feed
        notificationService.notify(
                user,
                type == AlertType.OUT_OF_STOCK ? NotificationType.CRITICAL : NotificationType.WARNING,
                type == AlertType.OUT_OF_STOCK ? "Out of Stock" : "Low Stock Alert",
                medicine.getMedicineName() + (type == AlertType.OUT_OF_STOCK
                        ? " is out of stock."
                        : " stock is running low.")
        );
    }

    /** All alerts for logged-in user (optionally filtered by type), newest first. */
    @Transactional(readOnly = true)
    public List<AlertResponseDto> getAlerts(AlertType type) {

        RegisterEntity user = getLoggedInUser();

        List<AlertEntity> alerts = (type == null)
                ? alertRepository.findByUserIdOrderByAlertTimeDesc(user.getId())
                : alertRepository.findByUserIdAndAlertTypeOrderByAlertTimeDesc(user.getId(), type);

        return alerts.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AlertResponseDto getAlertById(Long alertId) {

        RegisterEntity user = getLoggedInUser();

        AlertEntity alert = alertRepository.findByIdAndUserId(alertId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Alert not found."));

        return convertToResponse(alert);
    }

    public AlertResponseDto markAsRead(Long alertId) {

        RegisterEntity user = getLoggedInUser();

        AlertEntity alert = alertRepository.findByIdAndUserId(alertId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Alert not found."));

        alert.setStatus(AlertStatus.READ);

        return convertToResponse(alertRepository.save(alert));
    }

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

    private AlertResponseDto convertToResponse(AlertEntity alert) {

        return new AlertResponseDto(
                alert.getId(),
                alert.getMedicine() != null ? alert.getMedicine().getMedicineName() : null,
                alert.getAlertType(),
                alert.getCurrentStock(),
                alert.getMinimumStock(),
                alert.getMessage(),
                alert.getStatus(),
                alert.getAlertTime()
        );
    }
}
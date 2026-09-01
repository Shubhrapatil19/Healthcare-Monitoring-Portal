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
import com.healthapp.healthcare_monitoring_system.alert.enums.RecipientType;
import com.healthapp.healthcare_monitoring_system.notification.enums.NotificationType;
import com.healthapp.healthcare_monitoring_system.notification.service.NotificationService;
import com.healthapp.healthcare_monitoring_system.profile.entity.UserProfileEntity;
import com.healthapp.healthcare_monitoring_system.profile.repository.UserProfileRepository;
import com.healthapp.healthcare_monitoring_system.actiontoken.enums.ActionType;
import com.healthapp.healthcare_monitoring_system.actiontoken.service.ActionTokenService;
import com.healthapp.healthcare_monitoring_system.auth.service.EmailService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
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
 *  - DoseService -> creates MISSED_DOSE alerts (30 min after scheduled time, still pending)
 *  - DoseService (stock reduction) -> creates LOW_STOCK / OUT_OF_STOCK alerts
 * Also feeds NotificationService (bell-icon feed) and, for MISSED_DOSE only, sends an email
 * to the patient with an "OK" acknowledgment link, escalating to Emergency Contacts if unactioned.
 */
@Service
@Transactional
public class AlertService {

    private final AlertRepository alertRepository;
    private final RegisterRepository registerRepository;
    private final UserProfileRepository profileRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final ActionTokenService smsActionTokenService;
    private final EmergencyAlertLogService emergencyAlertLogService;

    /** If the patient doesn't tap "OK" within this many minutes, escalate. */
    private static final int ESCALATION_WAIT_MINUTES = 15;

    @Value("${app.backend-url}")
    private String backendUrl;

    public AlertService(
            AlertRepository alertRepository,
            RegisterRepository registerRepository,
            UserProfileRepository profileRepository,
            NotificationService notificationService,
            EmailService emailService,
            ActionTokenService smsActionTokenService,
            EmergencyAlertLogService emergencyAlertLogService
    ) {
        this.alertRepository = alertRepository;
        this.registerRepository = registerRepository;
        this.profileRepository = profileRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.smsActionTokenService = smsActionTokenService;
        this.emergencyAlertLogService = emergencyAlertLogService;
    }

    /**
     * Creates a MISSED_DOSE alert for a dose log that just crossed the 30-minute grace period,
     * then immediately emails the patient an "OK" acknowledgment link.
     */
    public void createMissedDoseAlert(MedicineDoseLogEntity doseLog) {

        Long userId = doseLog.getUser().getId();
        Long medicineId = doseLog.getMedicine().getId();

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

        AlertEntity saved = alertRepository.save(alert);

        sendMissedDoseSms(saved, doseLog);
    }

    private void sendMissedDoseSms(AlertEntity alert, MedicineDoseLogEntity doseLog) {

        String ackToken = smsActionTokenService.generateToken(ActionType.ALERT_ACK, alert.getId());
        String ackLink = backendUrl + "/api/actions/" + ackToken;

        RegisterEntity user = doseLog.getUser();

        boolean success = true;
        try {
            emailService.sendMissedDoseEmail(
                    user.getEmail(), user.getFullName(),
                    doseLog.getMedicine().getMedicineName(), ackLink
            );
        } catch (Exception e) {
            success = false;
        }

        emergencyAlertLogService.log(
                user, RecipientType.PATIENT, "You", user.getEmail(),
                "MISSED_DOSE_ALERT", doseLog.getMedicine().getMedicineName(), success
        );

        alert.setSmsSentAt(LocalDateTime.now());
        alert.setEscalationLevel(0);
        alertRepository.save(alert);
    }

    /**
     * Runs every 1 minute (system-wide).
     * If the patient hasn't tapped "OK" 15 minutes after the last email, escalate:
     * level 0 -> Emergency Contact 1, level 1 -> Emergency Contact 2.
     */
    /*
     * DISABLED: escalation to Emergency Contacts used to SMS them here.
     * SmsService was removed (email-only for now). Emergency contacts don't have an
     * email on file yet — re-enable this once contact-email fields exist in the UI/DB.
     */
    @Scheduled(fixedRate = 60 * 1000)
    public void escalateUnacknowledgedAlerts() {

        LocalDateTime now = LocalDateTime.now();

        List<AlertEntity> candidates =
                alertRepository.findByAlertTypeAndAcknowledgedFalseAndEscalationLevelLessThanAndSmsSentAtIsNotNull(
                        AlertType.MISSED_DOSE, 2);

        for (AlertEntity alert : candidates) {

            if (alert.getSmsSentAt().plusMinutes(ESCALATION_WAIT_MINUTES).isAfter(now)) {
                continue; // still inside the wait window
            }

            // TODO: once emergency contacts have email addresses, notify them here
            // and log via emergencyAlertLogService as before.

            alert.setEscalationLevel(alert.getEscalationLevel() + 1);
            alert.setSmsSentAt(now);
            alertRepository.save(alert);
        }
    }

    private String resolveEscalationContact(UserProfileEntity profile, int currentLevel) {

        if (profile == null) {
            return null;
        }

        if (currentLevel == 0 && isFilled(profile.getContact1Phone())) {
            return profile.getContact1Phone();
        }

        if (currentLevel == 1 && isFilled(profile.getContact2Phone())) {
            return profile.getContact2Phone();
        }

        return null;
    }

    private boolean isFilled(String value) {
        return value != null && !value.trim().isEmpty();
    }

    /** Creates LOW_STOCK / OUT_OF_STOCK alert based on current inventory numbers (no-op if healthy). */
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
            return;
        }

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

    /**
     * Called from the email "OK" link (no logged-in user, no JWT). Safe because the
     * alertId only ever comes from a single-use token generated exclusively for that
     * alert's own patient.
     */
    public void acknowledgeAlert(Long alertId) {

        AlertEntity alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found."));

        alert.setAcknowledged(true);
        alert.setAcknowledgedAt(LocalDateTime.now());

        alertRepository.save(alert);
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
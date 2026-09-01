package com.healthapp.healthcare_monitoring_system.alert.service;

import com.healthapp.healthcare_monitoring_system.alert.dto.EmergencyAlertLogResponseDto;
import com.healthapp.healthcare_monitoring_system.alert.entity.EmergencyAlertLogEntity;
import com.healthapp.healthcare_monitoring_system.alert.enums.RecipientType;
import com.healthapp.healthcare_monitoring_system.alert.repository.EmergencyAlertLogRepository;
import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Records every reminder/missed-dose-alert that goes out (to the patient OR to an
 * emergency contact) so the "Recent Emergency Alerts" panel has something to show.
 * Standalone within the alert module — ReminderService and AlertService both call into this.
 */
@Service
@Transactional
public class EmergencyAlertLogService {

    private final EmergencyAlertLogRepository logRepository;
    private final RegisterRepository registerRepository;

    public EmergencyAlertLogService(
            EmergencyAlertLogRepository logRepository,
            RegisterRepository registerRepository
    ) {
        this.logRepository = logRepository;
        this.registerRepository = registerRepository;
    }

    public void log(
            RegisterEntity user,
            RecipientType recipientType,
            String recipientLabel,
            String recipientPhone,
            String eventType,
            String medicineName,
            boolean success
    ) {

        EmergencyAlertLogEntity entry = new EmergencyAlertLogEntity();
        entry.setUser(user);
        entry.setRecipientType(recipientType);
        entry.setRecipientLabel(recipientLabel);
        entry.setRecipientPhone(recipientPhone);
        entry.setEventType(eventType);
        entry.setMedicineName(medicineName);
        entry.setStatus(success ? "SENT" : "FAILED");

        logRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public List<EmergencyAlertLogResponseDto> getRecentEmergencyAlerts() {

        RegisterEntity user = getLoggedInUser();

        return logRepository.findByUserIdOrderBySentAtDesc(user.getId())
                .stream()
                .map(entry -> new EmergencyAlertLogResponseDto(
                        entry.getId(),
                        entry.getSentAt(),
                        entry.getStatus(),
                        entry.getRecipientType(),
                        entry.getRecipientLabel(),
                        entry.getEventType(),
                        entry.getMedicineName()
                ))
                .collect(Collectors.toList());
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
}
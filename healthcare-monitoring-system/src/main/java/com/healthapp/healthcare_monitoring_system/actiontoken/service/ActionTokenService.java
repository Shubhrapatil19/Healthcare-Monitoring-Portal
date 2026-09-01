package com.healthapp.healthcare_monitoring_system.actiontoken.service;

import com.healthapp.healthcare_monitoring_system.actiontoken.entity.ActionTokenEntity;
import com.healthapp.healthcare_monitoring_system.actiontoken.enums.ActionType;
import com.healthapp.healthcare_monitoring_system.actiontoken.repository.ActionTokenRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

/**
 * Standalone — no dependency on any other feature module.
 * Reminder and Alert modules call INTO this to create/validate one-click action links
 * (used in reminder/alert emails).
 *
 * Expiry differs by action type:
 *  - DOSE_TAKEN / DOSE_SNOOZE: 30 minutes (matches the missed-dose grace window —
 *    once a dose is auto-marked MISSED, the old reminder's buttons should no longer work).
 *  - ALERT_ACK: 12 hours (patient has a full day-ish window to confirm they're okay).
 */
@Service
@Transactional
public class ActionTokenService {

    private final ActionTokenRepository tokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final int REMINDER_ACTION_EXPIRY_MINUTES = 30;
    private static final int ALERT_ACK_EXPIRY_HOURS = 12;

    public ActionTokenService(ActionTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    /** Generates a fresh, unguessable, single-use token for the given action + target. */
    public String generateToken(ActionType actionType, Long targetId) {

        byte[] randomBytes = new byte[24];
        secureRandom.nextBytes(randomBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        LocalDateTime expiresAt = switch (actionType) {
            case DOSE_TAKEN, DOSE_SNOOZE -> LocalDateTime.now().plusMinutes(REMINDER_ACTION_EXPIRY_MINUTES);
            case ALERT_ACK -> LocalDateTime.now().plusHours(ALERT_ACK_EXPIRY_HOURS);
        };

        ActionTokenEntity entity = new ActionTokenEntity();
        entity.setToken(token);
        entity.setActionType(actionType);
        entity.setTargetId(targetId);
        entity.setExpiresAt(expiresAt);
        entity.setUsed(false);

        tokenRepository.save(entity);

        return token;
    }

    /** Validates the token (exists, not used, not expired) and marks it used in the same step. */
    public Optional<ActionTokenEntity> validateAndConsume(String token) {

        Optional<ActionTokenEntity> found = tokenRepository.findByToken(token);

        if (found.isEmpty()) {
            return Optional.empty();
        }

        ActionTokenEntity entity = found.get();

        if (entity.isUsed() || entity.getExpiresAt().isBefore(LocalDateTime.now())) {
            return Optional.empty();
        }

        entity.setUsed(true);
        tokenRepository.save(entity);

        return Optional.of(entity);
    }
}
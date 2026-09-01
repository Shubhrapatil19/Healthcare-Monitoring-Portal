package com.healthapp.healthcare_monitoring_system.reminder.service;

import com.healthapp.healthcare_monitoring_system.alert.enums.RecipientType;
import com.healthapp.healthcare_monitoring_system.alert.service.EmergencyAlertLogService;
import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;
import com.healthapp.healthcare_monitoring_system.dose.entity.MedicineDoseLogEntity;
import com.healthapp.healthcare_monitoring_system.dose.enums.DoseStatus;
import com.healthapp.healthcare_monitoring_system.dose.repository.MedicineDoseLogRepository;
import com.healthapp.healthcare_monitoring_system.dose.service.DoseService;
import com.healthapp.healthcare_monitoring_system.notification.enums.NotificationType;
import com.healthapp.healthcare_monitoring_system.notification.service.NotificationService;
import com.healthapp.healthcare_monitoring_system.profile.entity.UserProfileEntity;
import com.healthapp.healthcare_monitoring_system.profile.repository.UserProfileRepository;
import com.healthapp.healthcare_monitoring_system.reminder.dto.ReminderResponseDto;
import com.healthapp.healthcare_monitoring_system.reminder.entity.MedicineReminderEntity;
import com.healthapp.healthcare_monitoring_system.reminder.repository.MedicineReminderRepository;
import com.healthapp.healthcare_monitoring_system.actiontoken.enums.ActionType;
import com.healthapp.healthcare_monitoring_system.actiontoken.service.ActionTokenService;
import com.healthapp.healthcare_monitoring_system.auth.service.EmailService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReminderService {

    private final MedicineReminderRepository reminderRepository;
    private final MedicineDoseLogRepository doseLogRepository;
    private final RegisterRepository registerRepository;
    private final UserProfileRepository profileRepository;
    private final DoseService doseService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final ActionTokenService smsActionTokenService;
    private final EmergencyAlertLogService emergencyAlertLogService;

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("hh:mm a");

    /** How many minutes before the dose's scheduled time the reminder should fire. */
    private static final int REMINDER_LEAD_MINUTES = 10;

    /** "Snooze" always pushes the reminder this many minutes into the future. */
    private static final int SNOOZE_MINUTES = 15;

    /** If the patient doesn't act on the reminder within this many minutes, escalate. */
    private static final int ESCALATION_WAIT_MINUTES = 15;

    @Value("${app.backend-url}")
    private String backendUrl;

    public ReminderService(
            MedicineReminderRepository reminderRepository,
            MedicineDoseLogRepository doseLogRepository,
            RegisterRepository registerRepository,
            UserProfileRepository profileRepository,
            DoseService doseService,
            NotificationService notificationService,
            EmailService emailService,
            ActionTokenService smsActionTokenService,
            EmergencyAlertLogService emergencyAlertLogService
    ) {
        this.reminderRepository = reminderRepository;
        this.doseLogRepository = doseLogRepository;
        this.registerRepository = registerRepository;
        this.profileRepository = profileRepository;
        this.doseService = doseService;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.smsActionTokenService = smsActionTokenService;
        this.emergencyAlertLogService = emergencyAlertLogService;
    }

    /**
     * Runs every 1 minute. Creates a reminder row for every today's PENDING dose log
     * that doesn't have one yet. reminderTime = scheduled dose time - 10 minutes.
     */
    @Scheduled(fixedRate = 60 * 1000)
    public void generateMissingReminders() {

        LocalDate today = LocalDate.now();

        List<MedicineDoseLogEntity> pendingDoses =
                doseLogRepository.findByScheduledDateAndStatus(today, DoseStatus.PENDING);

        for (MedicineDoseLogEntity dose : pendingDoses) {

            if (reminderRepository.existsByDoseLogId(dose.getId())) {
                continue;
            }

            MedicineReminderEntity reminder = new MedicineReminderEntity();
            reminder.setDoseLog(dose);
            reminder.setUser(dose.getUser());
            reminder.setReminderTime(
                    LocalDateTime.of(dose.getScheduledDate(), dose.getScheduledTime())
                            .minusMinutes(REMINDER_LEAD_MINUTES)
            );
            reminder.setStatus("PENDING");

            reminderRepository.save(reminder);
        }
    }

    /**
     * Runs every 1 minute (system-wide). The moment a reminder becomes due (reminderTime <= now):
     * 1) Raises an INFO app notification (deduped 40 min, unchanged from before).
     * 2) Sends an email to the patient with Taken/Snooze links —
     *    but ONLY ONCE per due-window (guarded by smsSentAt being null). After a snooze,
     *    smsSentAt is cleared, so the email goes out again 15 minutes later automatically.
     */
    @Scheduled(fixedRate = 60 * 1000)
    public void raiseDueReminderNotifications() {

        LocalDateTime now = LocalDateTime.now();

        List<MedicineReminderEntity> dueReminders =
                reminderRepository.findByStatusAndReminderTimeLessThanEqual("PENDING", now);

        for (MedicineReminderEntity reminder : dueReminders) {

            if (reminder.getSnoozeUntil() != null && reminder.getSnoozeUntil().isAfter(now)) {
                continue; // still snoozed — not due yet
            }

            MedicineDoseLogEntity dose = reminder.getDoseLog();

            String appMessage = "It's time to take " + dose.getMedicine().getMedicineName()
                    + " " + dose.getMedicine().getDosage() + " at "
                    + dose.getScheduledTime().format(TIME_FORMAT) + ".";

            notificationService.notifyOnce(
                    reminder.getUser(), NotificationType.INFO, "Medicine Reminder", appMessage, 40
            );

            if (reminder.getSmsSentAt() == null) {
                sendReminderSms(reminder, dose);
            }
        }
    }

    private void sendReminderSms(MedicineReminderEntity reminder, MedicineDoseLogEntity dose) {

        RegisterEntity user = reminder.getUser();

        String takenToken = smsActionTokenService.generateToken(ActionType.DOSE_TAKEN, reminder.getId());
        String snoozeToken = smsActionTokenService.generateToken(ActionType.DOSE_SNOOZE, reminder.getId());

        String takenLink = backendUrl + "/api/actions/" + takenToken;
        String snoozeLink = backendUrl + "/api/actions/" + snoozeToken;

        boolean success = true;
        try {
            emailService.sendReminderEmail(
                    user.getEmail(), user.getFullName(),
                    dose.getMedicine().getMedicineName(), dose.getMedicine().getDosage(),
                    takenLink, snoozeLink
            );
        } catch (Exception e) {
            success = false;
        }

        emergencyAlertLogService.log(
                user, RecipientType.PATIENT, "You", user.getEmail(),
                "REMINDER", dose.getMedicine().getMedicineName(), success
        );

        reminder.setSmsSentAt(LocalDateTime.now());
        reminder.setEscalationLevel(0);
        reminderRepository.save(reminder);
    }

    /**
     * Runs every 1 minute (system-wide).
     * If the patient hasn't acted (still PENDING) 15 minutes after the last email,
     * escalate: level 0 -> Emergency Contact 1, level 1 -> Emergency Contact 2.
     */
    /*
     * DISABLED: escalation to Emergency Contacts used to SMS them here.
     * SmsService was removed (email-only for now). Emergency contacts don't have an
     * email on file yet — re-enable this once contact-email fields exist in the UI/DB.
     */
    @Scheduled(fixedRate = 60 * 1000)
    public void escalateUnactionedReminders() {

        LocalDateTime now = LocalDateTime.now();

        List<MedicineReminderEntity> candidates =
                reminderRepository.findByStatusAndEscalationLevelLessThanAndSmsSentAtIsNotNull("PENDING", 2);

        for (MedicineReminderEntity reminder : candidates) {

            if (reminder.getSmsSentAt().plusMinutes(ESCALATION_WAIT_MINUTES).isAfter(now)) {
                continue; // still inside the wait window
            }

            // TODO: once emergency contacts have email addresses, notify them here
            // and log via emergencyAlertLogService as before.

            reminder.setEscalationLevel(reminder.getEscalationLevel() + 1);
            reminder.setSmsSentAt(now); // restart the wait window for the next escalation level
            reminderRepository.save(reminder);
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

    /** Today's Reminder section — hides reminders until their 10-min-before mark, and while snoozed. */
    public List<ReminderResponseDto> getTodayReminders() {

        RegisterEntity user = getLoggedInUser();

        LocalDateTime now = LocalDateTime.now();

        return reminderRepository.findByUserIdAndDoseLog_ScheduledDate(user.getId(), LocalDate.now())
                .stream()
                .filter(r -> !"TAKEN".equals(r.getStatus()))
                .filter(r -> !"MISSED".equals(r.getStatus()))
                .filter(r -> !r.getReminderTime().isAfter(now))
                .filter(r -> r.getSnoozeUntil() == null || !r.getSnoozeUntil().isAfter(now))
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /** Reminder history — all reminders, latest first. */
    public List<ReminderResponseDto> getReminderHistory() {

        RegisterEntity user = getLoggedInUser();

        return reminderRepository.findByUserIdOrderByReminderTimeDesc(user.getId())
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /** "Taken" button in the APP — marks dose TAKEN and closes the reminder. */
    public ReminderResponseDto markTaken(Long reminderId) {

        RegisterEntity user = getLoggedInUser();

        MedicineReminderEntity reminder =
                reminderRepository.findByIdAndUserId(reminderId, user.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Reminder not found."));

        doseService.updateStatus(reminder.getDoseLog().getId(), DoseStatus.TAKEN);

        reminder.setStatus("TAKEN");
        reminder.setSnoozeUntil(null);
        reminder.setSmsSentAt(null);
        reminder.setEscalationLevel(0);

        MedicineReminderEntity saved = reminderRepository.save(reminder);

        return convertToResponse(saved);
    }

    /** "Snooze" button in the APP — pushes reminder 15 minutes into the future. */
    public ReminderResponseDto snooze(Long reminderId) {

        RegisterEntity user = getLoggedInUser();

        MedicineReminderEntity reminder =
                reminderRepository.findByIdAndUserId(reminderId, user.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Reminder not found."));

        applySnooze(reminder);

        return convertToResponse(reminderRepository.save(reminder));
    }

    /**
     * Same as markTaken(), but for email link clicks where there is NO logged-in user
     * (no JWT available). Safe because reminderId only ever comes from a single-use token
     * that was generated exclusively for that reminder's own owner.
     */
    public void markTakenInternal(Long reminderId) {

        MedicineReminderEntity reminder = reminderRepository.findById(reminderId)
                .orElseThrow(() -> new IllegalArgumentException("Reminder not found."));

        doseService.updateStatusInternal(reminder.getDoseLog().getId(), DoseStatus.TAKEN);

        reminder.setStatus("TAKEN");
        reminder.setSnoozeUntil(null);
        reminder.setSmsSentAt(null);
        reminder.setEscalationLevel(0);

        reminderRepository.save(reminder);
    }

    /** Same as snooze(), but for email link clicks (no logged-in user). */
    public void snoozeInternal(Long reminderId) {

        MedicineReminderEntity reminder = reminderRepository.findById(reminderId)
                .orElseThrow(() -> new IllegalArgumentException("Reminder not found."));

        applySnooze(reminder);

        reminderRepository.save(reminder);
    }

    private void applySnooze(MedicineReminderEntity reminder) {

        reminder.setSnoozeUntil(LocalDateTime.now().plusMinutes(SNOOZE_MINUTES));
        reminder.setSnoozeCount(reminder.getSnoozeCount() + 1);
        reminder.setStatus("PENDING");
        reminder.setSmsSentAt(null);      // clears the "already sent" flag so a fresh email goes out next cycle
        reminder.setEscalationLevel(0);   // reset escalation for the new cycle

        notificationService.notify(
                reminder.getUser(),
                NotificationType.INFO,
                "Snoozed Reminder",
                reminder.getDoseLog().getMedicine().getMedicineName() + " reminder snoozed for "
                        + SNOOZE_MINUTES + " minutes."
        );
    }

    /**
     * Called by DoseService when a dose crosses the 30-minute missed-dose window.
     * Closes the matching reminder (if any) so it stops showing under "Today's Reminders".
     */
    public void markReminderMissedForDoseLog(Long doseLogId) {

        reminderRepository.findByDoseLogId(doseLogId).ifPresent(reminder -> {
            reminder.setStatus("MISSED");
            reminder.setSnoozeUntil(null);
            reminderRepository.save(reminder);
        });
    }

    /** Delete ONE reminder history entry (not bulk). */
    public void deleteReminder(Long reminderId) {

        RegisterEntity user = getLoggedInUser();

        MedicineReminderEntity reminder =
                reminderRepository.findByIdAndUserId(reminderId, user.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Reminder not found."));

        reminderRepository.delete(reminder);
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

    private ReminderResponseDto convertToResponse(MedicineReminderEntity reminder) {

        MedicineDoseLogEntity dose = reminder.getDoseLog();

        return new ReminderResponseDto(
                reminder.getId(),
                dose.getId(),
                dose.getMedicine().getMedicineName(),
                dose.getMedicine().getDosage(),
                dose.getScheduledDate(),
                dose.getScheduledTime(),
                reminder.getStatus(),
                reminder.getSnoozeUntil(),
                reminder.getSnoozeCount()
        );
    }
}
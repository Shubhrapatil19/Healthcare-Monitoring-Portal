package com.healthapp.healthcare_monitoring_system.reminder.service;

import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;
import com.healthapp.healthcare_monitoring_system.dose.entity.MedicineDoseLogEntity;
import com.healthapp.healthcare_monitoring_system.dose.enums.DoseStatus;
import com.healthapp.healthcare_monitoring_system.dose.repository.MedicineDoseLogRepository;
import com.healthapp.healthcare_monitoring_system.dose.service.DoseService;
import com.healthapp.healthcare_monitoring_system.notification.enums.NotificationType;
import com.healthapp.healthcare_monitoring_system.notification.service.NotificationService;
import com.healthapp.healthcare_monitoring_system.reminder.dto.ReminderResponseDto;
import com.healthapp.healthcare_monitoring_system.reminder.entity.MedicineReminderEntity;
import com.healthapp.healthcare_monitoring_system.reminder.repository.MedicineReminderRepository;

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
    private final DoseService doseService;
    private final NotificationService notificationService;

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("hh:mm a");

    public ReminderService(
            MedicineReminderRepository reminderRepository,
            MedicineDoseLogRepository doseLogRepository,
            RegisterRepository registerRepository,
            DoseService doseService,
            NotificationService notificationService
    ) {
        this.reminderRepository = reminderRepository;
        this.doseLogRepository = doseLogRepository;
        this.registerRepository = registerRepository;
        this.doseService = doseService;
        this.notificationService = notificationService;
    }

    /** How many minutes before the dose's scheduled time the reminder should fire. */
    private static final int REMINDER_LEAD_MINUTES = 10;

    /**
     * Runs every 1 minute (needs to be frequent since reminders are precision-sensitive).
     * Creates a reminder row for every today's PENDING dose log that doesn't have one yet.
     * reminderTime is set to (scheduled dose time - 10 minutes) — the row is created ahead of
     * time, but getTodayReminders() only surfaces it once "now" reaches that reminderTime, so
     * the user sees the popup/notification exactly 10 minutes before the dose is due.
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
     * Runs every 1 minute (system-wide — no logged-in user, so it scans across all users).
     * Raises an INFO "Medicine Reminder" notification the moment a reminder becomes due
     * (reminderTime <= now), i.e. exactly 10 minutes before the dose's scheduled time.
     * Deduped for 40 minutes (via NotificationService.notifyOnce) so the same due reminder
     * doesn't spam multiple notification rows across repeated job runs.
     */
    @Scheduled(fixedRate = 60 * 1000)
    public void raiseDueReminderNotifications() {

        LocalDateTime now = LocalDateTime.now();

        List<MedicineReminderEntity> dueReminders =
                reminderRepository.findByStatusAndReminderTimeLessThanEqual("PENDING", now);

        for (MedicineReminderEntity reminder : dueReminders) {

            // still snoozed -> don't notify yet
            if (reminder.getSnoozeUntil() != null && reminder.getSnoozeUntil().isAfter(now)) {
                continue;
            }

            MedicineDoseLogEntity dose = reminder.getDoseLog();

            String message = "It's time to take " + dose.getMedicine().getMedicineName()
                    + " " + dose.getMedicine().getDosage() + " at "
                    + dose.getScheduledTime().format(TIME_FORMAT) + ".";

            notificationService.notifyOnce(
                    reminder.getUser(),
                    NotificationType.INFO,
                    "Medicine Reminder",
                    message,
                    40 // minutes — comfortably covers the reminder's active window
            );
        }
    }

    /** Today's Reminder section. */
    /**
     * Today's Reminder section.
     * A snoozed reminder stays hidden until its snoozeUntil time has passed,
     * then it automatically re-appears here (15-min snooze cycle).
     */
    public List<ReminderResponseDto> getTodayReminders() {

        RegisterEntity user = getLoggedInUser();

        LocalDateTime now = LocalDateTime.now();

        return reminderRepository.findByUserIdAndDoseLog_ScheduledDate(user.getId(), LocalDate.now())
                .stream()
                .filter(r -> !"TAKEN".equals(r.getStatus()))
                .filter(r -> !"MISSED".equals(r.getStatus()))
                // only surface the reminder once its (dose time - 10 min) mark has actually arrived
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

    /** "Taken" button — marks dose TAKEN (reduces inventory too) and closes the reminder. */
    public ReminderResponseDto markTaken(Long reminderId) {

        RegisterEntity user = getLoggedInUser();

        MedicineReminderEntity reminder =
                reminderRepository.findByIdAndUserId(reminderId, user.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Reminder not found."));

        doseService.updateStatus(reminder.getDoseLog().getId(), DoseStatus.TAKEN);

        reminder.setStatus("TAKEN");
        reminder.setSnoozeUntil(null);

        MedicineReminderEntity saved = reminderRepository.save(reminder);

        return convertToResponse(saved);
    }

    /** "Snooze" button — pushes reminder N minutes (default 5) into the future. */
    private static final int SNOOZE_MINUTES = 15;

    /** "Snooze" button — always pushes reminder 15 minutes into the future, every time. */
    public ReminderResponseDto snooze(Long reminderId) {

        RegisterEntity user = getLoggedInUser();

        MedicineReminderEntity reminder =
                reminderRepository.findByIdAndUserId(reminderId, user.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Reminder not found."));

        reminder.setSnoozeUntil(LocalDateTime.now().plusMinutes(SNOOZE_MINUTES));
        reminder.setSnoozeCount(reminder.getSnoozeCount() + 1);
        reminder.setStatus("PENDING");

        MedicineReminderEntity saved = reminderRepository.save(reminder);

        notificationService.notify(
                user,
                NotificationType.INFO,
                "Snoozed Reminder",
                saved.getDoseLog().getMedicine().getMedicineName() + " reminder snoozed until "
                        + saved.getSnoozeUntil().format(TIME_FORMAT) + "."
        );

        return convertToResponse(saved);
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

    /** Delete ONE reminder history entry (not bulk, as required). */
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
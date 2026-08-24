package com.healthapp.healthcare_monitoring_system.reminder.service;

import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;
import com.healthapp.healthcare_monitoring_system.dose.entity.MedicineDoseLogEntity;
import com.healthapp.healthcare_monitoring_system.dose.enums.DoseStatus;
import com.healthapp.healthcare_monitoring_system.dose.repository.MedicineDoseLogRepository;
import com.healthapp.healthcare_monitoring_system.dose.service.DoseService;
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
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReminderService {

    private final MedicineReminderRepository reminderRepository;
    private final MedicineDoseLogRepository doseLogRepository;
    private final RegisterRepository registerRepository;
    private final DoseService doseService;

    public ReminderService(
            MedicineReminderRepository reminderRepository,
            MedicineDoseLogRepository doseLogRepository,
            RegisterRepository registerRepository,
            DoseService doseService
    ) {
        this.reminderRepository = reminderRepository;
        this.doseLogRepository = doseLogRepository;
        this.registerRepository = registerRepository;
        this.doseService = doseService;
    }

    /**
     * Runs every 5 minutes.
     * Creates a reminder row for every today's PENDING dose log that doesn't have one yet.
     */
    @Scheduled(fixedRate = 5 * 60 * 1000)
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
            );
            reminder.setStatus("PENDING");

            reminderRepository.save(reminder);
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

        return convertToResponse(saved);
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
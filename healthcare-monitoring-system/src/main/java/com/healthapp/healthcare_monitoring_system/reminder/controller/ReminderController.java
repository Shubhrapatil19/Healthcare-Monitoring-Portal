package com.healthapp.healthcare_monitoring_system.reminder.controller;

import com.healthapp.healthcare_monitoring_system.reminder.dto.ReminderResponseDto;
import com.healthapp.healthcare_monitoring_system.reminder.dto.SnoozeRequestDto;
import com.healthapp.healthcare_monitoring_system.reminder.service.ReminderService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

    private final ReminderService reminderService;

    public ReminderController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    // Today's Reminder section
    @GetMapping("/today")
    public List<ReminderResponseDto> getTodayReminders() {
        return reminderService.getTodayReminders();
    }

    // Reminder history section
    @GetMapping("/history")
    public List<ReminderResponseDto> getHistory() {
        return reminderService.getReminderHistory();
    }

    // "Taken" button
    @PatchMapping("/{reminderId}/taken")
    public ReminderResponseDto markTaken(@PathVariable Long reminderId) {
        return reminderService.markTaken(reminderId);
    }

    // "Snooze" button
    @PatchMapping("/{reminderId}/snooze")
    public ReminderResponseDto snooze(
            @PathVariable Long reminderId,
            @RequestBody(required = false) SnoozeRequestDto request
    ) {

        int minutes =
                (request == null || request.getSnoozeMinutes() == null)
                        ? 5
                        : request.getSnoozeMinutes();

        return reminderService.snooze(reminderId, minutes);
    }

    // Delete one reminder history entry
    @DeleteMapping("/{reminderId}")
    public ResponseEntity<Void> deleteReminder(@PathVariable Long reminderId) {
        reminderService.deleteReminder(reminderId);
        return ResponseEntity.noContent().build();
    }
}
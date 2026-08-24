package com.healthapp.healthcare_monitoring_system.reminder.controller;

import com.healthapp.healthcare_monitoring_system.reminder.dto.ReminderResponseDto;
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

    @GetMapping("/today")
    public List<ReminderResponseDto> getTodayReminders() {
        return reminderService.getTodayReminders();
    }

    @GetMapping("/history")
    public List<ReminderResponseDto> getHistory() {
        return reminderService.getReminderHistory();
    }

    @PatchMapping("/{reminderId}/taken")
    public ReminderResponseDto markTaken(@PathVariable Long reminderId) {
        return reminderService.markTaken(reminderId);
    }

    // Snooze — no request body needed anymore, always 15 minutes
    @PatchMapping("/{reminderId}/snooze")
    public ReminderResponseDto snooze(@PathVariable Long reminderId) {
        return reminderService.snooze(reminderId);
    }

    @DeleteMapping("/{reminderId}")
    public ResponseEntity<Void> deleteReminder(@PathVariable Long reminderId) {
        reminderService.deleteReminder(reminderId);
        return ResponseEntity.noContent().build();
    }
}
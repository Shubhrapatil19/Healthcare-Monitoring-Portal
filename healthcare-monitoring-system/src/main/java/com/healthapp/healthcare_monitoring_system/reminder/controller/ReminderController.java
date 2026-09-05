package com.healthapp.healthcare_monitoring_system.reminder.controller;

import com.healthapp.healthcare_monitoring_system.reminder.dto.ReminderResponseDto;
import com.healthapp.healthcare_monitoring_system.reminder.service.ReminderService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Reminder", description = "In-app view of today's dose reminders and their history. " +
        "Reminders are generated and emailed automatically by background jobs — these endpoints are for the app UI (bell/list view), " +
        "not for triggering reminders manually. Taken/Snooze can also be done from the app in addition to the email buttons.")
@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

    private final ReminderService reminderService;

    public ReminderController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @Operation(
            summary = "Today's pending reminders",
            description = "Returns reminders due today that are still PENDING and past their 10-min-before mark (excludes snoozed-and-not-yet-due ones)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned (may be empty)"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @GetMapping("/today")
    public List<ReminderResponseDto> getTodayReminders() {
        return reminderService.getTodayReminders();
    }

    @Operation(
            summary = "Reminder history",
            description = "Returns all reminders for the logged-in patient, most recent first."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned (may be empty)"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @GetMapping("/history")
    public List<ReminderResponseDto> getHistory() {
        return reminderService.getReminderHistory();
    }

    @Operation(
            summary = "Mark a dose as taken",
            description = "Marks the dose as TAKEN and closes the reminder. Same action as clicking \"Mark as Taken\" in the reminder email."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Marked as taken successfully"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token"),
            @ApiResponse(responseCode = "404", description = "Reminder not found, or doesn't belong to this user")
    })
    @PatchMapping("/{reminderId}/taken")
    public ReminderResponseDto markTaken(
            @Parameter(description = "ID of the reminder to mark as taken") @PathVariable Long reminderId) {
        return reminderService.markTaken(reminderId);
    }

    @Operation(
            summary = "Snooze a reminder for 15 minutes",
            description = "Pushes the reminder 15 minutes into the future and resets its escalation state. " +
                    "Same action as clicking \"Snooze 15 min\" in the reminder email. No request body needed."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Snoozed successfully"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token"),
            @ApiResponse(responseCode = "404", description = "Reminder not found, or doesn't belong to this user")
    })
    @PatchMapping("/{reminderId}/snooze")
    public ReminderResponseDto snooze(
            @Parameter(description = "ID of the reminder to snooze") @PathVariable Long reminderId) {
        return reminderService.snooze(reminderId);
    }

    @Operation(
            summary = "Delete a reminder history entry",
            description = "Removes a single reminder record from history. Does not affect the underlying dose log."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token"),
            @ApiResponse(responseCode = "404", description = "Reminder not found, or doesn't belong to this user")
    })
    @DeleteMapping("/{reminderId}")
    public ResponseEntity<Void> deleteReminder(
            @Parameter(description = "ID of the reminder to delete") @PathVariable Long reminderId) {
        reminderService.deleteReminder(reminderId);
        return ResponseEntity.noContent().build();
    }
}

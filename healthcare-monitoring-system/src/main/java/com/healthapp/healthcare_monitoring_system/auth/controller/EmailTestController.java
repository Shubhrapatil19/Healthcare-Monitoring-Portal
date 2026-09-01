package com.healthapp.healthcare_monitoring_system.auth.controller;

import com.healthapp.healthcare_monitoring_system.auth.service.EmailService;
import org.springframework.web.bind.annotation.*;

/**
 * TEMPORARY — for manually testing reminder email delivery via Swagger UI.
 * Delete this controller once email sending is confirmed working end-to-end.
 */
@RestController
@RequestMapping("/api/test/email")
public class EmailTestController {

    private final EmailService emailService;

    public EmailTestController(EmailService emailService) {
        this.emailService = emailService;
    }

    /**
     * Example: GET /api/test/email/reminder?email=you@example.com&name=Gaurav&medicine=Paracetamol&dosage=500mg
     */
    @GetMapping("/reminder")
    public String sendReminder(
            @RequestParam String email,
            @RequestParam String name,
            @RequestParam String medicine,
            @RequestParam String dosage
    ) {
        try {
            emailService.sendReminderEmail(
                    email, name, medicine, dosage,
                    "https://example.com/taken", "https://example.com/snooze"
            );
            return "SENT — check your inbox (and spam folder)";
        } catch (Exception e) {
            return "FAILED — " + e.getMessage();
        }
    }
}
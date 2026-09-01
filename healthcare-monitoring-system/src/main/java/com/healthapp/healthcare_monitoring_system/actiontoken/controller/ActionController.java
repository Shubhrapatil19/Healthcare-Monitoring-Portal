package com.healthapp.healthcare_monitoring_system.actiontoken.controller;

import com.healthapp.healthcare_monitoring_system.alert.service.AlertService;
import com.healthapp.healthcare_monitoring_system.reminder.service.ReminderService;
import com.healthapp.healthcare_monitoring_system.actiontoken.entity.ActionTokenEntity;
import com.healthapp.healthcare_monitoring_system.actiontoken.service.ActionTokenService;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

/** Handles clicks on the Taken / Snooze / OK buttons from reminder and alert emails. */
@RestController
@RequestMapping("/api/actions")
public class ActionController {

    private final ActionTokenService tokenService;
    private final ReminderService reminderService;
    private final AlertService alertService;

    public ActionController(
            ActionTokenService tokenService,
            ReminderService reminderService,
            AlertService alertService
    ) {
        this.tokenService = tokenService;
        this.reminderService = reminderService;
        this.alertService = alertService;
    }

    @GetMapping(value = "/{token}", produces = MediaType.TEXT_HTML_VALUE)
    public String handleAction(@PathVariable String token) {

        Optional<ActionTokenEntity> validated = tokenService.validateAndConsume(token);

        if (validated.isEmpty()) {
            return page("Link Expired", "This button has already been used, or the time window for this action has passed.", "warn");
        }

        ActionTokenEntity actionToken = validated.get();

        return switch (actionToken.getActionType()) {

            case DOSE_TAKEN -> {
                reminderService.markTakenInternal(actionToken.getTargetId());
                yield page("Marked as Taken", "Great! This dose has been recorded as taken.", "success");
            }

            case DOSE_SNOOZE -> {
                reminderService.snoozeInternal(actionToken.getTargetId());
                yield page("Snoozed", "Okay, we'll remind you again in 15 minutes.", "info");
            }

            case ALERT_ACK -> {
                alertService.acknowledgeAlert(actionToken.getTargetId());
                yield page("Thanks for confirming", "We've noted your response. No further alerts will be sent for this dose.", "success");
            }
        };
    }

    /** Small branded confirmation page, matching the app's teal theme. */
    private String page(String title, String message, String tone) {

        String accentColor = switch (tone) {
            case "success" -> "#0f6e56";
            case "warn" -> "#c0392b";
            default -> "#1f6feb";
        };

        String icon = tone.equals("warn") ? "&#33;" : "&#10003;";

        return """
                <!DOCTYPE html>
                <html>
                <head>
                <meta charset="UTF-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <title>%s</title>
                <style>
                    body { margin:0; padding:0; background:#eef7f4; font-family:'Segoe UI', Arial, sans-serif;
                           display:flex; align-items:center; justify-content:center; min-height:100vh; }
                    .card { background:#ffffff; border-radius:16px; padding:40px 32px; max-width:420px; width:90%%;
                            box-shadow:0 8px 24px rgba(15,110,86,0.15); text-align:center; }
                    .badge { width:64px; height:64px; border-radius:50%%; background:%s; color:#fff;
                             display:flex; align-items:center; justify-content:center; margin:0 auto 20px auto;
                             font-size:28px; font-weight:700; }
                    h1 { color:#0f6e56; font-size:20px; margin:0 0 10px 0; }
                    p { color:#5f5e5a; font-size:14px; line-height:22px; margin:0; }
                    .brand { margin-top:28px; font-size:12px; color:#a0a09a; font-weight:600; }
                </style>
                </head>
                <body>
                    <div class="card">
                        <div class="badge">%s</div>
                        <h1>%s</h1>
                        <p>%s</p>
                        <div class="brand">Healthcare Monitoring System</div>
                    </div>
                </body>
                </html>
                """.formatted(title, accentColor, icon, title, message);
    }
}
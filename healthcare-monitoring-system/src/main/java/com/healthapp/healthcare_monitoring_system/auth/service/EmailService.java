package com.healthapp.healthcare_monitoring_system.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.from-name}")
    private String fromName;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String email, String fullName, String token) {

        String verificationLink = frontendUrl + "/verify-email?token=" + token;

        String html = buildEmailShell(
                "Verify your email",
                "Welcome to Healthcare Monitoring System",
                fullName,
                "Your account has been created successfully. Please confirm it's really you by " +
                        "verifying your email address — just one click below.",
                "Verify Email",
                verificationLink,
                "This verification link will expire in <strong>24 hours</strong>.",
                "If you did not create this account, you can safely ignore this email."
        );

        sendHtmlEmail(email, "Verify your Healthcare Monitoring System account", html);
    }

    public void sendPasswordResetEmail(String email, String fullName, String token) {

        String resetLink = frontendUrl + "/reset-password?token=" + token;

        String html = buildEmailShell(
                "Reset your password",
                "Password Reset Request",
                fullName,
                "We received a request to reset the password for your Healthcare Monitoring System " +
                        "account. Click the button below to choose a new password.",
                "Reset Password",
                resetLink,
                "For your security, this link will expire in <strong>30 minutes</strong>.",
                "If you did not request a password reset, you can safely ignore this email — " +
                        "your password will remain unchanged."
        );

        sendHtmlEmail(email, "Reset your Healthcare Monitoring System password", html);
    }

    /**
     * Shared themed HTML shell used by every transactional email — teal/blue gradient header
     * (matches the app's UI), a light "watermark" wordmark in the body, a rounded CTA button
     * and a soft card background, so every email is instantly recognisable as this app.
     */
    private String buildEmailShell(
            String preheader,
            String heading,
            String fullName,
            String bodyText,
            String buttonLabel,
            String buttonLink,
            String expiryNote,
            String footerNote
    ) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Healthcare Monitoring System</title>
                </head>
                <body style="margin:0; padding:0; background-color:#eef6f6; font-family:'Segoe UI', Arial, sans-serif;">
                    <span style="display:none; font-size:1px; color:#eef6f6; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">%s</span>

                    <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color:#eef6f6; padding:32px 12px;">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:520px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 24px rgba(13,148,136,0.15);">

                                    <!-- Header -->
                                    <tr>
                                        <td style="background:linear-gradient(135deg,#0d9488 0%%,#0e7490 55%%,#2563eb 100%%); padding:36px 32px; text-align:center;">
                                            <div style="width:56px; height:56px; margin:0 auto 14px auto; background:rgba(255,255,255,0.18); border-radius:50%%; line-height:56px; font-size:26px;">
                                                &#10084;&#65039;
                                            </div>
                                            <div style="color:#ffffff; font-size:22px; font-weight:700; letter-spacing:0.3px;">
                                                Healthcare Monitoring System
                                            </div>
                                            <div style="color:rgba(255,255,255,0.85); font-size:12px; letter-spacing:1px; margin-top:4px; text-transform:uppercase;">
                                                Secure &bull; Reliable &bull; Care Focused
                                            </div>
                                        </td>
                                    </tr>

                                    <!-- Body -->
                                    <tr>
                                        <td style="padding:36px 32px 8px 32px;">
                                            <h2 style="margin:0 0 16px 0; color:#0f172a; font-size:20px;">%s</h2>
                                            <p style="margin:0 0 8px 0; color:#334155; font-size:15px;">Hello <strong>%s</strong>,</p>
                                            <p style="margin:0 0 24px 0; color:#475569; font-size:15px; line-height:1.6;">%s</p>

                                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px auto;">
                                                <tr>
                                                    <td align="center" style="border-radius:10px; background:linear-gradient(135deg,#0d9488,#2563eb);">
                                                        <a href="%s" target="_blank"
                                                           style="display:inline-block; padding:14px 32px; color:#ffffff; text-decoration:none; font-weight:600; font-size:15px; border-radius:10px;">
                                                           %s
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="margin:0 0 8px 0; color:#64748b; font-size:13px; line-height:1.6;">%s</p>
                                            <p style="margin:0 0 24px 0; color:#94a3b8; font-size:12px; line-height:1.6;">
                                                Button not working? Copy and paste this link into your browser:<br/>
                                                <a href="%s" style="color:#0e7490; word-break:break-all;">%s</a>
                                            </p>

                                            <p style="margin:0 0 4px 0; color:#94a3b8; font-size:12px;">%s</p>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background:#f1f5f9; padding:20px 32px; text-align:center;">
                                            <div style="color:#0d9488; font-weight:700; font-size:13px;">Healthcare Monitoring System</div>
                                            <div style="color:#94a3b8; font-size:11px; margin-top:4px;">
                                                &copy; %s Healthcare Monitoring System. All rights reserved.
                                            </div>
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(
                preheader,
                heading,
                fullName,
                bodyText,
                buttonLink,
                buttonLabel,
                expiryNote,
                buttonLink,
                buttonLink,
                footerNote,
                java.time.Year.now()
        );
    }

    public void sendReminderEmail(String email, String fullName, String medicineName, String dosage,
                                  String takenLink, String snoozeLink) {

        String html = buildTwoButtonEmailShell(
                "Time to take " + medicineName,
                "Medicine Reminder",
                fullName,
                "It's time to take <strong>" + medicineName + "</strong> (" + dosage + "). "
                        + "Please confirm below once you've taken it, or snooze for 15 minutes.",
                "Mark as Taken", takenLink,
                "Snooze 15 min", snoozeLink
        );

        sendHtmlEmail(email, "Reminder: Time to take " + medicineName, html);
    }

    public void sendMissedDoseEmail(String email, String fullName, String medicineName, String ackLink) {

        String html = buildEmailShell(
                "You missed your " + medicineName + " dose",
                "Missed Dose Alert",
                fullName,
                "You missed your scheduled dose of <strong>" + medicineName + "</strong>. "
                        + "Please confirm you're okay by clicking below.",
                "Confirm You're Okay",
                ackLink,
                "",
                "If this was a mistake, please take your medicine as soon as possible."
        );

        sendHtmlEmail(email, "Missed Dose Alert: " + medicineName, html);
    }

    /**
     * Same visual theme as buildEmailShell, but with two side-by-side action buttons
     * (used for dose reminders: Taken / Snooze).
     */
    private String buildTwoButtonEmailShell(
            String preheader,
            String heading,
            String fullName,
            String bodyText,
            String button1Label,
            String button1Link,
            String button2Label,
            String button2Link
    ) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>Healthcare Monitoring System</title>
                </head>
                <body style="margin:0; padding:0; background-color:#eef6f6; font-family:'Segoe UI', Arial, sans-serif;">
                    <span style="display:none; font-size:1px; color:#eef6f6; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">%s</span>

                    <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color:#eef6f6; padding:32px 12px;">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:520px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 24px rgba(13,148,136,0.15);">

                                    <tr>
                                        <td style="background:linear-gradient(135deg,#0d9488 0%%,#0e7490 55%%,#2563eb 100%%); padding:36px 32px; text-align:center;">
                                            <div style="width:56px; height:56px; margin:0 auto 14px auto; background:rgba(255,255,255,0.18); border-radius:50%%; line-height:56px; font-size:26px;">
                                                &#128138;
                                            </div>
                                            <div style="color:#ffffff; font-size:22px; font-weight:700; letter-spacing:0.3px;">
                                                Healthcare Monitoring System
                                            </div>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding:36px 32px 8px 32px;">
                                            <h2 style="margin:0 0 16px 0; color:#0f172a; font-size:20px;">%s</h2>
                                            <p style="margin:0 0 8px 0; color:#334155; font-size:15px;">Hello <strong>%s</strong>,</p>
                                            <p style="margin:0 0 24px 0; color:#475569; font-size:15px; line-height:1.6;">%s</p>

                                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px auto;">
                                                <tr>
                                                    <td align="center" style="border-radius:10px; background:linear-gradient(135deg,#0d9488,#0e7490); padding:0 8px;">
                                                        <a href="%s" target="_blank"
                                                           style="display:inline-block; padding:14px 28px; color:#ffffff; text-decoration:none; font-weight:600; font-size:14px; border-radius:10px;">
                                                           %s
                                                        </a>
                                                    </td>
                                                    <td align="center" style="border-radius:10px; background:#e2e8f0; padding:0 8px;">
                                                        <a href="%s" target="_blank"
                                                           style="display:inline-block; padding:14px 28px; color:#334155; text-decoration:none; font-weight:600; font-size:14px; border-radius:10px;">
                                                           %s
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="background:#f1f5f9; padding:20px 32px; text-align:center;">
                                            <div style="color:#0d9488; font-weight:700; font-size:13px;">Healthcare Monitoring System</div>
                                            <div style="color:#94a3b8; font-size:11px; margin-top:4px;">
                                                &copy; %s Healthcare Monitoring System. All rights reserved.
                                            </div>
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(
                preheader,
                heading,
                fullName,
                bodyText,
                button1Link,
                button1Label,
                button2Link,
                button2Label,
                java.time.Year.now()
        );
    }

    private void sendHtmlEmail(String to, String subject, String html) {

        try {

            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {

            throw new RuntimeException("Unable to send email", e);
        }
    }
}
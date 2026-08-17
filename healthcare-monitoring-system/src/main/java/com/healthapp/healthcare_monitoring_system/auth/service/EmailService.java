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

    public void sendVerificationEmail(
            String email,
            String fullName,
            String token
    ) {

        String verificationLink =
                frontendUrl
                        + "/verify-email?token="
                        + token;

        String html = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif;">

                    <h2>Welcome to Healthcare Monitoring System</h2>

                    <p>Hello %s,</p>

                    <p>
                        Your account has been created successfully.
                        Please verify your email address by clicking
                        the button below.
                    </p>

                    <p>
                        <a href="%s"
                           style="
                           display:inline-block;
                           padding:12px 20px;
                           background:#008c95;
                           color:white;
                           text-decoration:none;
                           border-radius:6px;
                           ">
                           Verify Email
                        </a>
                    </p>

                    <p>
                        This verification link will expire in 24 hours.
                    </p>

                    <p>
                        If you did not create this account,
                        please ignore this email.
                    </p>

                    <p>
                        Regards,<br>
                        Healthcare Monitoring System
                    </p>

                </body>
                </html>
                """.formatted(
                fullName,
                verificationLink
        );

        sendHtmlEmail(
                email,
                "Verify your Healthcare Monitoring System account",
                html
        );
    }

    public void sendPasswordResetEmail(
            String email,
            String fullName,
            String token
    ) {

        String resetLink =
                frontendUrl
                        + "/reset-password?token="
                        + token;

        String html = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif;">

                    <h2>Reset Your Password</h2>

                    <p>Hello %s,</p>

                    <p>
                        We received a request to reset your password.
                    </p>

                    <p>
                        <a href="%s"
                           style="
                           display:inline-block;
                           padding:12px 20px;
                           background:#008c95;
                           color:white;
                           text-decoration:none;
                           border-radius:6px;
                           ">
                           Reset Password
                        </a>
                    </p>

                    <p>
                        This link will expire in 30 minutes.
                    </p>

                    <p>
                        If you did not request a password reset,
                        please ignore this email.
                    </p>

                </body>
                </html>
                """.formatted(
                fullName,
                resetLink
        );

        sendHtmlEmail(
                email,
                "Reset your Healthcare Monitoring System password",
                html
        );
    }

    private void sendHtmlEmail(
            String to,
            String subject,
            String html
    ) {

        try {

            MimeMessage message =
                    mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(
                            message,
                            true,
                            "UTF-8"
                    );

            // Sender email
            helper.setFrom(fromEmail);

            // Receiver
            helper.setTo(to);

            // Subject
            helper.setSubject(subject);

            // HTML content
            helper.setText(
                    html,
                    true
            );

            // Send email
            mailSender.send(message);

        } catch (MessagingException e) {

            throw new RuntimeException(
                    "Unable to send email",
                    e
            );
        }
    }
}
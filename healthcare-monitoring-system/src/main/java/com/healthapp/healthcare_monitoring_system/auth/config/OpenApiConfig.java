package com.healthapp.healthcare_monitoring_system.auth.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;

import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Healthcare Monitoring System API",
                version = "1.0",
                description = """
                        Backend REST API for the Healthcare Monitoring System — a medicine reminder \
                        and adherence-tracking platform.

                        **Core features covered by this API:**
                        - User registration, login, and email verification (JWT-based auth)
                        - Medicine, dose schedule, and inventory management
                        - Automatic dose reminders (10 min before scheduled time) and missed-dose alerts (30 min after),
                          delivered by email with one-click Taken / Snooze / Confirm action links
                        - Notifications feed and emergency alert history

                        **Authentication:** Most endpoints require a JWT Bearer token obtained from
                        `POST /api/auth/login`. Click "Authorize" above and paste the token
                        (without the word "Bearer") to test protected endpoints directly from this page.
                        """,
                contact = @Contact(
                        name = "Healthcare Monitoring System",
                        email = "gauravmahale103@gmail.com"
                )
        ),
        servers = {
                @Server(url = "http://localhost:5081", description = "Local development"),
                @Server(url = "https://healthcare-monitor.duckdns.org", description = "Production")
        },
        security = {
                @SecurityRequirement(name = "bearerAuth")
        }
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        scheme = "bearer",
        in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {
}
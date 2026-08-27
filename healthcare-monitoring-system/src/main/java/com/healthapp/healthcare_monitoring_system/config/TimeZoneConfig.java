package com.healthapp.healthcare_monitoring_system.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@Configuration
public class TimeZoneConfig {

    @Value("${app.timezone:Asia/Kolkata}")
    private String applicationTimeZone;

    @PostConstruct
    public void setApplicationTimeZone() {
        TimeZone.setDefault(TimeZone.getTimeZone(applicationTimeZone));
    }
}
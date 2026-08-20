package com.healthapp.healthcare_monitoring_system.reminder.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SnoozeRequestDto {

    // optional - body na bhejo to default 5 min snooze ho jayega
    private Integer snoozeMinutes = 5;
}
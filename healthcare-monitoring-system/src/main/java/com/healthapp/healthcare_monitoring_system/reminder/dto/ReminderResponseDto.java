package com.healthapp.healthcare_monitoring_system.reminder.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@AllArgsConstructor
public class ReminderResponseDto {

    private Long reminderId;
    private Long doseLogId;
    private String medicineName;
    private String dosage;

    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate scheduledDate;

    @JsonFormat(pattern = "hh:mm a")
    private LocalTime scheduledTime;

    private String status;

    @JsonFormat(pattern = "dd-MM-yyyy hh:mm a")
    private LocalDateTime snoozeUntil;

    private int snoozeCount;
}
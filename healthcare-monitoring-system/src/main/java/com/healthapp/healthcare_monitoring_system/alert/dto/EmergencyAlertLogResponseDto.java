package com.healthapp.healthcare_monitoring_system.alert.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.healthapp.healthcare_monitoring_system.alert.enums.RecipientType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class EmergencyAlertLogResponseDto {

    private Long id;

    @JsonFormat(pattern = "dd-MM-yyyy hh:mm a")
    private LocalDateTime sentAt;

    private String status;
    private RecipientType recipientType;
    private String sentTo;          // e.g. "You" or "Emergency Contact 1 (Mother)"
    private String eventType;       // REMINDER / MISSED_DOSE_ALERT
    private String medicineName;
}
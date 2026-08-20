package com.healthapp.healthcare_monitoring_system.dose.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.healthapp.healthcare_monitoring_system.dose.enums.DoseStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@AllArgsConstructor
public class DoseResponseDto {

    private Long doseId;
    private Long medicineId;
    private String medicineName;
    private String dosage;

    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate scheduledDate;

    @JsonFormat(pattern = "hh:mm a")
    private LocalTime scheduledTime;

    private DoseStatus status;
}
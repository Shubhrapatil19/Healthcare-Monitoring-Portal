package com.healthapp.healthcare_monitoring_system.dose.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
public class CalendarResponseDto {

    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate date;

    // Only two possible values: "TAKEN" or "MISSED"
    private String status;
}
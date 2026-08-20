package com.healthapp.healthcare_monitoring_system.dose.dto;

import com.healthapp.healthcare_monitoring_system.dose.enums.DoseStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DoseStatusRequestDto {

    @NotNull(message = "Status is required")
    private DoseStatus status;
}
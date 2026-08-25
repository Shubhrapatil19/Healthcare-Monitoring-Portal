package com.healthapp.healthcare_monitoring_system.report.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class MedicineComplianceDto {

    private String medicineName;
    private long scheduled;
    private long taken;
    private long missed;
    private double compliancePercentage;
}
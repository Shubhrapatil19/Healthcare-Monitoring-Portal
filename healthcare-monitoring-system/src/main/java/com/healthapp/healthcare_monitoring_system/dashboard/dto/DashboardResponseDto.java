package com.healthapp.healthcare_monitoring_system.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class DashboardResponseDto {

    private long todaysMedicines;
    private long taken;
    private long missed;
    private long lowStockAlerts;
}
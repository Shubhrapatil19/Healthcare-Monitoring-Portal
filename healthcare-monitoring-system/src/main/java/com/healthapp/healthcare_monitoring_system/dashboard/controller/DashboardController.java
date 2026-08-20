package com.healthapp.healthcare_monitoring_system.dashboard.controller;

import com.healthapp.healthcare_monitoring_system.dashboard.dto.DashboardResponseDto;
import com.healthapp.healthcare_monitoring_system.dashboard.service.DashboardService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public DashboardResponseDto getDashboard() {
        return dashboardService.getDashboard();
    }
}
package com.healthapp.healthcare_monitoring_system.dashboard.controller;

import com.healthapp.healthcare_monitoring_system.dashboard.dto.DashboardResponseDto;
import com.healthapp.healthcare_monitoring_system.dashboard.service.DashboardService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Dashboard", description = "Aggregated summary data (today's dose progress, stock health, upcoming reminders, etc.) for the main dashboard screen.")
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Operation(
            summary = "Get dashboard summary",
            description = "Returns a single aggregated payload combining today's schedule progress, low-stock counts, " +
                    "unread notification/alert counts, and other widgets shown on the home dashboard."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Dashboard data returned"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @GetMapping
    public DashboardResponseDto getDashboard() {
        return dashboardService.getDashboard();
    }
}

package com.healthapp.healthcare_monitoring_system.dose.controller;

import com.healthapp.healthcare_monitoring_system.dose.dto.CalendarResponseDto;
import com.healthapp.healthcare_monitoring_system.dose.dto.DoseResponseDto;
import com.healthapp.healthcare_monitoring_system.dose.dto.DoseStatusRequestDto;
import com.healthapp.healthcare_monitoring_system.dose.service.DoseService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Dose", description = "Today's dose schedule, the monthly compliance calendar, and manually marking a dose Taken/Missed.")
@RestController
@RequestMapping("/api/doses")
public class DoseController {

    private final DoseService doseService;

    public DoseController(DoseService doseService) {
        this.doseService = doseService;
    }

    @Operation(
            summary = "Today's dose schedule",
            description = "Returns every dose scheduled for today for the logged-in patient. " +
                    "Also generates today's dose-log rows on the fly for any medicine that doesn't have one yet."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned (may be empty)"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @GetMapping("/today")
    public List<DoseResponseDto> getTodaySchedule() {
        return doseService.getTodaySchedule();
    }

    @Operation(
            summary = "Monthly compliance calendar",
            description = "Returns a day-by-day summary (taken/missed/pending counts) used to render the compliance calendar view."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Calendar data returned"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @GetMapping("/calendar")
    public List<CalendarResponseDto> getCalendar() {
        return doseService.getCalendar();
    }

    @Operation(
            summary = "Manually update a dose's status",
            description = "Marks a specific dose as TAKEN or MISSED directly from the app (e.g. Today's Schedule screen)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Status updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid status value"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token"),
            @ApiResponse(responseCode = "404", description = "Dose not found, or doesn't belong to this user")
    })
    @PatchMapping("/{doseId}/status")
    public DoseResponseDto updateStatus(
            @Parameter(description = "ID of the dose log entry to update") @PathVariable Long doseId,
            @Valid @RequestBody DoseStatusRequestDto request
    ) {
        return doseService.updateStatus(doseId, request.getStatus());
    }
}

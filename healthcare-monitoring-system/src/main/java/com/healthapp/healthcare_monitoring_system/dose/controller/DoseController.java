package com.healthapp.healthcare_monitoring_system.dose.controller;

import com.healthapp.healthcare_monitoring_system.dose.dto.CalendarResponseDto;
import com.healthapp.healthcare_monitoring_system.dose.dto.DoseResponseDto;
import com.healthapp.healthcare_monitoring_system.dose.dto.DoseStatusRequestDto;
import com.healthapp.healthcare_monitoring_system.dose.service.DoseService;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doses")
public class DoseController {

    private final DoseService doseService;

    public DoseController(DoseService doseService) {
        this.doseService = doseService;
    }

    // Today's Schedule section
    @GetMapping("/today")
    public List<DoseResponseDto> getTodaySchedule() {
        return doseService.getTodaySchedule();
    }

    @GetMapping("/calendar")
    public List<CalendarResponseDto> getCalendar() {
        return doseService.getCalendar();
    }

    // Manually mark a dose Taken/Missed
    @PatchMapping("/{doseId}/status")
    public DoseResponseDto updateStatus(
            @PathVariable Long doseId,
            @Valid @RequestBody DoseStatusRequestDto request
    ) {
        return doseService.updateStatus(doseId, request.getStatus());
    }
}
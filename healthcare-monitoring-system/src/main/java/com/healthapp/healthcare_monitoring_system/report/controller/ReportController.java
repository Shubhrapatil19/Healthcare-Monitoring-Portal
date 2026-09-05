package com.healthapp.healthcare_monitoring_system.report.controller;

import com.healthapp.healthcare_monitoring_system.report.dto.ComplianceReportResponseDto;
import com.healthapp.healthcare_monitoring_system.report.service.ReportService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Report", description = "Medicine-adherence compliance report — viewable on screen or downloadable as a themed PDF.")
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @Operation(
            summary = "Get compliance report (current month)",
            description = "Returns taken/missed dose statistics for the current month, for on-screen display."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Report data returned"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @GetMapping("/compliance")
    public ComplianceReportResponseDto getComplianceReport() {
        return reportService.getComplianceReport();
    }

    @Operation(
            summary = "Download compliance report as PDF",
            description = "Generates and returns the same compliance report as a styled PDF file, matching the app's theme."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "PDF file returned",
                    content = @Content(mediaType = MediaType.APPLICATION_PDF_VALUE)),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @GetMapping("/compliance/download")
    public ResponseEntity<byte[]> downloadCompliancePdf() {

        byte[] pdfBytes = reportService.generateCompliancePdf();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=compliance-report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}

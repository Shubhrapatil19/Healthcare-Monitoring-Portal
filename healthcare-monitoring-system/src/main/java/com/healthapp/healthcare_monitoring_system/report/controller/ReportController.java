package com.healthapp.healthcare_monitoring_system.report.controller;

import com.healthapp.healthcare_monitoring_system.report.dto.ComplianceReportResponseDto;
import com.healthapp.healthcare_monitoring_system.report.service.ReportService;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // View report data on screen (current month, no input needed)
    @GetMapping("/compliance")
    public ComplianceReportResponseDto getComplianceReport() {
        return reportService.getComplianceReport();
    }

    // Download Report button -> PDF, same theme as UI
    @GetMapping("/compliance/download")
    public ResponseEntity<byte[]> downloadCompliancePdf() {

        byte[] pdfBytes = reportService.generateCompliancePdf();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=compliance-report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
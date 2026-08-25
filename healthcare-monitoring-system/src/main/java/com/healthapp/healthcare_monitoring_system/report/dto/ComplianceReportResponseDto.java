package com.healthapp.healthcare_monitoring_system.report.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class ComplianceReportResponseDto {

    private double compliancePercentage;
    private long takenCount;
    private long missedCount;
    private long lowStockCount;

    private List<MedicineComplianceDto> medicineWiseCompliance;
    private List<InventoryStatusRowDto> inventoryStatus;
    private long inventoryLowStockCount;
    private long inventoryOutOfStockCount;

    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate periodStart;

    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate periodEnd;

    @JsonFormat(pattern = "dd-MM-yyyy hh:mm a")
    private LocalDateTime generatedAt;

    private String generatedBy;
    private String status;
}
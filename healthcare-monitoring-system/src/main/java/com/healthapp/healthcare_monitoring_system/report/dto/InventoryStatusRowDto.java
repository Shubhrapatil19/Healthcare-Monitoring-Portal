package com.healthapp.healthcare_monitoring_system.report.dto;

import com.healthapp.healthcare_monitoring_system.inventory.enums.StockStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class InventoryStatusRowDto {

    private String medicineName;
    private int currentStock;
    private int minimumStock;
    private StockStatus status;
}
package com.healthapp.healthcare_monitoring_system.inventory.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.healthapp.healthcare_monitoring_system.inventory.enums.StockStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
public class InventoryResponseDto {

    private Long id;
    private Long medicineId;
    private String medicineName;
    private int currentStock;
    private int minimumStock;

    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate expiryDate;

    private StockStatus stockStatus;
}
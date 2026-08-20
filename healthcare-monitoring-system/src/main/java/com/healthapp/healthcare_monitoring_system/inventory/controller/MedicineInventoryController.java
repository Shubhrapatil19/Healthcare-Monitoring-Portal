package com.healthapp.healthcare_monitoring_system.inventory.controller;

import com.healthapp.healthcare_monitoring_system.inventory.dto.AddInventoryRequestDto;
import com.healthapp.healthcare_monitoring_system.inventory.dto.InventoryResponseDto;
import com.healthapp.healthcare_monitoring_system.inventory.dto.UpdateInventoryRequestDto;
import com.healthapp.healthcare_monitoring_system.inventory.service.MedicineInventoryService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
public class MedicineInventoryController {

    private final MedicineInventoryService inventoryService;

    public MedicineInventoryController(MedicineInventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping
    public ResponseEntity<InventoryResponseDto> addInventory(
            @Valid @RequestBody AddInventoryRequestDto request) {

        InventoryResponseDto response = inventoryService.addInventory(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public List<InventoryResponseDto> getMyInventory() {
        return inventoryService.getMyInventory();
    }

    @PutMapping("/{inventoryId}")
    public InventoryResponseDto updateInventory(
            @PathVariable Long inventoryId,
            @Valid @RequestBody UpdateInventoryRequestDto request) {

        return inventoryService.updateInventory(inventoryId, request);
    }

    @DeleteMapping("/{inventoryId}")
    public ResponseEntity<Void> deleteInventory(@PathVariable Long inventoryId) {
        inventoryService.deleteInventory(inventoryId);
        return ResponseEntity.noContent().build();
    }

    // graph data - In stock / Low stock / Out of stock counts
    @GetMapping("/status-overview")
    public Map<String, Long> getStockStatusOverview() {
        return inventoryService.getStockStatusOverview();
    }
}
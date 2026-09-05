package com.healthapp.healthcare_monitoring_system.inventory.controller;

import com.healthapp.healthcare_monitoring_system.inventory.dto.AddInventoryRequestDto;
import com.healthapp.healthcare_monitoring_system.inventory.dto.InventoryResponseDto;
import com.healthapp.healthcare_monitoring_system.inventory.dto.UpdateInventoryRequestDto;
import com.healthapp.healthcare_monitoring_system.inventory.service.MedicineInventoryService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Inventory", description = "Medicine stock tracking. Automatically raises LOW_STOCK/OUT_OF_STOCK alerts when current stock crosses the minimum threshold.")
@RestController
@RequestMapping("/api/inventory")
public class MedicineInventoryController {

    private final MedicineInventoryService inventoryService;

    public MedicineInventoryController(MedicineInventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @Operation(
            summary = "Add inventory for a medicine",
            description = "Records current stock, minimum threshold, and expiry date for a medicine."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Inventory record created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request body (e.g. minimum stock greater than current stock)"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @PostMapping
    public ResponseEntity<InventoryResponseDto> addInventory(
            @Valid @RequestBody AddInventoryRequestDto request) {

        InventoryResponseDto response = inventoryService.addInventory(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(
            summary = "List my inventory",
            description = "Returns stock records for all of the logged-in patient's medicines."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned (may be empty)"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @GetMapping
    public List<InventoryResponseDto> getMyInventory() {
        return inventoryService.getMyInventory();
    }

    @Operation(
            summary = "Update inventory",
            description = "Updates current stock, minimum threshold, or expiry date for an inventory record. May trigger a stock alert."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inventory updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request body"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token"),
            @ApiResponse(responseCode = "404", description = "Inventory record not found, or doesn't belong to this user")
    })
    @PutMapping("/{inventoryId}")
    public InventoryResponseDto updateInventory(
            @Parameter(description = "ID of the inventory record to update") @PathVariable Long inventoryId,
            @Valid @RequestBody UpdateInventoryRequestDto request) {

        return inventoryService.updateInventory(inventoryId, request);
    }

    @Operation(
            summary = "Delete an inventory record",
            description = "Removes a stock record for a medicine."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token"),
            @ApiResponse(responseCode = "404", description = "Inventory record not found, or doesn't belong to this user")
    })
    @DeleteMapping("/{inventoryId}")
    public ResponseEntity<Void> deleteInventory(
            @Parameter(description = "ID of the inventory record to delete") @PathVariable Long inventoryId) {
        inventoryService.deleteInventory(inventoryId);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Stock status overview (for charts)",
            description = "Returns counts of medicines grouped by stock status: In Stock, Low Stock, Out of Stock. Used to render the dashboard pie/bar chart."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Overview returned"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @GetMapping("/status-overview")
    public Map<String, Long> getStockStatusOverview() {
        return inventoryService.getStockStatusOverview();
    }
}

package com.healthapp.healthcare_monitoring_system.medicine.controller;

import com.healthapp.healthcare_monitoring_system.medicine.dto.AddMedicineRequestDto;
import com.healthapp.healthcare_monitoring_system.medicine.dto.MedicineResponseDto;
import com.healthapp.healthcare_monitoring_system.medicine.dto.UpdateMedicineRequestDto;
import com.healthapp.healthcare_monitoring_system.medicine.service.MedicineService;

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

@Tag(name = "Medicine", description = "Add, view, update, and delete medicines. Adding a medicine also generates today's dose schedule immediately if its start date has already begun.")
@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    private final MedicineService medicineService;

    public MedicineController(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    // =========================================================
    // ADD MEDICINE
    // =========================================================

    @Operation(
            summary = "Add a new medicine",
            description = "Creates a medicine with its dosage, frequency, and schedule for the logged-in patient. " +
                    "If the start date is today or earlier, today's dose log is generated immediately so reminders " +
                    "don't have to wait for the nightly job."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Medicine created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request body (e.g. end date before start date)"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @PostMapping
    public ResponseEntity<MedicineResponseDto> addMedicine(
            @Valid @RequestBody AddMedicineRequestDto request) {

        MedicineResponseDto response =
                medicineService.addMedicine(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // =========================================================
    // GET MY MEDICINES
    // =========================================================

    @Operation(
            summary = "List my medicines",
            description = "Returns all medicines belonging to the logged-in patient."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List returned (may be empty)"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @GetMapping
    public ResponseEntity<List<MedicineResponseDto>> getMyMedicines() {

        List<MedicineResponseDto> medicines =
                medicineService.getMyMedicines();

        return ResponseEntity.ok(medicines);
    }

    // =========================================================
    // GET MEDICINE BY ID
    // =========================================================

    @Operation(
            summary = "Get a single medicine",
            description = "Returns full details for one medicine, only if it belongs to the logged-in patient."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Medicine found"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token"),
            @ApiResponse(responseCode = "404", description = "Medicine not found, or doesn't belong to this user")
    })
    @GetMapping("/{medicineId}")
    public ResponseEntity<MedicineResponseDto> getMedicineById(
            @Parameter(description = "ID of the medicine to fetch") @PathVariable Long medicineId) {

        MedicineResponseDto response =
                medicineService.getMedicine(medicineId);

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // UPDATE MEDICINE
    // =========================================================

    @Operation(
            summary = "Update a medicine",
            description = "Updates dosage, frequency, schedule, or notes for an existing medicine."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Medicine updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request body"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token"),
            @ApiResponse(responseCode = "404", description = "Medicine not found, or doesn't belong to this user")
    })
    @PutMapping("/{medicineId}")
    public ResponseEntity<MedicineResponseDto> updateMedicine(
            @Parameter(description = "ID of the medicine to update") @PathVariable Long medicineId,
            @Valid @RequestBody UpdateMedicineRequestDto request) {

        MedicineResponseDto response =
                medicineService.updateMedicine(
                        medicineId,
                        request
                );

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // DELETE MEDICINE
    // =========================================================

    @Operation(
            summary = "Delete a medicine",
            description = "Permanently deletes a medicine and its related schedules, dose logs, and reminders (cascade delete)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Medicine deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token"),
            @ApiResponse(responseCode = "404", description = "Medicine not found, or doesn't belong to this user")
    })
    @DeleteMapping("/{medicineId}")
    public ResponseEntity<Void> deleteMedicine(
            @Parameter(description = "ID of the medicine to delete") @PathVariable Long medicineId) {

        medicineService.deleteMedicine(medicineId);

        return ResponseEntity.noContent().build();
    }
}

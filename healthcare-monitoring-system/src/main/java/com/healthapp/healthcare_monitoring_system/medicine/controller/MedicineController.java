package com.healthapp.healthcare_monitoring_system.medicine.controller;

import com.healthapp.healthcare_monitoring_system.medicine.dto.AddMedicineRequestDto;
import com.healthapp.healthcare_monitoring_system.medicine.dto.MedicineResponseDto;
import com.healthapp.healthcare_monitoring_system.medicine.dto.UpdateMedicineRequestDto;
import com.healthapp.healthcare_monitoring_system.medicine.service.MedicineService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping
    public ResponseEntity<List<MedicineResponseDto>> getMyMedicines() {

        List<MedicineResponseDto> medicines =
                medicineService.getMyMedicines();

        return ResponseEntity.ok(medicines);
    }

    // =========================================================
    // GET MEDICINE BY ID
    // =========================================================

    @GetMapping("/{medicineId}")
    public ResponseEntity<MedicineResponseDto> getMedicineById(
            @PathVariable Long medicineId) {

        MedicineResponseDto response =
                medicineService.getMedicine(medicineId);

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // UPDATE MEDICINE
    // =========================================================

    @PutMapping("/{medicineId}")
    public ResponseEntity<MedicineResponseDto> updateMedicine(
            @PathVariable Long medicineId,
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

    @DeleteMapping("/{medicineId}")
    public ResponseEntity<Void> deleteMedicine(
            @PathVariable Long medicineId) {

        medicineService.deleteMedicine(medicineId);

        return ResponseEntity.noContent().build();
    }
}
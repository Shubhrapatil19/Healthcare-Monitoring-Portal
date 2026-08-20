package com.healthapp.healthcare_monitoring_system.medicine.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.healthapp.healthcare_monitoring_system.medicine.enums.MedicineFrequency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class AddMedicineRequestDto {

    @NotBlank(message = "Medicine name is required")
    @Size(
            max = 150,
            message = "Medicine name must not exceed 150 characters"
    )
    private String medicineName;

    @NotBlank(message = "Dosage is required")
    @Size(
            max = 100,
            message = "Dosage must not exceed 100 characters"
    )
    private String dosage;

    @NotNull(message = "Frequency is required")
    private MedicineFrequency frequency;

    @JsonFormat(
            pattern = "hh:mm a",
            locale = "en"
    )
    @NotEmpty(message = "At least one medicine time is required")
    private List<LocalTime> doseTimes;

    @JsonFormat(pattern = "dd-MM-yyyy")
    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @JsonFormat(pattern = "dd-MM-yyyy")
    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @Size(
            max = 500,
            message = "Notes must not exceed 500 characters"
    )
    private String notes;

    public AddMedicineRequestDto() {
    }

    public String getMedicineName() {
        return medicineName;
    }

    public void setMedicineName(String medicineName) {
        this.medicineName = medicineName;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public MedicineFrequency getFrequency() {
        return frequency;
    }

    public void setFrequency(MedicineFrequency frequency) {
        this.frequency = frequency;
    }

    public List<LocalTime> getDoseTimes() {
        return doseTimes;
    }

    public void setDoseTimes(List<LocalTime> doseTimes) {
        this.doseTimes = doseTimes;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
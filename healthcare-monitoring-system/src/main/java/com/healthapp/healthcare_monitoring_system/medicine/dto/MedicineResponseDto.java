package com.healthapp.healthcare_monitoring_system.medicine.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.healthapp.healthcare_monitoring_system.medicine.enums.MedicineFrequency;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class MedicineResponseDto {
    private Long id;

    private String medicineName;

    private String dosage;

    private MedicineFrequency frequency;

    @JsonFormat(pattern = "hh:mm a")
    private List<LocalTime> doseTimes;

    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate startDate;

    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate endDate;

    private String notes;

    private String status;

    public MedicineResponseDto() {
    }

    public MedicineResponseDto(
            Long id,
            String medicineName,
            String dosage,
            MedicineFrequency frequency,
            List<LocalTime> doseTimes,
            LocalDate startDate,
            LocalDate endDate,
            String notes,
            String status
    ) {
        this.id = id;
        this.medicineName = medicineName;
        this.dosage = dosage;
        this.frequency = frequency;
        this.doseTimes = doseTimes;
        this.startDate = startDate;
        this.endDate = endDate;
        this.notes = notes;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
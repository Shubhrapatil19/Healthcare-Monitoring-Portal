package com.healthapp.healthcare_monitoring_system.medicine.entity;

import jakarta.persistence.*;

import java.time.LocalTime;

@Entity
@Table(name = "medicine_schedule")
public class MedicineScheduleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "medicine_id", nullable = false)
    private MedicineEntity medicine;

    @Column(name = "dose_time", nullable = false)
    private LocalTime doseTime;

    public MedicineScheduleEntity() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public MedicineEntity getMedicine() {
        return medicine;
    }

    public void setMedicine(MedicineEntity medicine) {
        this.medicine = medicine;
    }

    public LocalTime getDoseTime() {
        return doseTime;
    }

    public void setDoseTime(LocalTime doseTime) {
        this.doseTime = doseTime;
    }
}
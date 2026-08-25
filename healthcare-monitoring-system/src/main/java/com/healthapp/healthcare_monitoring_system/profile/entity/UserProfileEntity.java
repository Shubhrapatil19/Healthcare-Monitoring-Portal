package com.healthapp.healthcare_monitoring_system.profile.entity;

import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_profile")
@Getter
@Setter
public class UserProfileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private RegisterEntity user;

    @Column(name = "age")
    private Integer age;

    // MALE, FEMALE, OTHER
    @Column(name = "gender", length = 20)
    private String gender;

    @Column(name = "disease_condition", length = 255)
    private String diseaseCondition;

    @Column(name = "contact1_relation", length = 50)
    private String contact1Relation;

    @Column(name = "contact1_phone", length = 20)
    private String contact1Phone;

    @Column(name = "contact2_relation", length = 50)
    private String contact2Relation;

    @Column(name = "contact2_phone", length = 20)
    private String contact2Phone;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
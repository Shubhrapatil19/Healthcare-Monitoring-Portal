package com.healthapp.healthcare_monitoring_system.auth.repository;

import com.healthapp.healthcare_monitoring_system.auth.entity.ForgotPasswordEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ForgotPasswordRepository
        extends JpaRepository<ForgotPasswordEntity, Long> {

    Optional<ForgotPasswordEntity> findByTokenHash(String tokenHash);
}
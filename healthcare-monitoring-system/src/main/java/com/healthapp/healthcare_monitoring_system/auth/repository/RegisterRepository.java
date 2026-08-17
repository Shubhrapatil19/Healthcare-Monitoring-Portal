package com.healthapp.healthcare_monitoring_system.auth.repository;

import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RegisterRepository extends JpaRepository<RegisterEntity, Long> {

    Optional<RegisterEntity> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    Optional<RegisterEntity> findByVerificationToken(String token);
}
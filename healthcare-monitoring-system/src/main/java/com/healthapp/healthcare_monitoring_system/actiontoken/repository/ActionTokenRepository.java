package com.healthapp.healthcare_monitoring_system.actiontoken.repository;

import com.healthapp.healthcare_monitoring_system.actiontoken.entity.ActionTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ActionTokenRepository extends JpaRepository<ActionTokenEntity, Long> {

    Optional<ActionTokenEntity> findByToken(String token);
}
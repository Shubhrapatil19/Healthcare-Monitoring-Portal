package com.healthapp.healthcare_monitoring_system.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponseDto {

    private String message;
    private String token;
    private String role;
}
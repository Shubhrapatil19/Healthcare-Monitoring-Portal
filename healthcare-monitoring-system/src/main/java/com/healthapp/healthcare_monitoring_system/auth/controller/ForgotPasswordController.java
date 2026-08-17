package com.healthapp.healthcare_monitoring_system.auth.controller;

import com.healthapp.healthcare_monitoring_system.auth.dto.ApiResponseDto;
import com.healthapp.healthcare_monitoring_system.auth.dto.ForgotPasswordRequestDto;
import com.healthapp.healthcare_monitoring_system.auth.dto.ResetPasswordRequestDto;
import com.healthapp.healthcare_monitoring_system.auth.service.ForgotPasswordService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class ForgotPasswordController {

    private final ForgotPasswordService forgotPasswordService;

    public ForgotPasswordController(
            ForgotPasswordService forgotPasswordService
    ) {
        this.forgotPasswordService =
                forgotPasswordService;
    }

    @PostMapping("/forgot-password")
    public ApiResponseDto forgotPassword(
            @Valid @RequestBody
            ForgotPasswordRequestDto request
    ) {

        return forgotPasswordService
                .forgotPassword(request);
    }

    @PostMapping("/reset-password")
    public ApiResponseDto resetPassword(
            @Valid @RequestBody
            ResetPasswordRequestDto request
    ) {

        return forgotPasswordService
                .resetPassword(request);
    }
}
package com.healthapp.healthcare_monitoring_system.auth.controller;

import com.healthapp.healthcare_monitoring_system.auth.dto.ApiResponseDto;
import com.healthapp.healthcare_monitoring_system.auth.dto.ForgotPasswordRequestDto;
import com.healthapp.healthcare_monitoring_system.auth.dto.ResetPasswordRequestDto;
import com.healthapp.healthcare_monitoring_system.auth.service.ForgotPasswordService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

@Tag(name = "Authentication")
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

    @Operation(
            summary = "Request a password reset",
            description = "Sends a password-reset email with a token/link if the email exists. Always returns success (doesn't reveal whether the email is registered)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Reset email sent (if the account exists)"),
            @ApiResponse(responseCode = "400", description = "Invalid request body")
    })
    @SecurityRequirements
    @PostMapping("/forgot-password")
    public ApiResponseDto forgotPassword(
            @Valid @RequestBody
            ForgotPasswordRequestDto request
    ) {

        return forgotPasswordService
                .forgotPassword(request);
    }

    @Operation(
            summary = "Reset password",
            description = "Sets a new password using the token from the password-reset email."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Password reset successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid or expired reset token")
    })
    @SecurityRequirements
    @PostMapping("/reset-password")
    public ApiResponseDto resetPassword(
            @Valid @RequestBody
            ResetPasswordRequestDto request
    ) {

        return forgotPasswordService
                .resetPassword(request);
    }
}

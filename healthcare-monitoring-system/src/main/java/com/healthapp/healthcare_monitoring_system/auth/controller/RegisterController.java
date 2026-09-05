package com.healthapp.healthcare_monitoring_system.auth.controller;

import com.healthapp.healthcare_monitoring_system.auth.dto.ApiResponseDto;
import com.healthapp.healthcare_monitoring_system.auth.dto.RegisterRequestDto;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;
import com.healthapp.healthcare_monitoring_system.auth.service.RegisterService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Authentication")
@RestController
@RequestMapping("/api/auth")
public class RegisterController {

    private final RegisterService registerService;
    private final RegisterRepository registerRepository;

    public RegisterController(
            RegisterService registerService,
            RegisterRepository registerRepository
    ) {
        this.registerService = registerService;
        this.registerRepository = registerRepository;
    }

    @Operation(
            summary = "Register a new account",
            description = "Creates a new patient account and sends a verification email with a confirmation link. " +
                    "The account cannot log in until the email is verified."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Account created, verification email sent"),
            @ApiResponse(responseCode = "400", description = "Invalid request body"),
            @ApiResponse(responseCode = "409", description = "Email already registered")
    })
    @SecurityRequirements
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponseDto register(
            @Valid @RequestBody RegisterRequestDto request
    ) {

        return registerService.register(request);
    }

    @Operation(
            summary = "Verify email",
            description = "Confirms a new account using the token from the verification email link."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Email verified successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid or expired verification token")
    })
    @SecurityRequirements
    @GetMapping("/verify-email")
    public ApiResponseDto verifyEmail(
            @Parameter(description = "Verification token from the email link") @RequestParam String token
    ) {

        var user =
                registerRepository
                        .findByVerificationToken(token)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Invalid verification token"
                                )
                        );

        if (user.getVerificationTokenExpiry() == null ||
                user.getVerificationTokenExpiry()
                        .isBefore(java.time.LocalDateTime.now())) {

            throw new IllegalArgumentException(
                    "Verification token has expired"
            );
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);

        registerRepository.save(user);

        return new ApiResponseDto(
                "Email verified successfully. You can now login."
        );
    }
}

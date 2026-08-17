package com.healthapp.healthcare_monitoring_system.auth.controller;

import com.healthapp.healthcare_monitoring_system.auth.dto.ApiResponseDto;
import com.healthapp.healthcare_monitoring_system.auth.dto.RegisterRequestDto;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;
import com.healthapp.healthcare_monitoring_system.auth.service.RegisterService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponseDto register(
            @Valid @RequestBody RegisterRequestDto request
    ) {

        return registerService.register(request);
    }

    @GetMapping("/verify-email")
    public ApiResponseDto verifyEmail(
            @RequestParam String token
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
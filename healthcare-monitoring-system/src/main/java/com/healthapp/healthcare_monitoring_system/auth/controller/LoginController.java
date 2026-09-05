package com.healthapp.healthcare_monitoring_system.auth.controller;

import com.healthapp.healthcare_monitoring_system.auth.dto.LoginRequestDto;
import com.healthapp.healthcare_monitoring_system.auth.dto.LoginResponseDto;
import com.healthapp.healthcare_monitoring_system.auth.service.LoginService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

@Tag(name = "Authentication", description = "Registration, login, email verification, and password reset. No JWT token required for any endpoint here.")
@RestController
@RequestMapping("/api/auth")
public class LoginController {

    private final LoginService loginService;

    public LoginController(LoginService loginService) {
        this.loginService = loginService;
    }

    @Operation(
            summary = "Login",
            description = "Authenticates with email + password and returns a JWT Bearer token to use in the \"Authorize\" button above for all other endpoints."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login successful, JWT token returned"),
            @ApiResponse(responseCode = "400", description = "Missing/invalid request fields"),
            @ApiResponse(responseCode = "401", description = "Incorrect email or password"),
            @ApiResponse(responseCode = "403", description = "Email not verified yet")
    })
    @SecurityRequirements
    @PostMapping("/login")
    public LoginResponseDto login(
            @Valid @RequestBody LoginRequestDto request
    ) {

        return loginService.login(request);
    }
}

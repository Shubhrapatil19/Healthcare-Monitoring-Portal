package com.healthapp.healthcare_monitoring_system.auth.controller;

import com.healthapp.healthcare_monitoring_system.auth.dto.LoginRequestDto;
import com.healthapp.healthcare_monitoring_system.auth.dto.LoginResponseDto;
import com.healthapp.healthcare_monitoring_system.auth.service.LoginService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class LoginController {

    private final LoginService loginService;

    public LoginController(LoginService loginService) {
        this.loginService = loginService;
    }

    @PostMapping("/login")
    public LoginResponseDto login(
            @Valid @RequestBody LoginRequestDto request
    ) {

        return loginService.login(request);
    }
}
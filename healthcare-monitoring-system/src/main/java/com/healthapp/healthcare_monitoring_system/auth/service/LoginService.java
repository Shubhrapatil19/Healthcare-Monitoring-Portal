package com.healthapp.healthcare_monitoring_system.auth.service;

import com.healthapp.healthcare_monitoring_system.auth.dto.LoginRequestDto;
import com.healthapp.healthcare_monitoring_system.auth.dto.LoginResponseDto;
import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;
import com.healthapp.healthcare_monitoring_system.auth.security.JwtService;
import com.healthapp.healthcare_monitoring_system.auth.exception.UnauthorizedException;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class LoginService {

    private final RegisterRepository registerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginService(
            RegisterRepository registerRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.registerRepository = registerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponseDto login(
            LoginRequestDto request
    ) {

        RegisterEntity user =
                registerRepository
                        .findByEmailIgnoreCase(
                                request.getEmail()
                        )
                        .orElseThrow(() ->
                                new UnauthorizedException(
                                        "Invalid email or password"
                                )
                        );

        if (!user.isEmailVerified()) {

            throw new UnauthorizedException(
                    "Please verify your email before login"
            );
        }

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash()
        )) {

            throw new UnauthorizedException(
                    "Invalid email or password"
            );
        }

        boolean rememberMe =
                Boolean.TRUE.equals(
                        request.getRememberMe()
                );

        String token =
                jwtService.generateToken(
                        user.getId(),
                        user.getEmail(),
                        user.getRole(),
                        rememberMe
                );

        return new LoginResponseDto(
                "Login successful",
                token,
                user.getRole()
        );
    }
}
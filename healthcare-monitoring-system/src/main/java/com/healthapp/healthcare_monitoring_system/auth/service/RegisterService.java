package com.healthapp.healthcare_monitoring_system.auth.service;

import com.healthapp.healthcare_monitoring_system.auth.dto.ApiResponseDto;
import com.healthapp.healthcare_monitoring_system.auth.dto.RegisterRequestDto;
import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;
import com.healthapp.healthcare_monitoring_system.auth.exception.BadRequestException;

import com.healthapp.healthcare_monitoring_system.sms.util.IndianMobileNumberUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class RegisterService {

    private final RegisterRepository registerRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public RegisterService(
            RegisterRepository registerRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService
    ) {
        this.registerRepository = registerRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Transactional
    public ApiResponseDto register(
            RegisterRequestDto request
    ) {

        if (!request.getPassword()
                .equals(request.getConfirmPassword())) {

            throw new BadRequestException(
                    "Password and confirm password do not match"
            );
        }

        RegisterEntity existingUser =
                registerRepository
                        .findByEmailIgnoreCase(
                                request.getEmail()
                        )
                        .orElse(null);

        if (existingUser != null &&
                existingUser.isEmailVerified()) {

            throw new BadRequestException(
                    "Email is already registered"
            );
        }

        String token =
                TokenUtil.generateToken();

        RegisterEntity user;

        if (existingUser != null) {

            user = existingUser;

            user.setFullName(request.getFullName());
            user.setMobile(
                    IndianMobileNumberUtil.normalize(request.getMobile())
            );
            user.setPasswordHash(
                    passwordEncoder.encode(
                            request.getPassword()
                    )
            );

        } else {

            user = RegisterEntity.builder()
                    .fullName(request.getFullName())
                    .email(request.getEmail().toLowerCase())
                    .mobile(
                            IndianMobileNumberUtil.normalize(request.getMobile())
                    )
                    .passwordHash(
                            passwordEncoder.encode(
                                    request.getPassword()
                            )
                    )
                    .role("USER")
                    .emailVerified(false)
                    .build();
        }

        user.setVerificationToken(token);

        user.setVerificationTokenExpiry(
                LocalDateTime.now()
                        .plusHours(24)
        );

        registerRepository.save(user);

        emailService.sendVerificationEmail(
                user.getEmail(),
                user.getFullName(),
                token
        );

        return new ApiResponseDto(
                "Registration successful. Please check your email and verify your account."
        );
    }
}
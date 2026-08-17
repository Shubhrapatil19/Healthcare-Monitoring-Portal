package com.healthapp.healthcare_monitoring_system.auth.service;

import com.healthapp.healthcare_monitoring_system.auth.dto.ApiResponseDto;
import com.healthapp.healthcare_monitoring_system.auth.dto.ForgotPasswordRequestDto;
import com.healthapp.healthcare_monitoring_system.auth.dto.ResetPasswordRequestDto;
import com.healthapp.healthcare_monitoring_system.auth.entity.ForgotPasswordEntity;
import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import com.healthapp.healthcare_monitoring_system.auth.exception.BadRequestException;
import com.healthapp.healthcare_monitoring_system.auth.repository.ForgotPasswordRepository;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ForgotPasswordService {

    private final RegisterRepository registerRepository;
    private final ForgotPasswordRepository forgotPasswordRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public ForgotPasswordService(
            RegisterRepository registerRepository,
            ForgotPasswordRepository forgotPasswordRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService
    ) {
        this.registerRepository = registerRepository;
        this.forgotPasswordRepository = forgotPasswordRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Transactional
    public ApiResponseDto forgotPassword(
            ForgotPasswordRequestDto request
    ) {

        RegisterEntity user =
                registerRepository
                        .findByEmailIgnoreCase(
                                request.getEmail()
                        )
                        .orElseThrow(() ->
                                new BadRequestException(
                                        "No account found with this email"
                                )
                        );

        if (!user.isEmailVerified()) {

            throw new BadRequestException(
                    "Please verify your email first"
            );
        }

        String rawToken =
                TokenUtil.generateToken();

        String tokenHash =
                TokenUtil.hashToken(rawToken);

        ForgotPasswordEntity resetToken =
                ForgotPasswordEntity.builder()
                        .userId(user.getId())
                        .tokenHash(tokenHash)
                        .tokenExpiry(
                                LocalDateTime.now()
                                        .plusMinutes(30)
                        )
                        .used(false)
                        .build();

        forgotPasswordRepository.save(resetToken);

        emailService.sendPasswordResetEmail(
                user.getEmail(),
                user.getFullName(),
                rawToken
        );

        return new ApiResponseDto(
                "Password reset link has been sent to your email"
        );
    }

    @Transactional
    public ApiResponseDto resetPassword(
            ResetPasswordRequestDto request
    ) {

        if (!request.getNewPassword()
                .equals(request.getConfirmPassword())) {

            throw new BadRequestException(
                    "Password and confirm password do not match"
            );
        }

        String tokenHash =
                TokenUtil.hashToken(
                        request.getToken()
                );

        ForgotPasswordEntity resetToken =
                forgotPasswordRepository
                        .findByTokenHash(tokenHash)
                        .orElseThrow(() ->
                                new BadRequestException(
                                        "Invalid reset token"
                                )
                        );

        if (resetToken.isUsed()) {

            throw new BadRequestException(
                    "Reset token has already been used"
            );
        }

        if (resetToken.getTokenExpiry()
                .isBefore(LocalDateTime.now())) {

            throw new BadRequestException(
                    "Reset token has expired"
            );
        }

        RegisterEntity user =
                registerRepository
                        .findById(
                                resetToken.getUserId()
                        )
                        .orElseThrow(() ->
                                new BadRequestException(
                                        "User not found"
                                )
                        );

        user.setPasswordHash(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );

        registerRepository.save(user);

        resetToken.setUsed(true);

        forgotPasswordRepository.save(resetToken);

        return new ApiResponseDto(
                "Password reset successfully. Please login with your new password."
        );
    }
}
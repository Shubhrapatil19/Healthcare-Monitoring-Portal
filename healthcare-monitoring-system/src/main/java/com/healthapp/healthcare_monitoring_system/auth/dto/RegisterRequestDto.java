package com.healthapp.healthcare_monitoring_system.auth.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequestDto {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 150, message = "Full name must be between 2 and 150 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Mobile number is required")
    @Pattern(
            regexp = "^[6-9][0-9]{9}$",
            message = "Please provide a valid Indian 10 digit mobile number"
    )
    private String mobile;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must contain at least 8 characters")
    private String password;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;
}
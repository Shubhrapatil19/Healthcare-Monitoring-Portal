package com.healthapp.healthcare_monitoring_system.profile.controller;

import com.healthapp.healthcare_monitoring_system.profile.dto.ProfileResponseDto;
import com.healthapp.healthcare_monitoring_system.profile.dto.UpdateProfileRequestDto;
import com.healthapp.healthcare_monitoring_system.profile.service.ProfileService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Profile", description = "Patient's personal/medical profile: age, gender, condition, and emergency contact details (currently phone-based).")
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @Operation(
            summary = "Get my profile",
            description = "Returns the logged-in patient's profile, including emergency contact 1 and 2 details."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profile returned"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @GetMapping
    public ProfileResponseDto getMyProfile() {
        return profileService.getMyProfile();
    }

    @Operation(
            summary = "Update my profile",
            description = "Creates or updates age, gender, medical condition, and emergency contact 1/2 details."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profile updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request body"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @PutMapping
    public ProfileResponseDto updateProfile(@Valid @RequestBody UpdateProfileRequestDto request) {
        return profileService.updateProfile(request);
    }
}

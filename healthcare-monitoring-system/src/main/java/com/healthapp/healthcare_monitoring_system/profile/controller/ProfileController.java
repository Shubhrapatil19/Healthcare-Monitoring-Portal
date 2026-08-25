package com.healthapp.healthcare_monitoring_system.profile.controller;

import com.healthapp.healthcare_monitoring_system.profile.dto.ProfileResponseDto;
import com.healthapp.healthcare_monitoring_system.profile.dto.UpdateProfileRequestDto;
import com.healthapp.healthcare_monitoring_system.profile.service.ProfileService;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ProfileResponseDto getMyProfile() {
        return profileService.getMyProfile();
    }

    @PutMapping
    public ProfileResponseDto updateProfile(@Valid @RequestBody UpdateProfileRequestDto request) {
        return profileService.updateProfile(request);
    }
}
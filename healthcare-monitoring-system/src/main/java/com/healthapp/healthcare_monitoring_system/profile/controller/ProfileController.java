package com.healthapp.healthcare_monitoring_system.profile.controller;

import com.healthapp.healthcare_monitoring_system.profile.dto.ProfileResponseDto;
import com.healthapp.healthcare_monitoring_system.profile.dto.UpdateProfileRequestDto;
import com.healthapp.healthcare_monitoring_system.profile.service.ProfileService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "Profile", description = "Patient's personal/medical profile: age, gender, condition, profile photo, and emergency contact details (currently phone-based).")
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @Operation(
            summary = "Get my profile",
            description = "Returns the logged-in patient's profile, including profile photo URL and emergency contact 1 and 2 details."
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

    @Operation(
            summary = "Upload / replace profile photo",
            description = "Uploads a new profile photo, replacing the existing one if present. " +
                    "Only JPG and PNG files are accepted, maximum size 5MB. Send as multipart/form-data with field name \"file\"."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Photo uploaded successfully, updated profile returned"),
            @ApiResponse(responseCode = "400", description = "File missing, too large (>5MB), or not a JPG/PNG"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProfileResponseDto uploadPhoto(@RequestParam("file") MultipartFile file) {
        return profileService.uploadPhoto(file);
    }

    @Operation(
            summary = "Delete profile photo",
            description = "Removes the logged-in patient's current profile photo, if one is set."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Photo removed successfully, updated profile returned"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid JWT token")
    })
    @DeleteMapping("/photo")
    public ProfileResponseDto deletePhoto() {
        return profileService.deletePhoto();
    }
}

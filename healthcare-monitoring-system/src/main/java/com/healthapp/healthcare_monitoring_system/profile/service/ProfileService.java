package com.healthapp.healthcare_monitoring_system.profile.service;

import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;
import com.healthapp.healthcare_monitoring_system.profile.dto.ProfileResponseDto;
import com.healthapp.healthcare_monitoring_system.profile.dto.UpdateProfileRequestDto;
import com.healthapp.healthcare_monitoring_system.profile.entity.UserProfileEntity;
import com.healthapp.healthcare_monitoring_system.profile.repository.UserProfileRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProfileService {

    private final RegisterRepository registerRepository;
    private final UserProfileRepository profileRepository;

    // fullName + email + mobile (always present) + age + gender + diseaseCondition
    // + contact1Relation + contact1Phone + contact2Relation + contact2Phone
    private static final int TOTAL_FIELDS = 10;

    public ProfileService(RegisterRepository registerRepository, UserProfileRepository profileRepository) {
        this.registerRepository = registerRepository;
        this.profileRepository = profileRepository;
    }

    /** Returns the profile, auto-creating an empty extension row the first time it's requested. */
    public ProfileResponseDto getMyProfile() {

        RegisterEntity user = getLoggedInUser();
        UserProfileEntity profile = getOrCreateProfile(user);

        return convertToResponse(user, profile);
    }

    public ProfileResponseDto updateProfile(UpdateProfileRequestDto request) {

        RegisterEntity user = getLoggedInUser();
        UserProfileEntity profile = getOrCreateProfile(user);

        // base register fields
        user.setFullName(request.getFullName().trim());
        user.setMobile(request.getMobile().trim());
        registerRepository.save(user);

        // extended profile fields
        profile.setAge(request.getAge());
        profile.setGender(request.getGender());
        profile.setDiseaseCondition(blankToNull(request.getDiseaseCondition()));
        profile.setContact1Relation(blankToNull(request.getContact1Relation()));
        profile.setContact1Phone(blankToNull(request.getContact1Phone()));
        profile.setContact2Relation(blankToNull(request.getContact2Relation()));
        profile.setContact2Phone(blankToNull(request.getContact2Phone()));

        UserProfileEntity saved = profileRepository.save(profile);

        return convertToResponse(user, saved);
    }

    private UserProfileEntity getOrCreateProfile(RegisterEntity user) {

        return profileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserProfileEntity newProfile = new UserProfileEntity();
                    newProfile.setUser(user);
                    return profileRepository.save(newProfile);
                });
    }

    /** Simple filled-field / total-field ratio, rounded to nearest whole percent. */
    private int calculateCompletion(RegisterEntity user, UserProfileEntity profile) {

        int filled = 0;

        if (isFilled(user.getFullName())) filled++;
        if (isFilled(user.getEmail())) filled++;
        if (isFilled(user.getMobile())) filled++;
        if (profile.getAge() != null) filled++;
        if (isFilled(profile.getGender())) filled++;
        if (isFilled(profile.getDiseaseCondition())) filled++;
        if (isFilled(profile.getContact1Relation())) filled++;
        if (isFilled(profile.getContact1Phone())) filled++;
        if (isFilled(profile.getContact2Relation())) filled++;
        if (isFilled(profile.getContact2Phone())) filled++;

        return Math.round((filled * 100f) / TOTAL_FIELDS);
    }

    private boolean isFilled(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String blankToNull(String value) {
        return (value == null || value.trim().isEmpty()) ? null : value.trim();
    }

    private RegisterEntity getLoggedInUser() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("Authentication required. Please provide a valid Bearer token.");
        }

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof Long userId)) {
            throw new IllegalArgumentException("Invalid authenticated user.");
        }

        return registerRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Logged-in user not found."));
    }

    private ProfileResponseDto convertToResponse(RegisterEntity user, UserProfileEntity profile) {

        return new ProfileResponseDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getMobile(),
                profile.getAge(),
                profile.getGender() != null ? profile.getGender() : "Not specified",
                profile.getDiseaseCondition() != null ? profile.getDiseaseCondition() : "Other",
                profile.getContact1Relation(),
                profile.getContact1Phone(),
                profile.getContact2Relation(),
                profile.getContact2Phone(),
                calculateCompletion(user, profile)
        );
    }
}
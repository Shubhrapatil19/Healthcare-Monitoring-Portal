package com.healthapp.healthcare_monitoring_system.profile.service;

import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import com.healthapp.healthcare_monitoring_system.auth.exception.BadRequestException;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;
import com.healthapp.healthcare_monitoring_system.notification.enums.NotificationType;
import com.healthapp.healthcare_monitoring_system.notification.service.NotificationService;
import com.healthapp.healthcare_monitoring_system.profile.dto.ProfileResponseDto;
import com.healthapp.healthcare_monitoring_system.profile.dto.UpdateProfileRequestDto;
import com.healthapp.healthcare_monitoring_system.profile.entity.UserProfileEntity;
import com.healthapp.healthcare_monitoring_system.profile.enums.DiseaseCondition;
import com.healthapp.healthcare_monitoring_system.profile.repository.UserProfileRepository;

import com.healthapp.healthcare_monitoring_system.common.util.IndianMobileNumberUtil;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProfileService {

    private final RegisterRepository registerRepository;
    private final UserProfileRepository profileRepository;
    private final NotificationService notificationService;

    // fullName + email + mobile (always present) + age + gender + diseaseCondition
    // + contact1Relation + contact1Phone + contact2Relation + contact2Phone
    private static final int TOTAL_FIELDS = 10;

    // ---- "Other" medical condition free-text rules ----
    // Kept short on purpose: this is a condition NAME, not a description, so a
    // patient can't paste a paragraph in here.
    private static final int OTHER_CONDITION_MAX_WORDS = 6;
    private static final int OTHER_CONDITION_MAX_LENGTH = 60;

    // ---- Profile photo rules ----
    private static final long MAX_PHOTO_SIZE_BYTES = 5L * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png");
    private static final String PHOTO_SUBFOLDER = "profile-photos";

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.backend-url}")
    private String backendUrl;

    public ProfileService(RegisterRepository registerRepository, UserProfileRepository profileRepository,
                          NotificationService notificationService) {
        this.registerRepository = registerRepository;
        this.profileRepository = profileRepository;
        this.notificationService = notificationService;
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
        user.setMobile(IndianMobileNumberUtil.normalize(request.getMobile()));
        registerRepository.save(user);

        // extended profile fields
        profile.setAge(request.getAge());
        profile.setGender(request.getGender());

        String storedConditions = buildDiseaseConditionValue(
                request.getDiseaseConditions(),
                request.getDiseaseConditionOther()
        );
        profile.setDiseaseCondition(storedConditions);
        profile.setDiseaseConditionOther(
                containsOther(storedConditions) ? request.getDiseaseConditionOther().trim() : null
        );

        profile.setContact1Relation(blankToNull(request.getContact1Relation()));
        profile.setContact1Phone(
                request.getContact1Phone() == null || request.getContact1Phone().trim().isEmpty()
                        ? null
                        : IndianMobileNumberUtil.normalize(request.getContact1Phone())
        );
        profile.setContact2Relation(blankToNull(request.getContact2Relation()));
        profile.setContact2Phone(
                request.getContact2Phone() == null || request.getContact2Phone().trim().isEmpty()
                        ? null
                        : IndianMobileNumberUtil.normalize(request.getContact2Phone())
        );

        UserProfileEntity saved = profileRepository.save(profile);

        notificationService.notify(
                user,
                NotificationType.SUCCESS,
                "Profile Updated",
                "Your profile has been updated successfully."
        );

        return convertToResponse(user, saved);
    }

    // =========================================================
    // PROFILE PHOTO — upload / replace / delete
    // =========================================================

    /**
     * Uploads (or replaces, if one already exists) the logged-in user's profile photo.
     * Validates size (max 5MB) and type (JPG/PNG only) before saving anything to disk.
     */
    public ProfileResponseDto uploadPhoto(MultipartFile file) {

        RegisterEntity user = getLoggedInUser();
        UserProfileEntity profile = getOrCreateProfile(user);

        validatePhoto(file);

        // remove the old photo file (if any) so orphaned files don't pile up on disk
        deletePhotoFileQuietly(profile.getProfilePhotoPath());

        String extension = getExtension(file.getOriginalFilename());
        String newFileName = "user-" + user.getId() + "-" + UUID.randomUUID() + "." + extension;

        try {
            Path targetDir = Paths.get(uploadDir, PHOTO_SUBFOLDER);
            Files.createDirectories(targetDir);

            Path targetPath = targetDir.resolve(newFileName);
            file.transferTo(targetPath);

        } catch (IOException e) {
            throw new RuntimeException("Failed to save the uploaded photo. Please try again.", e);
        }

        String relativePath = "/uploads/" + PHOTO_SUBFOLDER + "/" + newFileName;
        profile.setProfilePhotoPath(relativePath);
        UserProfileEntity saved = profileRepository.save(profile);

        return convertToResponse(user, saved);
    }

    /** Removes the logged-in user's profile photo, both the file on disk and the DB reference. */
    public ProfileResponseDto deletePhoto() {

        RegisterEntity user = getLoggedInUser();
        UserProfileEntity profile = getOrCreateProfile(user);

        deletePhotoFileQuietly(profile.getProfilePhotoPath());
        profile.setProfilePhotoPath(null);
        UserProfileEntity saved = profileRepository.save(profile);

        return convertToResponse(user, saved);
    }

    private void validatePhoto(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select a photo to upload.");
        }

        if (file.getSize() > MAX_PHOTO_SIZE_BYTES) {
            throw new BadRequestException("Photo is too large. Maximum allowed size is 5MB.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Invalid file type. Only JPG and PNG images are allowed.");
        }

        String extension = getExtension(file.getOriginalFilename());
        if (extension == null || !ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new BadRequestException("Invalid file type. Only JPG and PNG images are allowed.");
        }
    }

    private String getExtension(String filename) {

        if (filename == null || !filename.contains(".")) {
            return null;
        }

        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    /** Deletes the physical photo file if it exists. Never throws — a missing/locked file shouldn't break the request. */
    private void deletePhotoFileQuietly(String relativePath) {

        if (relativePath == null || relativePath.isBlank()) {
            return;
        }

        try {
            String fileName = relativePath.substring(relativePath.lastIndexOf('/') + 1);
            Path filePath = Paths.get(uploadDir, PHOTO_SUBFOLDER, fileName);
            Files.deleteIfExists(filePath);
        } catch (Exception ignored) {
            // best-effort cleanup only
        }
    }

    // =========================================================
    // MEDICAL CONDITION — multi-select + "Other" free text
    // =========================================================

    /**
     * Validates the selected condition codes and returns the value to persist
     * (comma-separated codes, e.g. "DIABETES,HYPERTENSION"), or null if nothing selected.
     *
     * Rules enforced here (mirrors the frontend, but the backend is the source of truth):
     *  - every code must be one of DiseaseCondition.ALLOWED_CODES
     *  - "NONE" cannot be combined with anything else
     *  - "OTHER" requires diseaseConditionOther, capped at a few words so patients
     *    can't paste a paragraph in there
     */
    private String buildDiseaseConditionValue(List<String> diseaseConditions, String otherText) {

        if (diseaseConditions == null || diseaseConditions.isEmpty()) {
            return null;
        }

        List<String> codes = diseaseConditions.stream()
                .filter(c -> c != null && !c.isBlank())
                .map(c -> c.trim().toUpperCase())
                .distinct()
                .collect(Collectors.toList());

        if (codes.isEmpty()) {
            return null;
        }

        for (String code : codes) {
            if (!DiseaseCondition.ALLOWED_CODES.contains(code)) {
                throw new BadRequestException("Invalid medical condition: " + code);
            }
        }

        if (codes.contains(DiseaseCondition.NONE.name()) && codes.size() > 1) {
            throw new BadRequestException(
                    "\"No Medical Condition / None\" cannot be selected together with other conditions."
            );
        }

        if (codes.contains(DiseaseCondition.OTHER.name())) {
            validateOtherConditionText(otherText);
        }

        return String.join(",", codes);
    }

    private void validateOtherConditionText(String otherText) {

        if (otherText == null || otherText.trim().isEmpty()) {
            throw new BadRequestException("Please specify your medical condition in the \"Other\" field.");
        }

        String trimmed = otherText.trim();

        if (trimmed.contains("\n") || trimmed.contains("\r")) {
            throw new BadRequestException("Medical condition must be a single line, not a paragraph.");
        }

        if (trimmed.length() > OTHER_CONDITION_MAX_LENGTH) {
            throw new BadRequestException(
                    "Medical condition must not exceed " + OTHER_CONDITION_MAX_LENGTH + " characters."
            );
        }

        int wordCount = trimmed.split("\\s+").length;
        if (wordCount > OTHER_CONDITION_MAX_WORDS) {
            throw new BadRequestException(
                    "Medical condition must not exceed " + OTHER_CONDITION_MAX_WORDS + " words."
            );
        }
    }

    private boolean containsOther(String storedConditions) {
        return storedConditions != null
                && Arrays.asList(storedConditions.split(",")).contains(DiseaseCondition.OTHER.name());
    }

    /** Turns the stored "DIABETES,HYPERTENSION" string back into a list for the API response. */
    private List<String> parseDiseaseConditions(String storedConditions) {
        if (storedConditions == null || storedConditions.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(storedConditions.split(","))
                .filter(c -> !c.isBlank())
                .collect(Collectors.toList());
    }

    // =========================================================

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

        String photoUrl = (profile.getProfilePhotoPath() == null || profile.getProfilePhotoPath().isBlank())
                ? null
                : backendUrl + profile.getProfilePhotoPath();

        return new ProfileResponseDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getMobile(),
                photoUrl,
                profile.getAge(),
                profile.getGender() != null ? profile.getGender() : "Not specified",
                parseDiseaseConditions(profile.getDiseaseCondition()),
                profile.getDiseaseConditionOther(),
                profile.getContact1Relation(),
                profile.getContact1Phone(),
                profile.getContact2Relation(),
                profile.getContact2Phone(),
                calculateCompletion(user, profile)
        );
    }
}


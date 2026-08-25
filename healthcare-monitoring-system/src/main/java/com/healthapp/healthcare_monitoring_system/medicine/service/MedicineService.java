package com.healthapp.healthcare_monitoring_system.medicine.service;
import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;
import com.healthapp.healthcare_monitoring_system.medicine.dto.AddMedicineRequestDto;
import com.healthapp.healthcare_monitoring_system.medicine.dto.MedicineResponseDto;
import com.healthapp.healthcare_monitoring_system.medicine.dto.UpdateMedicineRequestDto;
import com.healthapp.healthcare_monitoring_system.medicine.entity.MedicineEntity;
import com.healthapp.healthcare_monitoring_system.medicine.entity.MedicineScheduleEntity;
import com.healthapp.healthcare_monitoring_system.medicine.enums.MedicineFrequency;
import com.healthapp.healthcare_monitoring_system.medicine.repository.MedicineRepository;
import com.healthapp.healthcare_monitoring_system.notification.enums.NotificationType;
import com.healthapp.healthcare_monitoring_system.notification.service.NotificationService;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class MedicineService {

    private final MedicineRepository medicineRepository;
    private final RegisterRepository registerRepository;
    private final NotificationService notificationService;

    public MedicineService(
            MedicineRepository medicineRepository,
            RegisterRepository registerRepository,
            NotificationService notificationService
    ) {
        this.medicineRepository = medicineRepository;
        this.registerRepository = registerRepository;
        this.notificationService = notificationService;
    }

    /**
     * Add a new medicine for the logged-in user.
     */
    public MedicineResponseDto addMedicine(
            AddMedicineRequestDto request
    ) {

        RegisterEntity user = getLoggedInUser();

        validateMedicineRequest(
                request.getFrequency(),
                request.getDoseTimes(),
                request.getStartDate(),
                request.getEndDate()
        );

        MedicineEntity medicine = new MedicineEntity();

        medicine.setUser(user);
        medicine.setMedicineName(request.getMedicineName().trim());
        medicine.setDosage(request.getDosage().trim());
        medicine.setFrequency(request.getFrequency());
        medicine.setStartDate(request.getStartDate());
        medicine.setEndDate(request.getEndDate());
        medicine.setNotes(
                request.getNotes() == null
                        ? null
                        : request.getNotes().trim()
        );

        for (LocalTime doseTime : request.getDoseTimes()) {

            MedicineScheduleEntity schedule =
                    new MedicineScheduleEntity();

            schedule.setDoseTime(doseTime);

            medicine.addSchedule(schedule);
        }

        MedicineEntity savedMedicine =
                medicineRepository.save(medicine);

        notificationService.notify(
                user,
                NotificationType.SUCCESS,
                "Medicine Added",
                savedMedicine.getMedicineName() + " has been added successfully."
        );

        return convertToResponse(savedMedicine);
    }

    /**
     * Get all active/upcoming medicines of the logged-in user.
     */
    @Transactional(readOnly = true)
    public List<MedicineResponseDto> getMyMedicines() {

        RegisterEntity user = getLoggedInUser();

        LocalDate today = LocalDate.now();

        return medicineRepository.findByUserId(user.getId())
                .stream()
                .filter(medicine ->
                        !medicine.getEndDate().isBefore(today)
                )
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get one medicine of the logged-in user.
     */
    @Transactional(readOnly = true)
    public MedicineResponseDto getMedicine(
            Long medicineId
    ) {

        RegisterEntity user = getLoggedInUser();

        MedicineEntity medicine =
                getMedicineForUser(
                        user.getId(),
                        medicineId
                );

        return convertToResponse(medicine);
    }

    /**
     * Update an existing medicine.
     */
    public MedicineResponseDto updateMedicine(
            Long medicineId,
            UpdateMedicineRequestDto request
    ) {

        RegisterEntity user = getLoggedInUser();

        MedicineEntity medicine =
                getMedicineForUser(
                        user.getId(),
                        medicineId
                );

        validateMedicineRequest(
                request.getFrequency(),
                request.getDoseTimes(),
                request.getStartDate(),
                request.getEndDate()
        );

        medicine.setMedicineName(request.getMedicineName().trim());
        medicine.setDosage(request.getDosage().trim());
        medicine.setFrequency(request.getFrequency());
        medicine.setStartDate(request.getStartDate());
        medicine.setEndDate(request.getEndDate());
        medicine.setNotes(
                request.getNotes() == null
                        ? null
                        : request.getNotes().trim()
        );

        /*
         * Remove old schedules.
         * orphanRemoval=true will remove them from database.
         */
        medicine.getSchedules().clear();

        /*
         * Create new schedules according to updated times.
         */
        for (LocalTime doseTime : request.getDoseTimes()) {

            MedicineScheduleEntity schedule =
                    new MedicineScheduleEntity();

            schedule.setDoseTime(doseTime);

            medicine.addSchedule(schedule);
        }

        MedicineEntity updatedMedicine =
                medicineRepository.save(medicine);

        return convertToResponse(updatedMedicine);
    }

    /**
     * Delete a medicine of the logged-in user.
     */
    public void deleteMedicine(
            Long medicineId
    ) {

        RegisterEntity user = getLoggedInUser();

        MedicineEntity medicine =
                getMedicineForUser(
                        user.getId(),
                        medicineId
                );

        medicineRepository.delete(medicine);
    }

    /**
     * Validate frequency, dose times and dates.
     */
    private void validateMedicineRequest(
            MedicineFrequency frequency,
            List<LocalTime> doseTimes,
            LocalDate startDate,
            LocalDate endDate
    ) {

        if (frequency == null) {
            throw new IllegalArgumentException(
                    "Frequency is required"
            );
        }

        if (doseTimes == null || doseTimes.isEmpty()) {
            throw new IllegalArgumentException(
                    "At least one medicine time is required"
            );
        }

        /*
         * Start date cannot be in the past.
         */
        if (startDate == null) {
            throw new IllegalArgumentException(
                    "Start date is required"
            );
        }

        if (startDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "Start date cannot be in the past. Please select current or future date."
            );
        }

        /*
         * End date is mandatory.
         */
        if (endDate == null) {
            throw new IllegalArgumentException(
                    "End date is required"
            );
        }

        /*
         * End date cannot be before start date.
         */
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException(
                    "End date cannot be before start date."
            );
        }

        /*
         * Validate number of times according to frequency.
         */
        int expectedTimes =
                getExpectedDoseTimeCount(frequency);

        if (doseTimes.size() != expectedTimes) {

            throw new IllegalArgumentException(
                    frequency + " requires exactly "
                            + expectedTimes
                            + " medicine time(s)."
            );
        }

        /*
         * Prevent duplicate medicine times.
         */
        Set<LocalTime> uniqueTimes =
                new HashSet<>(doseTimes);

        if (uniqueTimes.size() != doseTimes.size()) {

            throw new IllegalArgumentException(
                    "Medicine times must be different."
            );
        }
    }

    /**
     * Returns how many times medicine can be scheduled
     * according to the selected frequency.
     */
    private int getExpectedDoseTimeCount(
            MedicineFrequency frequency
    ) {

        return switch (frequency) {

            case ONCE_A_DAY -> 1;

            case TWICE_A_DAY -> 2;

            case THRICE_A_DAY -> 3;

            case AS_NEEDED -> 1;

            case WEEKLY -> 1;
        };
    }

    /**
     * Get currently logged-in user from JWT authentication.
     *
     * JwtAuthenticationFilter stores user's userId
     * as authentication principal.
     */
    private RegisterEntity getLoggedInUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new IllegalArgumentException(
                    "Authentication required. Please provide a valid Bearer token."
            );
        }

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof Long userId)) {

            throw new IllegalArgumentException(
                    "Invalid authenticated user."
            );
        }

        return registerRepository
                .findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Logged-in user not found."
                        )
                );
    }

    /**
     * Find medicine and make sure it belongs to the logged-in user.
     */
    private MedicineEntity getMedicineForUser(
            Long userId,
            Long medicineId
    ) {

        return medicineRepository
                .findByIdAndUserId(
                        medicineId,
                        userId
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Medicine not found."
                        )
                );
    }

    /**
     * Convert Entity to Response DTO.
     */
    private MedicineResponseDto convertToResponse(
            MedicineEntity medicine
    ) {

        List<LocalTime> doseTimes =
                medicine.getSchedules()
                        .stream()
                        .map(MedicineScheduleEntity::getDoseTime)
                        .collect(Collectors.toList());

        String status =
                getMedicineStatus(medicine);

        return new MedicineResponseDto(
                medicine.getId(),
                medicine.getMedicineName(),
                medicine.getDosage(),
                medicine.getFrequency(),
                doseTimes,
                medicine.getStartDate(),
                medicine.getEndDate(),
                medicine.getNotes(),
                status
        );
    }

    /**
     * Medicine status for My Medicine section.
     */
    private String getMedicineStatus(
            MedicineEntity medicine
    ) {

        LocalDate today =
                LocalDate.now();

        if (medicine.getEndDate().isBefore(today)) {
            return "Completed";
        }

        return "Upcoming";
    }
}
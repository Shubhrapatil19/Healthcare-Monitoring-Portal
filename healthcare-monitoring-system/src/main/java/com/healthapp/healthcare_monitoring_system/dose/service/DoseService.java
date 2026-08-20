package com.healthapp.healthcare_monitoring_system.dose.service;

import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;
import com.healthapp.healthcare_monitoring_system.dose.dto.CalendarResponseDto;
import com.healthapp.healthcare_monitoring_system.dose.dto.DoseResponseDto;
import com.healthapp.healthcare_monitoring_system.dose.entity.MedicineDoseLogEntity;
import com.healthapp.healthcare_monitoring_system.dose.enums.DoseStatus;
import com.healthapp.healthcare_monitoring_system.dose.repository.MedicineDoseLogRepository;
import com.healthapp.healthcare_monitoring_system.inventory.repository.MedicineInventoryRepository;
import com.healthapp.healthcare_monitoring_system.medicine.entity.MedicineEntity;
import com.healthapp.healthcare_monitoring_system.medicine.entity.MedicineScheduleEntity;
import com.healthapp.healthcare_monitoring_system.medicine.enums.MedicineFrequency;
import com.healthapp.healthcare_monitoring_system.medicine.repository.MedicineRepository;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DoseService {

    private final MedicineDoseLogRepository doseLogRepository;
    private final MedicineRepository medicineRepository;
    private final RegisterRepository registerRepository;
    private final MedicineInventoryRepository inventoryRepository;

    public DoseService(
            MedicineDoseLogRepository doseLogRepository,
            MedicineRepository medicineRepository,
            RegisterRepository registerRepository,
            MedicineInventoryRepository inventoryRepository
    ) {
        this.doseLogRepository = doseLogRepository;
        this.medicineRepository = medicineRepository;
        this.registerRepository = registerRepository;
        this.inventoryRepository = inventoryRepository;
    }

    /**
     * Runs every midnight (00:00).
     * 1) Marks yesterday's leftover PENDING doses as MISSED.
     * 2) Generates today's dose-log rows for every active medicine.
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void runDailyDoseJob() {
        markPastPendingAsMissed();
        generateDosesForDate(LocalDate.now());
    }

    /** Marks every PENDING dose log before today as MISSED. */
    public void markPastPendingAsMissed() {

        List<MedicineDoseLogEntity> overdue =
                doseLogRepository.findByStatusAndScheduledDateBefore(
                        DoseStatus.PENDING, LocalDate.now()
                );

        for (MedicineDoseLogEntity log : overdue) {
            log.setStatus(DoseStatus.MISSED);
        }

        doseLogRepository.saveAll(overdue);
    }

    /**
     * Generates dose-log rows for every medicine active on the given date.
     * Safe to call multiple times — skips schedules that already have a log
     * (thanks to existsByMedicineIdAndScheduleIdAndScheduledDate check).
     */
    public void generateDosesForDate(LocalDate date) {

        List<MedicineEntity> activeMedicines =
                medicineRepository.findByStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        date, date
                );

        for (MedicineEntity medicine : activeMedicines) {

            boolean isDueToday =
                    medicine.getFrequency() != MedicineFrequency.WEEKLY
                            || medicine.getStartDate().getDayOfWeek() == date.getDayOfWeek();

            if (!isDueToday) {
                continue;
            }

            for (MedicineScheduleEntity schedule : medicine.getSchedules()) {

                boolean alreadyExists =
                        doseLogRepository.existsByMedicineIdAndScheduleIdAndScheduledDate(
                                medicine.getId(), schedule.getId(), date
                        );

                if (alreadyExists) {
                    continue;
                }

                MedicineDoseLogEntity doseLog = new MedicineDoseLogEntity();
                doseLog.setMedicine(medicine);
                doseLog.setSchedule(schedule);
                doseLog.setUser(medicine.getUser());
                doseLog.setScheduledDate(date);
                doseLog.setScheduledTime(schedule.getDoseTime());
                doseLog.setStatus(DoseStatus.PENDING);

                doseLogRepository.save(doseLog);
            }
        }
    }

    /** "Today's Schedule" section — ensures today's rows exist, then returns them. */
    public List<DoseResponseDto> getTodaySchedule() {

        RegisterEntity user = getLoggedInUser();

        LocalDate today = LocalDate.now();

        // make sure today's doses exist even if the midnight job hasn't run yet
        generateDosesForDate(today);

        return doseLogRepository.findByUserIdAndScheduledDate(user.getId(), today)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /** Calendar view for a given month — one entry per date that has dose logs. */
    public List<CalendarResponseDto> getCalendar(int year, int month) {

        RegisterEntity user = getLoggedInUser();

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate start = yearMonth.atDay(1);
        LocalDate end = yearMonth.atEndOfMonth();

        List<MedicineDoseLogEntity> logs =
                doseLogRepository.findByUserIdAndScheduledDateBetween(user.getId(), start, end);

        return logs.stream()
                .collect(Collectors.groupingBy(MedicineDoseLogEntity::getScheduledDate))
                .entrySet()
                .stream()
                .map(entry -> {

                    LocalDate date = entry.getKey();
                    List<MedicineDoseLogEntity> dayLogs = entry.getValue();

                    long taken = dayLogs.stream().filter(l -> l.getStatus() == DoseStatus.TAKEN).count();
                    long missed = dayLogs.stream().filter(l -> l.getStatus() == DoseStatus.MISSED).count();
                    long pending = dayLogs.stream().filter(l -> l.getStatus() == DoseStatus.PENDING).count();

                    String overall;
                    if (pending > 0) {
                        overall = "PENDING";
                    } else if (missed > 0 && taken == 0) {
                        overall = "MISSED";
                    } else if (missed > 0) {
                        overall = "PARTIAL";
                    } else {
                        overall = "TAKEN";
                    }

                    return new CalendarResponseDto(date, taken, missed, pending, overall);
                })
                .sorted((a, b) -> a.getDate().compareTo(b.getDate()))
                .collect(Collectors.toList());
    }

    /** Generic status update — used by dose controller AND by ReminderService's "taken" action. */
    public DoseResponseDto updateStatus(Long doseLogId, DoseStatus status) {

        RegisterEntity user = getLoggedInUser();

        MedicineDoseLogEntity doseLog =
                doseLogRepository.findByIdAndUserId(doseLogId, user.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Dose log not found."));

        doseLog.setStatus(status);

        if (status == DoseStatus.TAKEN) {
            doseLog.setTakenAt(LocalDateTime.now());
            reduceInventoryStock(doseLog.getMedicine().getId(), user.getId());
        }

        MedicineDoseLogEntity saved = doseLogRepository.save(doseLog);

        return convertToResponse(saved);
    }

    /** Reduces medicine inventory current_stock by 1 when a dose is taken (never below 0). */
    private void reduceInventoryStock(Long medicineId, Long userId) {

        inventoryRepository.findByMedicineIdAndUserId(medicineId, userId)
                .ifPresent(inventory -> {

                    int updatedStock = Math.max(0, inventory.getCurrentStock() - 1);

                    inventory.setCurrentStock(updatedStock);

                    inventoryRepository.save(inventory);
                });
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

    private DoseResponseDto convertToResponse(MedicineDoseLogEntity log) {

        return new DoseResponseDto(
                log.getId(),
                log.getMedicine().getId(),
                log.getMedicine().getMedicineName(),
                log.getMedicine().getDosage(),
                log.getScheduledDate(),
                log.getScheduledTime(),
                log.getStatus()
        );
    }
}
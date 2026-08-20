package com.healthapp.healthcare_monitoring_system.dashboard.service;

import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;
import com.healthapp.healthcare_monitoring_system.dashboard.dto.DashboardResponseDto;
import com.healthapp.healthcare_monitoring_system.dose.enums.DoseStatus;
import com.healthapp.healthcare_monitoring_system.dose.repository.MedicineDoseLogRepository;
import com.healthapp.healthcare_monitoring_system.inventory.entity.MedicineInventoryEntity;
import com.healthapp.healthcare_monitoring_system.inventory.repository.MedicineInventoryRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final MedicineDoseLogRepository doseLogRepository;
    private final MedicineInventoryRepository inventoryRepository;
    private final RegisterRepository registerRepository;

    public DashboardService(
            MedicineDoseLogRepository doseLogRepository,
            MedicineInventoryRepository inventoryRepository,
            RegisterRepository registerRepository
    ) {
        this.doseLogRepository = doseLogRepository;
        this.inventoryRepository = inventoryRepository;
        this.registerRepository = registerRepository;
    }

    public DashboardResponseDto getDashboard() {

        RegisterEntity user = getLoggedInUser();

        LocalDate today = LocalDate.now();

        long todaysMedicines =
                doseLogRepository.countByUserIdAndScheduledDate(user.getId(), today);

        long taken =
                doseLogRepository.countByUserIdAndScheduledDateAndStatus(user.getId(), today, DoseStatus.TAKEN);

        long missed =
                doseLogRepository.countByUserIdAndScheduledDateAndStatus(user.getId(), today, DoseStatus.MISSED);

        List<MedicineInventoryEntity> inventories = inventoryRepository.findByUserId(user.getId());

        long lowStockAlerts =
                inventories.stream()
                        .filter(inv -> inv.getCurrentStock() <= inv.getMinimumStock())
                        .count();

        return new DashboardResponseDto(todaysMedicines, taken, missed, lowStockAlerts);
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
}
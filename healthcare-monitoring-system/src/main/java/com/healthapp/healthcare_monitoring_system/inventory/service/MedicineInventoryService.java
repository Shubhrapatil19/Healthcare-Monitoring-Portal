package com.healthapp.healthcare_monitoring_system.inventory.service;

import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;
import com.healthapp.healthcare_monitoring_system.inventory.dto.AddInventoryRequestDto;
import com.healthapp.healthcare_monitoring_system.inventory.dto.InventoryResponseDto;
import com.healthapp.healthcare_monitoring_system.inventory.dto.UpdateInventoryRequestDto;
import com.healthapp.healthcare_monitoring_system.inventory.entity.MedicineInventoryEntity;
import com.healthapp.healthcare_monitoring_system.inventory.enums.StockStatus;
import com.healthapp.healthcare_monitoring_system.inventory.repository.MedicineInventoryRepository;
import com.healthapp.healthcare_monitoring_system.medicine.entity.MedicineEntity;
import com.healthapp.healthcare_monitoring_system.medicine.repository.MedicineRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class MedicineInventoryService {

    private final MedicineInventoryRepository inventoryRepository;
    private final MedicineRepository medicineRepository;
    private final RegisterRepository registerRepository;

    public MedicineInventoryService(
            MedicineInventoryRepository inventoryRepository,
            MedicineRepository medicineRepository,
            RegisterRepository registerRepository
    ) {
        this.inventoryRepository = inventoryRepository;
        this.medicineRepository = medicineRepository;
        this.registerRepository = registerRepository;
    }

    public InventoryResponseDto addInventory(AddInventoryRequestDto request) {

        RegisterEntity user = getLoggedInUser();

        // "medicine name" dropdown must only allow medicines already in My Medicine
        MedicineEntity medicine =
                medicineRepository.findByUserIdAndMedicineNameIgnoreCase(
                                user.getId(), request.getMedicineName().trim()
                        )
                        .orElseThrow(() -> new IllegalArgumentException("This medicine is not available"));

        if (inventoryRepository.existsByMedicineIdAndUserId(medicine.getId(), user.getId())) {
            throw new IllegalArgumentException(
                    "Inventory already exists for this medicine. Please update it instead."
            );
        }

        validateStock(request.getCurrentStock(), request.getMinimumStock());

        MedicineInventoryEntity inventory = new MedicineInventoryEntity();
        inventory.setMedicine(medicine);
        inventory.setUser(user);
        inventory.setCurrentStock(request.getCurrentStock());
        inventory.setMinimumStock(request.getMinimumStock());
        inventory.setExpiryDate(request.getExpiryDate());

        MedicineInventoryEntity saved = inventoryRepository.save(inventory);

        return convertToResponse(saved);
    }

    public List<InventoryResponseDto> getMyInventory() {

        RegisterEntity user = getLoggedInUser();

        return inventoryRepository.findByUserId(user.getId())
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public InventoryResponseDto updateInventory(Long inventoryId, UpdateInventoryRequestDto request) {

        RegisterEntity user = getLoggedInUser();

        MedicineInventoryEntity inventory =
                inventoryRepository.findByIdAndUserId(inventoryId, user.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Inventory record not found."));

        validateStock(request.getCurrentStock(), request.getMinimumStock());

        inventory.setCurrentStock(request.getCurrentStock());
        inventory.setMinimumStock(request.getMinimumStock());
        inventory.setExpiryDate(request.getExpiryDate());

        MedicineInventoryEntity saved = inventoryRepository.save(inventory);

        return convertToResponse(saved);
    }

    public void deleteInventory(Long inventoryId) {

        RegisterEntity user = getLoggedInUser();

        MedicineInventoryEntity inventory =
                inventoryRepository.findByIdAndUserId(inventoryId, user.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Inventory record not found."));

        inventoryRepository.delete(inventory);
    }

    /** Graph data — counts grouped by stock status. */
    public Map<String, Long> getStockStatusOverview() {

        RegisterEntity user = getLoggedInUser();

        List<MedicineInventoryEntity> inventories = inventoryRepository.findByUserId(user.getId());

        Map<String, Long> overview = inventories.stream()
                .collect(Collectors.groupingBy(
                        inv -> resolveStatus(inv).name(),
                        Collectors.counting()
                ));

        overview.putIfAbsent(StockStatus.IN_STOCK.name(), 0L);
        overview.putIfAbsent(StockStatus.LOW_STOCK.name(), 0L);
        overview.putIfAbsent(StockStatus.OUT_OF_STOCK.name(), 0L);

        return overview;
    }

    private void validateStock(int currentStock, int minimumStock) {

        if (minimumStock > currentStock) {
            throw new IllegalArgumentException("minimum stock is greater then current stock");
        }
    }

    private StockStatus resolveStatus(MedicineInventoryEntity inventory) {

        if (inventory.getCurrentStock() <= 0) {
            return StockStatus.OUT_OF_STOCK;
        }

        if (inventory.getCurrentStock() <= inventory.getMinimumStock()) {
            return StockStatus.LOW_STOCK;
        }

        return StockStatus.IN_STOCK;
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

    private InventoryResponseDto convertToResponse(MedicineInventoryEntity inventory) {

        return new InventoryResponseDto(
                inventory.getId(),
                inventory.getMedicine().getId(),
                inventory.getMedicine().getMedicineName(),
                inventory.getCurrentStock(),
                inventory.getMinimumStock(),
                inventory.getExpiryDate(),
                resolveStatus(inventory)
        );
    }
}
package com.healthapp.healthcare_monitoring_system.report.service;

import com.healthapp.healthcare_monitoring_system.auth.entity.RegisterEntity;
import com.healthapp.healthcare_monitoring_system.auth.repository.RegisterRepository;
import com.healthapp.healthcare_monitoring_system.dose.entity.MedicineDoseLogEntity;
import com.healthapp.healthcare_monitoring_system.dose.enums.DoseStatus;
import com.healthapp.healthcare_monitoring_system.dose.repository.MedicineDoseLogRepository;
import com.healthapp.healthcare_monitoring_system.inventory.entity.MedicineInventoryEntity;
import com.healthapp.healthcare_monitoring_system.inventory.enums.StockStatus;
import com.healthapp.healthcare_monitoring_system.inventory.repository.MedicineInventoryRepository;
import com.healthapp.healthcare_monitoring_system.report.dto.ComplianceReportResponseDto;
import com.healthapp.healthcare_monitoring_system.report.dto.InventoryStatusRowDto;
import com.healthapp.healthcare_monitoring_system.report.dto.MedicineComplianceDto;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private final MedicineDoseLogRepository doseLogRepository;
    private final MedicineInventoryRepository inventoryRepository;
    private final RegisterRepository registerRepository;

    public ReportService(
            MedicineDoseLogRepository doseLogRepository,
            MedicineInventoryRepository inventoryRepository,
            RegisterRepository registerRepository
    ) {
        this.doseLogRepository = doseLogRepository;
        this.inventoryRepository = inventoryRepository;
        this.registerRepository = registerRepository;
    }

    /** Compliance report for the CURRENT month — no input needed. */
    public ComplianceReportResponseDto getComplianceReport() {

        RegisterEntity user = getLoggedInUser();

        YearMonth currentMonth = YearMonth.now();
        LocalDate periodStart = currentMonth.atDay(1);
        LocalDate periodEnd = currentMonth.atEndOfMonth();

        List<MedicineDoseLogEntity> doseLogs =
                doseLogRepository.findByUserIdAndScheduledDateBetween(user.getId(), periodStart, periodEnd);

        // Only resolved doses (TAKEN or MISSED) count towards compliance — PENDING/future doses are excluded
        List<MedicineDoseLogEntity> resolvedLogs = doseLogs.stream()
                .filter(l -> l.getStatus() == DoseStatus.TAKEN || l.getStatus() == DoseStatus.MISSED)
                .collect(Collectors.toList());

        long takenCount = resolvedLogs.stream().filter(l -> l.getStatus() == DoseStatus.TAKEN).count();
        long missedCount = resolvedLogs.stream().filter(l -> l.getStatus() == DoseStatus.MISSED).count();

        double overallCompliance = calculatePercentage(takenCount, takenCount + missedCount);

        List<MedicineComplianceDto> medicineWiseCompliance = buildMedicineWiseCompliance(resolvedLogs);

        List<MedicineInventoryEntity> inventories = inventoryRepository.findByUserId(user.getId());

        List<InventoryStatusRowDto> inventoryStatusRows = inventories.stream()
                .map(inv -> new InventoryStatusRowDto(
                        inv.getMedicine().getMedicineName(),
                        inv.getCurrentStock(),
                        inv.getMinimumStock(),
                        resolveStatus(inv)
                ))
                .collect(Collectors.toList());

        long lowStockCount = inventoryStatusRows.stream()
                .filter(row -> row.getStatus() == StockStatus.LOW_STOCK).count();

        long outOfStockCount = inventoryStatusRows.stream()
                .filter(row -> row.getStatus() == StockStatus.OUT_OF_STOCK).count();

        return new ComplianceReportResponseDto(
                overallCompliance,
                takenCount,
                missedCount,
                lowStockCount,
                medicineWiseCompliance,
                inventoryStatusRows,
                lowStockCount,
                outOfStockCount,
                periodStart,
                periodEnd,
                LocalDateTime.now(),
                "System",
                "Completed"
        );
    }

    /** Generates the same report as a styled PDF, matching the app's UI theme. */
    public byte[] generateCompliancePdf() {

        ComplianceReportResponseDto data = getComplianceReport();
        String html = buildReportHtml(data);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(outputStream);
            builder.run();

            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF report", e);
        }
    }

    private List<MedicineComplianceDto> buildMedicineWiseCompliance(List<MedicineDoseLogEntity> resolvedLogs) {

        Map<String, List<MedicineDoseLogEntity>> grouped =
                resolvedLogs.stream().collect(Collectors.groupingBy(l -> l.getMedicine().getMedicineName()));

        return grouped.entrySet().stream()
                .map(entry -> {

                    String medicineName = entry.getKey();
                    List<MedicineDoseLogEntity> logs = entry.getValue();

                    long taken = logs.stream().filter(l -> l.getStatus() == DoseStatus.TAKEN).count();
                    long missed = logs.stream().filter(l -> l.getStatus() == DoseStatus.MISSED).count();
                    long scheduled = logs.size();

                    return new MedicineComplianceDto(
                            medicineName, scheduled, taken, missed, calculatePercentage(taken, scheduled)
                    );
                })
                .sorted((a, b) -> a.getMedicineName().compareToIgnoreCase(b.getMedicineName()))
                .collect(Collectors.toList());
    }

    private double calculatePercentage(long numerator, long denominator) {

        if (denominator == 0) {
            return 0.0;
        }

        return Math.round((numerator * 100.0 / denominator) * 10.0) / 10.0;
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

    // ==========================================================
    // PDF HTML BUILDER — matches the app's teal theme
    // ==========================================================

    private String buildReportHtml(ComplianceReportResponseDto data) {

        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd MMMM yyyy", Locale.ENGLISH);
        DateTimeFormatter dateTimeFmt = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a", Locale.ENGLISH);

        StringBuilder medicineRows = new StringBuilder();
        for (MedicineComplianceDto m : data.getMedicineWiseCompliance()) {
            medicineRows.append("<tr>")
                    .append("<td class=\"cell-name\">").append(escape(m.getMedicineName())).append("</td>")
                    .append("<td class=\"cell-center\">").append(m.getScheduled()).append("</td>")
                    .append("<td class=\"cell-center taken-num\">").append(m.getTaken()).append("</td>")
                    .append("<td class=\"cell-center missed-num\">").append(m.getMissed()).append("</td>")
                    .append("<td class=\"cell-center\">").append(m.getCompliancePercentage()).append("%</td>")
                    .append("</tr>");
        }
        if (data.getMedicineWiseCompliance().isEmpty()) {
            medicineRows.append("<tr><td colspan=\"5\" class=\"cell-center\">No resolved doses this month.</td></tr>");
        }

        StringBuilder inventoryRows = new StringBuilder();
        for (InventoryStatusRowDto row : data.getInventoryStatus()) {
            String badgeClass = switch (row.getStatus()) {
                case IN_STOCK -> "badge-in-stock";
                case LOW_STOCK -> "badge-low-stock";
                case OUT_OF_STOCK -> "badge-out-of-stock";
            };
            String badgeLabel = switch (row.getStatus()) {
                case IN_STOCK -> "In Stock";
                case LOW_STOCK -> "Low Stock";
                case OUT_OF_STOCK -> "Out of Stock";
            };
            inventoryRows.append("<tr>")
                    .append("<td class=\"cell-name\">").append(escape(row.getMedicineName())).append("</td>")
                    .append("<td class=\"cell-center\">").append(row.getCurrentStock()).append("</td>")
                    .append("<td class=\"cell-center\">").append(row.getMinimumStock()).append("</td>")
                    .append("<td class=\"cell-center\"><span class=\"badge ").append(badgeClass).append("\">")
                    .append(badgeLabel).append("</span></td>")
                    .append("</tr>");
        }
        if (data.getInventoryStatus().isEmpty()) {
            inventoryRows.append("<tr><td colspan=\"4\" class=\"cell-center\">No inventory records yet.</td></tr>");
        }

        // Watermark tiles — repeated faint text across the page background
        StringBuilder watermark = new StringBuilder();
        for (int row = 0; row < 10; row++) {
            watermark.append("<div class=\"watermark-row\">");
            for (int col = 0; col < 3; col++) {
                watermark.append("<span class=\"watermark-text\">Healthcare Monitoring System</span>");
            }
            watermark.append("</div>");
        }

        return """
                <!DOCTYPE html>
                <html>
                <head>
                <meta charset="UTF-8"/>
                <style>
                    @page { size: A4; margin: 28px 30px; }
                    * { box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #2c2c2a; margin: 0; padding: 0; }

                    .watermark-layer { position: absolute; top: 0; left: 0; width: 100%%; z-index: 0; }
                    .watermark-row { display: block; white-space: nowrap; margin-bottom: 52px; transform: rotate(-25deg); }
                    .watermark-text { font-size: 19px; font-weight: 400; color: #e2f0ea; margin-right: 60px; letter-spacing: 0.5px; }

                    .content { position: relative; z-index: 1; }

                    .report-header { background: linear-gradient(135deg,#0f6e56,#085041); border-radius: 12px; padding: 18px 22px; color: #ffffff; margin-bottom: 18px; }
                    .report-header .app-name { font-size: 15px; font-weight: 700; }
                    .report-header .report-title { font-size: 20px; font-weight: 700; margin-top: 6px; }
                    .report-header .report-sub { font-size: 11px; color: #c8ece1; margin-top: 4px; }

                    .cards { width: 100%%; border-collapse: separate; border-spacing: 8px 0; margin-bottom: 18px; }
                    .card { border-radius: 10px; padding: 12px 14px; border-left: 4px solid; background: #f7fbf9; }
                    .card-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #7a7a76; font-weight: 700; }
                    .card-value { font-size: 22px; font-weight: 700; margin-top: 4px; }
                    .card-compliance { border-left-color: #0f6e56; } .card-compliance .card-value { color: #0f6e56; }
                    .card-taken { border-left-color: #1f7a63; } .card-taken .card-value { color: #1f7a63; }
                    .card-missed { border-left-color: #d9534f; } .card-missed .card-value { color: #d9534f; }
                    .card-lowstock { border-left-color: #e0a530; } .card-lowstock .card-value { color: #e0a530; }

                    .section-title { font-size: 14px; font-weight: 700; color: #0f6e56; margin: 16px 0 8px 0; }

                    table.data-table { width: 100%%; border-collapse: collapse; margin-bottom: 14px; font-size: 11px; }
                    table.data-table thead td { background: #d9f0e8; color: #0f6e56; font-weight: 700; padding: 8px 10px; text-transform: uppercase; font-size: 9px; letter-spacing: 0.4px; }
                    table.data-table tbody td { padding: 8px 10px; border-bottom: 1px solid #eef0ee; }
                    .cell-name { font-weight: 600; }
                    .cell-center { text-align: center; }
                    .taken-num { color: #1f7a63; font-weight: 700; }
                    .missed-num { color: #d9534f; font-weight: 700; }

                    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 9px; font-weight: 700; }
                    .badge-in-stock { background: #dcf3ea; color: #12855f; }
                    .badge-low-stock { background: #fdf0d5; color: #b9791f; }
                    .badge-out-of-stock { background: #fbdede; color: #c0392b; }

                    .info-box { background: #f7fbf9; border-radius: 10px; padding: 14px 16px; font-size: 11px; margin-top: 10px; }
                    .info-box .info-row { display: block; margin-bottom: 6px; }
                    .info-box .info-label { color: #7a7a76; font-weight: 700; display: inline-block; width: 110px; }

                    .footer-note { margin-top: 24px; font-size: 9px; color: #a0a09a; text-align: center; }
                </style>
                </head>
                <body>

                <div class="watermark-layer">%s</div>

                <div class="content">

                    <div class="report-header">
                        <div class="app-name">Healthcare Monitoring System</div>
                        <div class="report-title">Medical Compliance Report</div>
                        <div class="report-sub">%s - %s</div>
                    </div>

                    <table class="cards"><tr>
                        <td class="card card-compliance" width="25%%">
                            <div class="card-label">Compliance</div>
                            <div class="card-value">%s%%</div>
                        </td>
                        <td class="card card-taken" width="25%%">
                            <div class="card-label">Taken</div>
                            <div class="card-value">%s</div>
                        </td>
                        <td class="card card-missed" width="25%%">
                            <div class="card-label">Missed</div>
                            <div class="card-value">%s</div>
                        </td>
                        <td class="card card-lowstock" width="25%%">
                            <div class="card-label">Low Stock</div>
                            <div class="card-value">%s</div>
                        </td>
                    </tr></table>

                    <div class="section-title">Medicine-wise Compliance</div>
                    <table class="data-table">
                        <thead><tr>
                            <td>Medicine</td><td class="cell-center">Scheduled</td>
                            <td class="cell-center">Taken</td><td class="cell-center">Missed</td>
                            <td class="cell-center">Compliance</td>
                        </tr></thead>
                        <tbody>%s</tbody>
                    </table>

                    <div class="section-title">Inventory Status</div>
                    <table class="data-table">
                        <thead><tr>
                            <td>Medicine</td><td class="cell-center">Stock</td>
                            <td class="cell-center">Min</td><td class="cell-center">Status</td>
                        </tr></thead>
                        <tbody>%s</tbody>
                    </table>

                    <div class="section-title">Report Info</div>
                    <div class="info-box">
                        <span class="info-row"><span class="info-label">Type</span>Compliance Report</span>
                        <span class="info-row"><span class="info-label">Period</span>%s - %s</span>
                        <span class="info-row"><span class="info-label">Generated</span>%s</span>
                        <span class="info-row"><span class="info-label">Generated By</span>%s</span>
                        <span class="info-row"><span class="info-label">Status</span>%s</span>
                    </div>

                    <div class="footer-note">This report was generated automatically by Healthcare Monitoring System.</div>

                </div>
                </body>
                </html>
                """.formatted(
                watermark.toString(),
                data.getPeriodStart().format(dateFmt), data.getPeriodEnd().format(dateFmt),
                data.getCompliancePercentage(), data.getTakenCount(), data.getMissedCount(), data.getLowStockCount(),
                medicineRows.toString(),
                inventoryRows.toString(),
                data.getPeriodStart().format(dateFmt), data.getPeriodEnd().format(dateFmt),
                data.getGeneratedAt().format(dateTimeFmt),
                data.getGeneratedBy(),
                data.getStatus()
        );
    }

    private String escape(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
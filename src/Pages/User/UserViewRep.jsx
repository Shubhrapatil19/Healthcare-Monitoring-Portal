import { useEffect, useMemo, useRef, useState } from "react";
import "./UserViewRep.css";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
};


const normalizeArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.reminders)) return data.reminders;
  if (Array.isArray(data?.history)) return data.history;
  return [];
};
const UserViewRep = ({ onBack }) => {
  const reportRef = useRef(null);
  const dateRange = useMemo(() => getDefaultDateRange(), []);

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [historyReminders, setHistoryReminders] = useState([]);

  useEffect(() => {
    let active = true;

    const loadReportData = async () => {
      try {
        const [reportResult, historyResult] = await Promise.allSettled([
          api.get("/api/reports/compliance"),
          api.get("/api/reminders/history"),
        ]);

        if (!active) return;

        if (reportResult.status === "fulfilled") {
          setReportData(reportResult.value?.data || {});
          setErrorMessage("");
        } else {
          setReportData(null);
          setErrorMessage(
            reportResult.reason?.response?.data?.message || "Failed to load report."
          );
        }

        if (historyResult.status === "fulfilled") {
          setHistoryReminders(normalizeArray(historyResult.value?.data));
        } else {
          setHistoryReminders([]);
        }
      } catch (err) {
        console.log("UserViewRep load error:", err.response?.data || err.message);
        if (active) {
          setReportData(null);
          setHistoryReminders([]);
          setErrorMessage(err.response?.data?.message || "Failed to load report.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadReportData();

    return () => {
      active = false;
    };
  }, []);

  const normalizePercentage = (value) => {
    const percentage = Number(value) || 0;
    const normalized = percentage > 0 && percentage <= 1 ? percentage * 100 : percentage;

    return Math.round(normalized);
  };

  const medicineData = useMemo(() => {
    const complianceRows = Array.isArray(reportData?.medicineCompliance)
      ? reportData.medicineCompliance
      : [];

    if (complianceRows.length > 0) {
      return complianceRows.map((item) => ({
        name: item.medicineName || "Medicine",
        totalScheduled: Number(item.scheduled) || 0,
        taken: Number(item.taken) || 0,
        missed: Number(item.missed) || 0,
        compliance: normalizePercentage(item.compliancePercentage),
      }));
    }

    const groupedHistory = {};

    historyReminders.forEach((item) => {
      const status = String(item.status || "").toLowerCase();

      if (status !== "taken" && status !== "missed") {
        return;
      }

      const medicineName = item.medicineName || "Medicine";

      if (!groupedHistory[medicineName]) {
        groupedHistory[medicineName] = {
          name: medicineName,
          taken: 0,
          missed: 0,
        };
      }

      groupedHistory[medicineName][status] += 1;
    });

    return Object.values(groupedHistory).map((item) => {
      const totalScheduled = item.taken + item.missed;

      return {
        ...item,
        totalScheduled,
        compliance:
          totalScheduled > 0
            ? Math.round((item.taken / totalScheduled) * 100)
            : 0,
      };
    });
  }, [historyReminders, reportData]);

  const inventoryData = useMemo(() => {
    const inventoryRows = Array.isArray(reportData?.inventoryStatus)
      ? reportData.inventoryStatus
      : [];

    return inventoryRows.map((item) => ({
      name: item.medicineName || "Medicine",
      currentStock: Number(item.currentStock) || 0,
      minimumStock: Number(item.minimumStock) || 0,
      status: String(item.status || "IN_STOCK")
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    }));
  }, [reportData]);

  const hasReportData = Boolean(reportData) && (medicineData.length > 0 || inventoryData.length > 0);
  const canDownloadReport = Boolean(reportData);
  const totalTaken = Number(reportData?.takenCount) || 0;
  const totalMissed = Number(reportData?.missedCount) || 0;
  const overallCompliance = normalizePercentage(reportData?.compliancePercentage);
  const lowStockCount = Number(reportData?.inventoryLowStockCount ?? reportData?.lowStockCount) || 0;

  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const periodLabel = `${dateFormatter.format(new Date(dateRange.startDate))} - ${dateFormatter.format(new Date(dateRange.endDate))}`;
  const now = new Date();
  const generatedLabel = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(now);
  const generatedFullLabel = `${generatedLabel}, ${now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const handleDownloadReport = async () => {
    setDownloading(true);

    try {
      const response = await api.get("/api/reports/compliance/download", {
        responseType: "blob",
        headers: {
          Accept: "application/pdf, */*",
        },
      });

      const contentType = response.headers?.["content-type"] || "application/pdf";
      const disposition = response.headers?.["content-disposition"] || "";
      const fileNameMatch = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
      const fileName = fileNameMatch?.[1]
        ? decodeURIComponent(fileNameMatch[1])
        : `compliance-report.pdf`;
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: contentType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Report downloaded successfully");
    } catch (error) {
      let errorMessage = "Failed to download report.";
      const errorData = error?.response?.data;

      if (errorData instanceof Blob) {
        const errorText = await errorData.text();
        try {
          errorMessage = JSON.parse(errorText)?.message || errorText || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
      } else if (typeof errorData === "string") {
        try {
          errorMessage = JSON.parse(errorData)?.message || errorData || errorMessage;
        } catch {
          errorMessage = errorData || errorMessage;
        }
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }

      console.error("Report download error:", errorData || error.message);
      toast.error(errorMessage);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="view-rep-page">
      {/* ===== TOP ACTION BAR ===== */}
      <div className="rep-top-bar">
        <button className="rep-back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 19L5 12L12 5"/>
          </svg>
          Back
        </button>
        <h2 className="rep-top-title">Medical Compliance Report</h2>
        <button className="rep-download-btn" onClick={handleDownloadReport} disabled={!canDownloadReport || downloading}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {downloading ? "Downloading..." : "Download Report"}
        </button>
      </div>

      {/* ===== REPORT CONTENT ===== */}
      <div className="rep-content" ref={reportRef}>
        {loading ? (
          <div className="rep-empty-state">
            <h3 className="rep-empty-title">Loading report...</h3>
          </div>
        ) : !hasReportData ? (
          <div className="rep-empty-state">
            <div className="rep-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="9" x2="15" y2="9"/>
                <line x1="9" y1="13" x2="15" y2="13"/>
                <line x1="9" y1="17" x2="13" y2="17"/>
              </svg>
            </div>
            <h3 className="rep-empty-title">{errorMessage ? "Unable to Load Report" : "No Medicines Added Yet"}</h3>
            <p className="rep-empty-text">
              {errorMessage || "Start by adding medicines to your schedule."}
              <br />
              Your compliance report will appear here once you add medicines.
            </p>
          </div>
        ) : (
          <>
            {/* ── Report Header ── */}
            <div className="rep-header">
              <div className="rep-header-left">
                <div className="rep-logo-circle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <div>
                  <h1 className="rep-title">Compliance Report</h1>
                  <p className="rep-period">{periodLabel}</p>
                </div>
              </div>
              <div className="rep-header-right">
                <div className="rep-badge">
                  <span className="rep-badge-dot"></span>
                  Generated: {generatedLabel}
                </div>
              </div>
            </div>

            {/* ── Summary Stats ── */}
            <div className="rep-stats-grid">
              <div className="rep-stat-card rep-stat-green">
                <div className="rep-stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="rep-stat-info">
                  <span className="rep-stat-label">Compliance</span>
                  <span className="rep-stat-value">{overallCompliance}%</span>
                </div>
              </div>

              <div className="rep-stat-card rep-stat-teal">
                <div className="rep-stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="rep-stat-info">
                  <span className="rep-stat-label">Taken</span>
                  <span className="rep-stat-value">{totalTaken}</span>
                </div>
              </div>

              <div className="rep-stat-card rep-stat-red">
                <div className="rep-stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
                <div className="rep-stat-info">
                  <span className="rep-stat-label">Missed</span>
                  <span className="rep-stat-value">{totalMissed}</span>
                </div>
              </div>

              <div className="rep-stat-card rep-stat-amber">
                <div className="rep-stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div className="rep-stat-info">
                  <span className="rep-stat-label">Low Stock</span>
                  <span className="rep-stat-value">{lowStockCount}</span>
                </div>
              </div>
            </div>

            {/* ── Medicine Compliance Table ── */}
            <div className="rep-table-card rep-compliance-card">
              <div className="rep-table-header">
                <div className="rep-table-title-wrap">
                  <div className="rep-table-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <line x1="9" y1="9" x2="15" y2="9"/>
                      <line x1="9" y1="13" x2="15" y2="13"/>
                      <line x1="9" y1="17" x2="13" y2="17"/>
                    </svg>
                  </div>
                  <h3>Medicine-wise Compliance</h3>
                </div>
                <span className="rep-table-badge">Detailed View</span>
              </div>
              <div className="rep-table-wrap">
                <table className="rep-table rep-compliance-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Scheduled</th>
                      <th>Taken</th>
                      <th>Missed</th>
                      <th>Compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicineData.length === 0 ? (
                      <tr className="rep-compliance-empty-row">
                        <td colSpan="5">
                          <div className="rep-compliance-empty">
                            <span className="rep-compliance-empty-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="4" y="3" width="16" height="18" rx="2"/>
                                <path d="M9 7h6"/>
                                <path d="M9 12h6"/>
                                <path d="M9 17h4"/>
                              </svg>
                            </span>

                            <strong>No compliance data available</strong>
                            <span>Data will appear here once medicines are taken or missed.</span>
                          </div>
                        </td>
                      </tr>
                    ) : medicineData.map((m, i) => (
                      <tr key={i}>
                        <td className="rep-td-name" data-label="Medicine">
                          <span className="rep-medicine-dot"></span>
                          {m.name}
                        </td>
                        <td data-label="Scheduled"><span className="rep-count-chip rep-count-scheduled">{m.totalScheduled}</span></td>
                        <td className="rep-td-taken" data-label="Taken"><span className="rep-count-chip rep-count-taken">{m.taken}</span></td>
                        <td className="rep-td-missed" data-label="Missed"><span className="rep-count-chip rep-count-missed">{m.missed}</span></td>
                        <td data-label="Compliance">
                          <div className="rep-comp-wrap">
                            <span className="rep-comp-text">{m.compliance}%</span>
                            <div className="rep-comp-bar">
                              <div
                                className="rep-comp-fill"
                                style={{
                                  width: `${m.compliance}%`,
                                  background:
                                    m.compliance >= 90
                                      ? "linear-gradient(90deg, #059669, #34d399)"
                                      : m.compliance >= 75
                                      ? "linear-gradient(90deg, #d97706, #fbbf24)"
                                      : "linear-gradient(90deg, #dc2626, #f87171)",
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Bottom Two Columns ── */}
            <div className="rep-bottom-grid">
              {/* Inventory */}
              <div className="rep-table-card rep-inventory-status-card">
                <div className="rep-table-header">
                  <div className="rep-table-title-wrap">
                    <div className="rep-table-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                      </svg>
                    </div>
                    <h3>Inventory Status</h3>
                  </div>
                </div>
                <div className="rep-table-wrap">
                  {inventoryData.length === 0 ? (
                    <p style={{ padding: "1.25rem", color: "#94a3b8", fontSize: "0.875rem" }}>
                      No stock data added yet.
                    </p>
                  ) : (
                    <table className="rep-table rep-table-sm rep-inventory-table">
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Stock</th>
                          <th>Min</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryData.map((item, i) => (
                          <tr key={i}>
                            <td className="rep-td-name" data-label="Medicine">
                              <span className="rep-inventory-med-icon">
                                {String(item.name || "?").charAt(0).toUpperCase()}
                              </span>
                              <span>{item.name}</span>
                            </td>
                            <td data-label="Stock">
                              <span className="rep-stock-value">{item.currentStock}</span>
                            </td>
                            <td data-label="Min">
                              <span className="rep-min-value">{item.minimumStock}</span>
                            </td>
                            <td data-label="Status">
                              <span className={`rep-inv-badge ${item.status === "In Stock" ? "rep-inv-instock" : "rep-inv-lowstock"}`}>
                                {item.status === "In Stock" ? (
                                  <><span className="rep-badge-dot-green"></span> In Stock</>
                                ) : (
                                  <><span className="rep-badge-dot-amber"></span> Low Stock</>
                                )}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Report Info */}
              <div className="rep-table-card rep-info-card">
                <div className="rep-table-header">
                  <div className="rep-table-title-wrap">
                    <div className="rep-table-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                    </div>
                    <h3>Report Info</h3>
                  </div>
                </div>
                <div className="rep-info-list">
                  <div className="rep-info-row">
                    <span className="rep-info-key">Type</span>
                    <span className="rep-info-val">Compliance Report</span>
                  </div>
                  <div className="rep-info-row">
                    <span className="rep-info-key">Period</span>
                    <span className="rep-info-val">{periodLabel}</span>
                  </div>
                  <div className="rep-info-row">
                    <span className="rep-info-key">Generated</span>
                    <span className="rep-info-val">{generatedFullLabel}</span>
                  </div>
                  <div className="rep-info-row">
                    <span className="rep-info-key">Generated By</span>
                    <span className="rep-info-val">{reportData?.generatedBy || "System"}</span>
                  </div>
                  <div className="rep-info-row">
                    <span className="rep-info-key">Status</span>
                    <span className="rep-info-val">
                      <span className="rep-status-complete">{reportData?.status || "Completed"}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserViewRep;










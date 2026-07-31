import { useRef, useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import "./UserViewRep.css";

const UserViewRep = ({ onBack }) => {
  const reportRef = useRef(null);

  // FIX: UserDash.jsx saves medicines under "userMedicines" and stock
  // under "userStockItems" — this component was reading the wrong keys
  // ("medicines"), which is why the report always showed as empty.
  const [medicines] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("userMedicines") || "[]");
    } catch {
      return [];
    }
  });

  const [stockItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("userStockItems") || "[]");
    } catch {
      return [];
    }
  });

  const hasMedicines = medicines.length > 0;

  // Build medicine compliance data from real stored medicines.
  // No hardcoded fallback numbers — if the backend/tracking data for
  // taken/missed/scheduled doesn't exist yet, we show 0 rather than a
  // fake placeholder like "30".
  const medicineData = medicines.map((m) => {
    const totalScheduled = m.totalScheduled ?? 0;
    const taken = m.taken ?? 0;
    const missed = m.missed ?? 0;
    const compliance =
      totalScheduled > 0 ? Math.round((taken / totalScheduled) * 100) : 0;

    return {
      name: m.medicineName || m.name || "Unknown",
      totalScheduled,
      taken,
      missed,
      compliance,
    };
  });

  // Build inventory data from real stock items (added via Add Stock),
  // not from the medicines list, and with no hardcoded minimum stock.
  const inventoryData = stockItems.map((item) => {
    const currentStock = Number(item.currentStock) || 0;
    const minimumStock = Number(item.minimumStock) || 0;
    return {
      name: item.medicineName || "Unknown",
      currentStock,
      minimumStock,
      status: currentStock >= minimumStock ? "In Stock" : "Low Stock",
    };
  });

  // ── Summary stats computed from real data (no hardcoded 0s) ──
  const totalTaken = medicineData.reduce((sum, m) => sum + m.taken, 0);
  const totalMissed = medicineData.reduce((sum, m) => sum + m.missed, 0);
  const totalScheduledSum = medicineData.reduce((sum, m) => sum + m.totalScheduled, 0);
  const overallCompliance =
    totalScheduledSum > 0 ? Math.round((totalTaken / totalScheduledSum) * 100) : 0;
  const lowStockCount = inventoryData.filter((i) => i.status === "Low Stock").length;

  // ── Dynamic dates instead of hardcoded "June 2026" ──
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const periodLabel = `${dateFormatter.format(monthStart)} - ${dateFormatter.format(monthEnd)}`;
  const generatedLabel = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(now);
  const generatedFullLabel = `${generatedLabel}, ${now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const handleDownloadPDF = async () => {
    try {
      const input = reportRef.current;
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save("Compliance_Report.pdf");
    } catch (err) {
      console.error("PDF generation error:", err);
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
        <button className="rep-download-btn" onClick={handleDownloadPDF} disabled={!hasMedicines}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download Report
        </button>
      </div>

      {/* ===== REPORT CONTENT ===== */}
      <div className="rep-content" ref={reportRef}>
        {!hasMedicines ? (
          <div className="rep-empty-state">
            <div className="rep-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="9" x2="15" y2="9"/>
                <line x1="9" y1="13" x2="15" y2="13"/>
                <line x1="9" y1="17" x2="13" y2="17"/>
              </svg>
            </div>
            <h3 className="rep-empty-title">No Medicines Added Yet</h3>
            <p className="rep-empty-text">
              Start by adding medicines to your schedule.
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
        <div className="rep-table-card">
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
            <table className="rep-table">
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
                {medicineData.map((m, i) => (
                  <tr key={i}>
                    <td className="rep-td-name" data-label="Medicine">
                      <span className="rep-medicine-dot"></span>
                      {m.name}
                    </td>
                    <td data-label="Scheduled">{m.totalScheduled}</td>
                    <td className="rep-td-taken" data-label="Taken">{m.taken}</td>
                    <td className="rep-td-missed" data-label="Missed">{m.missed}</td>
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
          <div className="rep-table-card">
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
                <table className="rep-table rep-table-sm">
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
                        <td className="rep-td-name" data-label="Medicine">{item.name}</td>
                        <td data-label="Stock">{item.currentStock}</td>
                        <td data-label="Min">{item.minimumStock}</td>
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
          <div className="rep-table-card">
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
                <span className="rep-info-val">System</span>
              </div>
              <div className="rep-info-row">
                <span className="rep-info-key">Status</span>
                <span className="rep-info-val">
                  <span className="rep-status-complete">Completed</span>
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
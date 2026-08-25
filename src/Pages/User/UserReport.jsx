import { useEffect, useState } from "react";
import "./UserReport.css";

import api from "../../api/axiosInstance";

const normalizePercentage = (value) => {
  const percentage = Number(value) || 0;
  const normalized = percentage > 0 && percentage <= 1 ? percentage * 100 : percentage;

  return Math.round(normalized);
};

const UserReport = ({ onViewReport }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // =========================================================
  // LOAD REPORT DATA
  // GET /api/reports/compliance
  // =========================================================

  useEffect(() => {
    let active = true;

    const loadReportData = async () => {
      try {
        const response = await api.get("/api/reports/compliance");

        if (!active) return;

        setReportData(response?.data || {});
        setErrorMessage("");
      } catch (error) {
        console.error(
          "Report data load error:",
          error?.response?.data || error.message
        );

        if (active) {
          setReportData(null);
          setErrorMessage(
            error?.response?.data?.message || "Failed to load report."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadReportData();

    return () => {
      active = false;
    };
  }, []);

  // =========================================================
  // REPORT STATS
  // =========================================================

  const reportStats = {
    compliance: `${normalizePercentage(reportData?.compliancePercentage)}%`,
    taken: Number(reportData?.takenCount) || 0,
    missed: Number(reportData?.missedCount) || 0,
    lowStock: Number(reportData?.inventoryLowStockCount ?? reportData?.lowStockCount) || 0,
    outOfStock: Number(reportData?.inventoryOutOfStockCount) || 0,
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="reports-container">
        <h1 className="reports-title">
          Reports
        </h1>


      <div className="reports-content">
          <div className="report-card">
            <p>Loading report...</p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="reports-container">

      {/* ================= TITLE ================= */}

      <h1 className="reports-title">
        Reports
      </h1>

      {errorMessage && (
        <div className="report-state report-error">{errorMessage}</div>
      )}

      <div className="reports-content">

        {/* =====================================================
            COMPLIANCE REPORT CARD
        ===================================================== */}

        <div className="report-card">

          <div className="report-header">

            <div className="report-icon">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >

                <path
                  d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M7 7H17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M7 12H17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M7 17H12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

              </svg>

            </div>

            <h2 className="report-name">
              Compliance Report
            </h2>

          </div>

          <div className="report-details">

            <div className="report-item">

              <span className="report-label">
                Compliance Percentage
              </span>

              <span className="report-value">
                {reportStats.compliance}
              </span>

            </div>

            <div className="report-item">

              <span className="report-label">
                Taken Medicines
              </span>

              <span className="report-value">
                {reportStats.taken}
              </span>

            </div>

            <div className="report-item">

              <span className="report-label">
                Missed Medicines
              </span>

              <span className="report-value">
                {reportStats.missed}
              </span>

            </div>

            <div className="report-item">

              <span className="report-label">
                Low Stock Medicines
              </span>

              <span className="report-value">
                {reportStats.lowStock}
              </span>

            </div>

          </div>

        </div>

        {/* =====================================================
            INVENTORY REPORT CARD
        ===================================================== */}

        <div className="report-card">

          <div className="report-header">

            <div className="report-icon">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >

                <path
                  d="M21 16V8C20.9996 7.6493 20.9071 7.3048 20.7315 7.00017C20.556 6.69555 20.3037 6.44177 20 6.26L13 2.26C12.696 2.07839 12.3511 1.98052 12 1.98052C11.6489 1.98052 11.304 2.07839 11 2.26L4 6.26C3.69626 6.44177 3.44398 6.69555 3.26846 7.00017C3.09294 7.3048 3.00036 7.6493 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9998C3.44398 17.3045 3.69626 17.5582 4 17.74L11 21.74C11.304 21.9216 11.6489 22.0195 12 22.0195C12.3511 22.0195 12.696 21.9216 13 21.74L20 17.74C20.3037 17.5582 20.556 17.3045 20.7315 16.9998C20.9071 16.6952 20.9996 16.3507 21 16Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M3.27002 6.96L12 12.01L20.73 6.96"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M12 22.08V12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

              </svg>

            </div>

            <h2 className="report-name">
              Inventory Report
            </h2>

          </div>

          <div className="report-details">

            <div className="report-item">

              <span className="report-label">
                Low Stock Medicines
              </span>

              <span className="report-value">
                {reportStats.lowStock}
              </span>

            </div>

            <div className="report-item">

              <span className="report-label">
                Out of Stock Medicines
              </span>

              <span className="report-value">
                {reportStats.outOfStock}
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          VIEW REPORT BUTTON
      ===================================================== */}

      <div className="view-report-section">

        <button
          className="view-report-btn"
          onClick={onViewReport}
        >

          <svg
            className="eye-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >

            <path
              d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <circle
              cx="12"
              cy="12"
              r="3"
              stroke="currentColor"
              strokeWidth="2"
            />

          </svg>

          <span>
            View Report
          </span>

        </button>

      </div>

    </div>
  );
};

export default UserReport;



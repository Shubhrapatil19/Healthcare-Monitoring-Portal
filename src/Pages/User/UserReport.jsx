import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axiosInstance';
import './UserReport.css';

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
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

const UserReport = ({ onViewReport }) => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange] = useState(getDefaultDateRange);

  useEffect(() => {
    const fetchComplianceReport = async () => {
      try {
        setIsLoading(true);
        setError('');

        const response = await api.get('/reminder/compliance-report', {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          },
        });

        const payload = response.data?.data ?? response.data;
        const summary = payload?.summary ?? payload?.report?.summary ?? payload?.data?.summary ?? {};
        const details = payload?.details ?? payload?.report?.details ?? payload?.data?.details ?? [];
        const inventory = payload?.inventory ?? payload?.report?.inventory ?? payload?.data?.inventory ?? [];

        const totalScheduled = Number(summary.totalScheduled ?? summary.total ?? summary.scheduled ?? payload?.totalScheduled ?? payload?.scheduled ?? 0);
        const taken = Number(summary.taken ?? summary.totalTaken ?? payload?.taken ?? payload?.totalTaken ?? 0);
        const missed = Number(summary.missed ?? summary.totalMissed ?? payload?.missed ?? payload?.totalMissed ?? 0);
        const compliance = Number(
          summary.compliance ?? summary.compliancePercentage ?? payload?.compliance ?? payload?.compliancePercentage ?? (totalScheduled > 0 ? Math.round((taken / totalScheduled) * 100) : 0)
        );
        const lowStock = Number(summary.lowStock ?? summary.lowStockCount ?? payload?.lowStock ?? payload?.lowStockCount ?? 0);

        setReportData({
          summary,
          details,
          inventory,
          totalScheduled,
          taken,
          missed,
          compliance,
          lowStock,
          startDate: payload?.startDate ?? dateRange.startDate,
          endDate: payload?.endDate ?? dateRange.endDate,
        });
      } catch (err) {
        console.error('Compliance report fetch failed:', err);
        setError('Unable to load compliance report right now.');
        setReportData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplianceReport();
  }, [dateRange.endDate, dateRange.startDate]);

  const reportStats = useMemo(() => {
    if (!reportData) {
      return {
        compliance: '0%',
        taken: 0,
        missed: 0,
        lowStock: 0,
        outOfStock: 0,
      };
    }

    return {
      compliance: `${reportData.compliance}%`,
      taken: reportData.taken,
      missed: reportData.missed,
      lowStock: reportData.lowStock,
      outOfStock: 0,
    };
  }, [reportData]);

  return (
    <div className="reports-container">
      <h1 className="reports-title">Reports</h1>

      <div className="reports-content">
        {/* Compliance Report Card */}
        <div className="report-card">
          <div className="report-header">
            <div className="report-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 17H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="report-name">Compliance Report</h2>
          </div>

          {isLoading ? (
            <div className="report-state">Loading compliance report…</div>
          ) : error ? (
            <div className="report-state report-error">{error}</div>
          ) : (
            <div className="report-details">
              <div className="report-item">
                <span className="report-label">Compliance Percentage</span>
                <span className="report-value">{reportStats.compliance}</span>
              </div>
              <div className="report-item">
                <span className="report-label">Taken Medicines</span>
                <span className="report-value">{reportStats.taken}</span>
              </div>
              <div className="report-item">
                <span className="report-label">Missed Medicines</span>
                <span className="report-value">{reportStats.missed}</span>
              </div>
              <div className="report-item">
                <span className="report-label">Low Stock Medicines</span>
                <span className="report-value">{reportStats.lowStock}</span>
              </div>
            </div>
          )}
        </div>

        {/* Inventory Report Card */}
        <div className="report-card">
          <div className="report-header">
            <div className="report-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 16V8C20.9996 7.6493 20.9071 7.3048 20.7315 7.00017C20.556 6.69555 20.3037 6.44177 20 6.26L13 2.26C12.696 2.07839 12.3511 1.98052 12 1.98052C11.6489 1.98052 11.304 2.07839 11 2.26L4 6.26C3.69626 6.44177 3.44398 6.69555 3.26846 7.00017C3.09294 7.3048 3.00036 7.6493 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9998C3.44398 17.3045 3.69626 17.5582 4 17.74L11 21.74C11.304 21.9216 11.6489 22.0195 12 22.0195C12.3511 22.0195 12.696 21.9216 13 21.74L20 17.74C20.3037 17.5582 20.556 17.3045 20.7315 16.9998C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.27002 6.96L12 12.01L20.73 6.96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="report-name">Inventory Report</h2>
          </div>

          <div className="report-details">
            <div className="report-item">
              <span className="report-label">Low Stock Medicines</span>
              <span className="report-value">{reportStats.lowStock}</span>
            </div>
            <div className="report-item">
              <span className="report-label">Out of Stock Medicines</span>
              <span className="report-value">{reportStats.outOfStock}</span>
            </div>
          </div>
        </div>
      </div>

      {/* View Report Button */}
      <div className="view-report-section">
        <button className="view-report-btn" onClick={onViewReport}>
          <svg className="eye-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>View Report</span>
        </button>
      </div>
    </div>
  );
};

export default UserReport;
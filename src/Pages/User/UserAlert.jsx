import { useState, useMemo } from "react";
import "./UserAlert.css";

import {
  AlertTriangle,
  Package,
  Clock,
  Eye,
  Check,
  Box,
  Calendar,
  Clock as ClockIcon,
  ChevronLeft,
  ChevronRight,
  Phone,
  Bell,
  Plus,
  Megaphone,
} from "lucide-react";

const UserAlert = ({ onAddMedicine, medicines = [], stockItems = [] }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const itemsPerPage = 4;

  const allAlerts = useMemo(() => {
    const alerts = [];

    // Low Stock / Out of Stock Alerts
    stockItems.forEach((item) => {
      const current = Number(item.currentStock) || 0;
      const minimum = Number(item.minimumStock) || 0;

      if (current === 0) {
        alerts.push({
          id: `oos-${item.id}`,
          type: "out-of-stock",
          severity: "critical",
          label: "Out of Stock",
          medicineName: item.medicineName,
          message: `Current Stock : ${current} Tablets`,
          currentStock: current,
          minimumStock: minimum,
          expiryDate: item.expiryDate,
          date: new Date().toLocaleDateString("en-GB"),
          time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          status: "unread",
        });
      } else if (current <= minimum) {
        alerts.push({
          id: `stock-${item.id}`,
          type: "low-stock",
          severity: "warning",
          label: "Low Stock",
          medicineName: item.medicineName,
          message: `Current Stock : ${current} Tablets`,
          currentStock: current,
          minimumStock: minimum,
          expiryDate: item.expiryDate,
          date: new Date().toLocaleDateString("en-GB"),
          time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          status: "unread",
        });
      }
    });

    // Missed Dose Alerts
    medicines.forEach((med) => {
      if (med.timing) {
        const now = new Date();
        const [hours, minutes] = med.timing.split(":").map(Number);
        const medTime = new Date();
        medTime.setHours(hours, minutes, 0, 0);
        const diffMins = Math.floor((now - medTime) / (1000 * 60));

        if (diffMins > 30 && diffMins < 1440) {
          alerts.push({
            id: `missed-${med.id}`,
            type: "missed-dose",
            severity: "info",
            label: "Missed Dose",
            medicineName: med.medicineName,
            message: `Missed at : ${med.timing}`,
            dosage: med.dosage,
            timing: med.timing,
            date: new Date().toLocaleDateString("en-GB"),
            time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            status: "unread",
          });
        }
      }
    });

    // Emergency alerts (simulated - if stock is 0 for critical items)
    stockItems.forEach((item) => {
      const current = Number(item.currentStock) || 0;
      if (current === 0) {
        alerts.push({
          id: `emergency-${item.id}`,
          type: "emergency",
          severity: "emergency",
          label: "Emergency",
          medicineName: "Emergency Alert",
          message: "Sent to Family Members",
          date: new Date().toLocaleDateString("en-GB"),
          time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          status: "read",
        });
      }
    });

    return alerts;
  }, [medicines, stockItems]);

  // Fallback sample alerts so the page always shows the intended UI
  // even before real medicine/stock data is wired up from the backend.
  const sampleAlerts = useMemo(
    () => [
      {
        id: "sample-low-1",
        type: "low-stock",
        label: "Low Stock",
        medicineName: "Paracetamol 500 mg",
        message: "Current Stock : 3 Tablets",
        currentStock: 3,
        minimumStock: 5,
        date: "20/06/2026",
        time: "09:00 AM",
        status: "unread",
      },
      {
        id: "sample-oos-1",
        type: "out-of-stock",
        label: "Out of Stock",
        medicineName: "Vitamin D",
        message: "Current Stock : 0 Tablets",
        currentStock: 0,
        minimumStock: 5,
        date: "20/06/2026",
        time: "09:15 AM",
        status: "unread",
      },
      {
        id: "sample-missed-1",
        type: "missed-dose",
        label: "Missed Dose",
        medicineName: "Calcium",
        message: "Missed at : 10:00 PM",
        date: "19/06/2026",
        time: "10:05 AM",
        status: "read",
      },
      {
        id: "sample-emergency-1",
        type: "emergency",
        label: "Emergency",
        medicineName: "Emergency Alert",
        message: "Sent to Family Members",
        date: "18/06/2026",
        time: "08:30 AM",
        status: "read",
      },
    ],
    []
  );

  const displayAlerts = allAlerts.length > 0 ? allAlerts : sampleAlerts;

  const filteredAlerts = useMemo(() => {
    let filtered = displayAlerts;
    if (activeTab === "low-stock") {
      filtered = filtered.filter((a) => a.type === "low-stock");
    } else if (activeTab === "out-of-stock") {
      filtered = filtered.filter((a) => a.type === "out-of-stock");
    } else if (activeTab === "missed-dose") {
      filtered = filtered.filter((a) => a.type === "missed-dose");
    } else if (activeTab === "emergency") {
      filtered = filtered.filter((a) => a.type === "emergency");
    }
    return filtered;
  }, [displayAlerts, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / itemsPerPage));
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tabs = [
    { id: "all", label: "All Alerts", icon: AlertTriangle },
    { id: "low-stock", label: "Low Stock", icon: Package },
    { id: "out-of-stock", label: "Out of Stock", icon: Box },
    { id: "missed-dose", label: "Missed Dose", icon: Bell },
    { id: "emergency", label: "Emergency", icon: Megaphone },
  ];

  // Colors/icons matched exactly to the reference design
  const typeConfig = {
    "low-stock": { dot: "#F59E0B", bg: "#FEF3C7", text: "#D97706", icon: AlertTriangle },
    "out-of-stock": { dot: "#DC2626", bg: "#FEE2E2", text: "#DC2626", icon: Box },
    "missed-dose": { dot: "#3B82F6", bg: "#DBEAFE", text: "#2563EB", icon: Bell },
    emergency: { dot: "#8B5CF6", bg: "#EDE9FE", text: "#7C3AED", icon: Megaphone },
  };

  const getTypeStyle = (type) => typeConfig[type] || typeConfig["low-stock"];

  const getStatusBadge = (status) => {
    if (status === "unread") {
      return <span className="al-status-badge al-status-unread">Unread</span>;
    }
    return <span className="al-status-badge al-status-read">Read</span>;
  };

  const handleViewAlert = (alert) => {
    setSelectedAlert(alert);
  };

  const handleMarkAsRead = () => {
    if (selectedAlert) {
      setSelectedAlert({ ...selectedAlert, status: "read" });
    }
  };

  // Emergency alerts for bottom right card
  const emergencyAlerts = displayAlerts.filter((a) => a.type === "emergency");

  return (
    <div className="al-page">
      {/* Header */}
      <div className="al-header-section">
        <div className="al-header-top">
          <div className="al-header-left">
            <h1 className="al-heading">Alerts</h1>
            <p className="al-subtitle">
              Stay updated with important alerts about your medicines and health.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="al-tabs">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`al-tab ${activeTab === tab.id ? "al-tab-active" : ""}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
              >
                <TabIcon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="al-card">
          <div className="al-empty">
            <div className="al-empty-icon">
              <Bell size={48} />
            </div>
            <h2 className="al-empty-heading">No Alerts Found</h2>
            <p className="al-empty-desc">
              {activeTab === "all"
                ? "You have no alerts at the moment. Stay worry-free!"
                : `No ${tabs.find((t) => t.id === activeTab)?.label || ""} alerts available.`}
            </p>
            <button className="al-add-btn" onClick={() => onAddMedicine && onAddMedicine()}>
              <Plus size={18} />
              Add Medicine
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Table Card */}
          <div className="al-card">
            <div className="al-table-wrap">
              <table className="al-table">
                <thead>
                  <tr>
                    <th className="al-th al-th-med">Medicine / Alert</th>
                    <th className="al-th al-th-type">Alert Type</th>
                    <th className="al-th al-th-datetime">Date & Time</th>
                    <th className="al-th al-th-status">Status</th>
                    <th className="al-th al-th-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAlerts.map((alert) => {
                    const style = getTypeStyle(alert.type);
                    return (
                      <tr key={alert.id} className="al-tr">
                        <td className="al-td al-td-med">
                          <div className="al-med-cell">
                            <div
                              className="al-med-icon"
                              style={{ backgroundColor: style.bg, color: style.text }}
                            >
                              <style.icon size={18} />
                            </div>
                            <div className="al-med-info">
                              <span className="al-med-name">{alert.medicineName}</span>
                              <span className="al-med-desc">{alert.message}</span>
                            </div>
                          </div>
                        </td>
                        <td className="al-td al-td-type">
                          <span
                            className="al-type-badge"
                            style={{ backgroundColor: style.bg, color: style.text }}
                          >
                            <span className="al-type-dot" style={{ backgroundColor: style.dot }}></span>
                            {alert.label}
                          </span>
                        </td>
                        <td className="al-td al-td-datetime">
                          <div className="al-datetime-cell">
                            <span className="al-date-row">
                              <Calendar size={14} />
                              {alert.date}
                            </span>
                            <span className="al-time-row">
                              <ClockIcon size={14} />
                              {alert.time}
                            </span>
                          </div>
                        </td>
                        <td className="al-td al-td-status">{getStatusBadge(alert.status)}</td>
                        <td className="al-td al-td-action">
                          <button
                            className="al-view-btn"
                            title="View Details"
                            onClick={() => handleViewAlert(alert)}
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination & Record Count */}
          <div className="al-bottom-bar">
            <span className="al-record-count">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredAlerts.length)} of{" "}
              {filteredAlerts.length} alerts
            </span>
            <div className="al-pagination">
              <button
                className="al-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`al-page-btn al-page-num ${currentPage === page ? "al-page-active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="al-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Bottom Row - Alert Details & Emergency side by side */}
          <div className="al-bottom-cards">
            {/* Alert Details Card */}
            <div className="al-detail-card">
              <h3 className="al-detail-heading">
                <Eye size={20} />
                Alert Details
              </h3>
              {selectedAlert ? (
                <div className="al-detail-content">
                  <div className="al-detail-header">
                    <div
                      className="al-detail-icon"
                      style={{
                        backgroundColor: getTypeStyle(selectedAlert.type).bg,
                        color: getTypeStyle(selectedAlert.type).text,
                      }}
                    >
                      {(() => {
                        const DetailIcon = getTypeStyle(selectedAlert.type).icon;
                        return <DetailIcon size={30} />;
                      })()}
                    </div>
                    <span
                      className="al-detail-label"
                      style={{
                        backgroundColor: getTypeStyle(selectedAlert.type).bg,
                        color: getTypeStyle(selectedAlert.type).text,
                      }}
                    >
                      {selectedAlert.label}
                    </span>
                  </div>

                  <div className="al-detail-info">
                    <div className="al-detail-row">
                      <span className="al-detail-key">Medicine</span>
                      <span className="al-detail-value">{selectedAlert.medicineName}</span>
                    </div>
                    <div className="al-detail-row">
                      <span className="al-detail-key">Alert Type</span>
                      <span className="al-detail-value">{selectedAlert.label}</span>
                    </div>
                    <div className="al-detail-row">
                      <span className="al-detail-key">Current Stock</span>
                      <span className="al-detail-value">
                        {selectedAlert.currentStock !== undefined
                          ? `${selectedAlert.currentStock} Tablets`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="al-detail-row">
                      <span className="al-detail-key">Minimum Stock</span>
                      <span className="al-detail-value">
                        {selectedAlert.minimumStock !== undefined
                          ? `${selectedAlert.minimumStock} Tablets`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="al-detail-row">
                      <span className="al-detail-key">Date & Time</span>
                      <span className="al-detail-value">
                        {selectedAlert.date} {selectedAlert.time}
                      </span>
                    </div>
                    <div className="al-detail-row al-detail-row-msg">
                      <span className="al-detail-key">Message</span>
                      <span className="al-detail-value">
                        {selectedAlert.type === "low-stock"
                          ? "Stock is running low. Please refill medicine."
                          : selectedAlert.type === "out-of-stock"
                          ? "Medicine is out of stock. Order immediately."
                          : selectedAlert.type === "missed-dose"
                          ? "Patient missed their scheduled dose. Please check."
                          : "Emergency alert! Immediate attention required."}
                      </span>
                    </div>
                  </div>

                  <div className="al-detail-actions">
                    <button className="al-btn al-btn-primary" onClick={handleMarkAsRead}>
                      <Check size={16} />
                      Mark as Read
                    </button>
                    <button className="al-btn al-btn-secondary">
                      <Box size={16} />
                      View Inventory
                    </button>
                  </div>
                </div>
              ) : (
                <div className="al-detail-empty">
                  <div className="al-detail-empty-icon">
                    <Eye size={28} />
                  </div>
                  <p>Select an alert to view details</p>
                </div>
              )}
            </div>

            {/* Recent Emergency Alerts Card */}
            <div className="al-emergency-card">
              <h3 className="al-emergency-heading">
                <Megaphone size={20} />
                Recent Emergency Alerts
              </h3>
              {emergencyAlerts.length > 0 ? (
                <div className="al-emergency-table">
                  <div className="al-emergency-header">
                    <span className="al-ecol al-ecol-datetime">Date & Time</span>
                    <span className="al-ecol al-ecol-status">Status</span>
                    <span className="al-ecol al-ecol-sentto">Sent To</span>
                  </div>
                  {emergencyAlerts.map((alert) => (
                    <div key={alert.id} className="al-emergency-row">
                      <span className="al-ecol al-ecol-datetime">
                        {alert.date} {alert.time}
                      </span>
                      <span className="al-ecol al-ecol-status">
                        <span className="al-status-sent">
                          <Check size={12} />
                          Sent
                        </span>
                      </span>
                      <span className="al-ecol al-ecol-sentto">
                        <Phone size={12} />
                        Anita (Wife), Rohit (Son)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="al-emergency-empty">
                  <Megaphone size={28} />
                  <p>No emergency alerts</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserAlert;
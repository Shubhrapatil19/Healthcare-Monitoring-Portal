import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../../api/axiosInstance";
import "./UserAlert.css";

import {
  AlertTriangle,
  Package,
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
  Loader2,
} from "lucide-react";

// ===== ALERTS API CONFIG =====
// Maps UI tab ids to the backend alert type query values.
const API_TYPE_MAP = {
  "low-stock": "LOW_STOCK",
  "out-of-stock": "OUT_OF_STOCK",
  "missed-dose": "MISSED_DOSE",
  "emergency": "EMERGENCY",
};

// UI label for each alert type.
const UI_LABEL_MAP = {
  "low-stock": "Low Stock",
  "out-of-stock": "Out of Stock",
  "missed-dose": "Missed Dose",
  "emergency": "Emergency",
};

// Safely extracts an array of alerts from various backend response shapes.
const extractAlertList = (responseData) => {
  if (!responseData) return [];
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData.alerts)) return responseData.alerts;
  if (Array.isArray(responseData.data)) return responseData.data;
  if (Array.isArray(responseData.items)) return responseData.items;
  return [];
};

// Formats a backend date/time value (ISO string or already formatted) into
// the { date, time } display shape used by the UI.
const formatAlertDateTime = (value) => {
  if (!value) {
    return {
      date: new Date().toLocaleDateString("en-GB"),
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return { date: String(value), time: "" };
  }
  return {
    date: d.toLocaleDateString("en-GB"),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
};

// Maps a backend alert object into the UI alert shape used by the table,
// detail card, and emergency card.
const normalizeAlert = (a) => {
  if (!a) return null;

  const rawType = String(a?.type || a?.alertType || "").toUpperCase();
  let type = "low-stock";
  if (rawType === "OUT_OF_STOCK") type = "out-of-stock";
  else if (rawType === "MISSED_DOSE") type = "missed-dose";
  else if (rawType === "EMERGENCY") type = "emergency";

  const rawStatus = a?.status ?? a?.isRead;
  let status = "unread";
  if (
    rawStatus === "READ" ||
    rawStatus === "read" ||
    rawStatus === true ||
    rawStatus === "true"
  ) {
    status = "read";
  }

  const { date, time } = formatAlertDateTime(
    a?.createdAt || a?.timestamp || a?.alertDate
  );

  return {
    id: a?.id ?? a?.alertId,
    type,
    label: UI_LABEL_MAP[type],
    medicineName: a?.medicineName || a?.medicine || "Alert",
    message: a?.message || a?.description || "",
    currentStock: a?.currentStock ?? a?.current_stock ?? a?.stock,
    minimumStock: a?.minimumStock ?? a?.minimum_stock ?? a?.minStock,
    expiryDate: a?.expiryDate,
    dosage: a?.dosage,
    timing: a?.timing,
    sentTo: a?.sentTo || a?.sent_to,
    date,
    time,
    status,
  };
};

const UserAlert = ({ onAddMedicine }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const itemsPerPage = 4;

  // ===== API STATE =====
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);

  // Endpoint: GET /api/alerts (supports ?type=LOW_STOCK | OUT_OF_STOCK |
  // MISSED_DOSE | EMERGENCY). Refetches whenever the active tab changes so
  // the type filter is applied on the server.
  const fetchAlerts = useCallback(async (tab) => {
    setAlertsLoading(true);
    try {
      const params = {};
      const apiType = API_TYPE_MAP[tab];
      if (apiType) params.type = apiType;

      const response = await api.get("/alerts", { params });
      const list = extractAlertList(response.data)
        .map(normalizeAlert)
        .filter(Boolean);
      setAlerts(list);
    } catch (err) {
      console.log("fetchAlerts API Error:", err.response?.status, err.response?.data || err.message);
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  // Endpoint: GET /api/alerts/emergency
  const fetchEmergencyAlerts = useCallback(async () => {
    try {
      const response = await api.get("/alerts/emergency");
      const list = extractAlertList(response.data)
        .map(normalizeAlert)
        .filter(Boolean);
      setEmergencyAlerts(list);
    } catch (err) {
      console.log("fetchEmergencyAlerts API Error:", err.response?.status, err.response?.data || err.message);
      setEmergencyAlerts([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAlerts(activeTab);
  }, [activeTab, fetchAlerts]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmergencyAlerts();
  }, [fetchEmergencyAlerts]);

  const totalPages = Math.max(1, Math.ceil(alerts.length / itemsPerPage));
  const paginatedAlerts = alerts.slice(
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

  // Endpoint: GET /api/alerts/{alertId}
  const handleViewAlert = async (alert) => {
    setSelectedAlert(alert);
    setDetailLoading(true);
    try {
      const response = await api.get(`/alerts/${alert.id}`);
      let data = response.data;
      if (data && data.alert) data = data.alert;
      if (data && typeof data === "object") {
        setSelectedAlert(normalizeAlert({ ...alert, ...data }));
      }
    } catch (err) {
      console.log("fetchAlertDetail API Error:", err.response?.status, err.response?.data || err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  // Endpoint: PUT /api/alerts/{alertId}/read
  const handleMarkAsRead = async () => {
    if (!selectedAlert) return;
    try {
      await api.put(`/alerts/${selectedAlert.id}/read`);
      setSelectedAlert({ ...selectedAlert, status: "read" });
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === selectedAlert.id ? { ...a, status: "read" } : a
        )
      );
      toast.success("Alert marked as read");
    } catch (err) {
      console.log("markAlertRead API Error:", err.response?.status, err.response?.data || err.message);
      if (!err.response) {
        toast.error("Network Error. Please check your internet.");
      } else {
        toast.error("Failed to mark alert as read. Please try again.");
      }
    }
  };

  // Endpoint: POST /api/alerts/emergency
  const handleTriggerEmergency = async () => {
    setTriggering(true);
    try {
      await api.post("/alerts/emergency");
      toast.success("Emergency alert triggered! Family members have been notified.");
      fetchEmergencyAlerts();
      fetchAlerts(activeTab);
    } catch (err) {
      console.log("triggerEmergency API Error:", err.response?.status, err.response?.data || err.message);
      if (!err.response) {
        toast.error("Network Error. Please check your internet.");
      } else {
        toast.error("Failed to trigger emergency alert. Please try again.");
      }
    } finally {
      setTriggering(false);
    }
  };

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
          <button
            className="al-emergency-trigger-btn"
            onClick={handleTriggerEmergency}
            disabled={triggering}
          >
            <Megaphone size={18} />
            {triggering ? "Triggering..." : "Trigger Emergency Alert"}
          </button>
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

      {alertsLoading ? (
        <div className="al-card">
          <div className="al-empty">
            <div className="al-empty-icon">
              <Loader2 size={48} className="al-spinner" />
            </div>
            <h2 className="al-empty-heading">Loading Alerts...</h2>
            <p className="al-empty-desc">Fetching the latest alerts from the server.</p>
          </div>
        </div>
      ) : alerts.length === 0 ? (
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
              {Math.min(currentPage * itemsPerPage, alerts.length)} of{" "}
              {alerts.length} alerts
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
                {detailLoading && (
                  <Loader2 size={16} className="al-spinner al-detail-spinner" />
                )}
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
                        {selectedAlert.message ||
                          (selectedAlert.type === "low-stock"
                            ? "Stock is running low. Please refill medicine."
                            : selectedAlert.type === "out-of-stock"
                            ? "Medicine is out of stock. Order immediately."
                            : selectedAlert.type === "missed-dose"
                            ? "Patient missed their scheduled dose. Please check."
                            : "Emergency alert! Immediate attention required.")}
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
                        {alert.sentTo || "Family Members"}
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
import { useState } from "react";
import toast from "react-hot-toast";
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
} from "lucide-react";

// ========================================================
// DEMO ALERT DATA
// No API
// No axios
// No ngrok
// ========================================================

const STORAGE_KEY = "demo_alerts";

const createDefaultAlerts = () => [
  {
    id: "a1",
    type: "low-stock",
    label: "Low Stock",
    medicineName: "Metformin",
    message: "Stock is running low. Please refill medicine.",
    currentStock: 5,
    minimumStock: 10,
    date: "15/08/2026",
    time: "09:30 AM",
    status: "unread",
  },
  {
    id: "a2",
    type: "out-of-stock",
    label: "Out of Stock",
    medicineName: "Paracetamol",
    message: "Medicine is out of stock. Order immediately.",
    currentStock: 0,
    minimumStock: 10,
    date: "15/08/2026",
    time: "10:15 AM",
    status: "unread",
  },
  {
    id: "a3",
    type: "missed-dose",
    label: "Missed Dose",
    medicineName: "Amlodipine",
    message: "Patient missed their scheduled dose. Please check.",
    dosage: "5mg",
    timing: "08:00 AM",
    date: "15/08/2026",
    time: "11:00 AM",
    status: "read",
  },
];

const loadAlerts = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    const defaults = createDefaultAlerts();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaults)
    );

    return defaults;
  } catch (error) {
    console.error("Unable to load demo alerts:", error);
    return createDefaultAlerts();
  }
};

const saveAlerts = (alerts) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(alerts)
    );
  } catch (error) {
    console.error("Unable to save demo alerts:", error);
  }
};

// ========================================================
// COMPONENT
// ========================================================

const UserAlert = ({ onAddMedicine }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const [alerts, setAlerts] = useState(() => loadAlerts());

  const itemsPerPage = 4;

  // ========================================================
  // TABS
  // ========================================================

  const tabs = [
    {
      id: "all",
      label: "All Alerts",
      icon: AlertTriangle,
    },
    {
      id: "low-stock",
      label: "Low Stock",
      icon: Package,
    },
    {
      id: "out-of-stock",
      label: "Out of Stock",
      icon: Box,
    },
    {
      id: "missed-dose",
      label: "Missed Dose",
      icon: Bell,
    },
    {
      id: "emergency",
      label: "Emergency",
      icon: Megaphone,
    },
  ];

  // ========================================================
  // ALERT TYPE CONFIG
  // ========================================================

  const typeConfig = {
    "low-stock": {
      dot: "#F59E0B",
      bg: "#FEF3C7",
      text: "#D97706",
      icon: AlertTriangle,
    },

    "out-of-stock": {
      dot: "#DC2626",
      bg: "#FEE2E2",
      text: "#DC2626",
      icon: Box,
    },

    "missed-dose": {
      dot: "#3B82F6",
      bg: "#DBEAFE",
      text: "#2563EB",
      icon: Bell,
    },

    emergency: {
      dot: "#8B5CF6",
      bg: "#EDE9FE",
      text: "#7C3AED",
      icon: Megaphone,
    },
  };

  const getTypeStyle = (type) =>
    typeConfig[type] || typeConfig["low-stock"];

  // ========================================================
  // FILTER ALERTS
  // ========================================================

  const filteredAlerts =
    activeTab === "all"
      ? alerts
      : alerts.filter(
          (alert) => alert.type === activeTab
        );

  // ========================================================
  // PAGINATION
  // ========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAlerts.length / itemsPerPage)
  );

  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ========================================================
  // EMERGENCY ALERTS
  // ========================================================

  const emergencyAlerts = alerts.filter(
    (alert) => alert.type === "emergency"
  );

  // ========================================================
  // STATUS
  // ========================================================

  const getStatusBadge = (status) => {
    if (status === "unread") {
      return (
        <span className="al-status-badge al-status-unread">
          Unread
        </span>
      );
    }

    return (
      <span className="al-status-badge al-status-read">
        Read
      </span>
    );
  };

  // ========================================================
  // VIEW ALERT
  // ========================================================

  const handleViewAlert = (alert) => {
    setSelectedAlert(alert);
  };

  // ========================================================
  // MARK AS READ
  // ========================================================

  const handleMarkAsRead = () => {
    if (!selectedAlert) return;

    const updatedAlerts = alerts.map((alert) =>
      alert.id === selectedAlert.id
        ? {
            ...alert,
            status: "read",
          }
        : alert
    );

    setAlerts(updatedAlerts);

    setSelectedAlert({
      ...selectedAlert,
      status: "read",
    });

    saveAlerts(updatedAlerts);

    toast.success("Alert marked as read");
  };

  // ========================================================
  // TRIGGER EMERGENCY
  // ========================================================

  const handleTriggerEmergency = () => {
    const now = new Date();

    const emergencyAlert = {
      id: `emergency-${Date.now()}`,
      type: "emergency",
      label: "Emergency",
      medicineName: "Emergency Alert",
      message: "Emergency alert! Immediate attention required.",
      sentTo: "Family Members",

      date: now.toLocaleDateString("en-GB"),

      time: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),

      status: "unread",
    };

    const updatedAlerts = [
      emergencyAlert,
      ...alerts,
    ];

    setAlerts(updatedAlerts);

    saveAlerts(updatedAlerts);

    setActiveTab("all");
    setCurrentPage(1);

    toast.success(
      "Emergency alert triggered! Family members have been notified."
    );
  };

  // ========================================================
  // UI
  // ========================================================

  return (
    <div className="al-page">

      {/* ================= HEADER ================= */}

      <div className="al-header-section">

        <div className="al-header-top">

          <div className="al-header-left">

            <h1 className="al-heading">
              Alerts
            </h1>

            <p className="al-subtitle">
              Stay updated with important alerts about your
              medicines and health.
            </p>

          </div>

          <button
            className="al-emergency-trigger-btn"
            onClick={handleTriggerEmergency}
          >
            <Megaphone size={18} />

            Trigger Emergency Alert
          </button>

        </div>

        {/* ================= TABS ================= */}

        <div className="al-tabs">

          {tabs.map((tab) => {
            const TabIcon = tab.icon;

            return (
              <button
                key={tab.id}
                className={`al-tab ${
                  activeTab === tab.id
                    ? "al-tab-active"
                    : ""
                }`}
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

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {filteredAlerts.length === 0 ? (

        <div className="al-card">

          <div className="al-empty">

            <div className="al-empty-icon">
              <Bell size={48} />
            </div>

            <h2 className="al-empty-heading">
              No Alerts Found
            </h2>

            <p className="al-empty-desc">

              {activeTab === "all"
                ? "You have no alerts at the moment. Stay worry-free!"
                : `No ${
                    tabs.find(
                      (tab) => tab.id === activeTab
                    )?.label || ""
                  } alerts available.`}

            </p>

            <button
              className="al-add-btn"
              onClick={() =>
                onAddMedicine &&
                onAddMedicine()
              }
            >
              <Plus size={18} />

              Add Medicine
            </button>

          </div>

        </div>

      ) : (

        <>

          {/* =================================================
              ALERT TABLE
          ================================================= */}

          <div className="al-card">

            <div className="al-table-wrap">

              <table className="al-table">

                <thead>

                  <tr>

                    <th className="al-th al-th-med">
                      Medicine / Alert
                    </th>

                    <th className="al-th al-th-type">
                      Alert Type
                    </th>

                    <th className="al-th al-th-datetime">
                      Date & Time
                    </th>

                    <th className="al-th al-th-status">
                      Status
                    </th>

                    <th className="al-th al-th-action">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {paginatedAlerts.map((alert) => {
                    const style =
                      getTypeStyle(alert.type);

                    const AlertIcon =
                      style.icon;

                    return (

                      <tr
                        key={alert.id}
                        className="al-tr"
                      >

                        {/* MEDICINE */}

                        <td className="al-td al-td-med">

                          <div className="al-med-cell">

                            <div
                              className="al-med-icon"
                              style={{
                                backgroundColor:
                                  style.bg,

                                color:
                                  style.text,
                              }}
                            >

                              <AlertIcon size={18} />

                            </div>

                            <div className="al-med-info">

                              <span className="al-med-name">
                                {alert.medicineName}
                              </span>

                              <span className="al-med-desc">
                                {alert.message}
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* TYPE */}

                        <td className="al-td al-td-type">

                          <span
                            className="al-type-badge"
                            style={{
                              backgroundColor:
                                style.bg,

                              color:
                                style.text,
                            }}
                          >

                            <span
                              className="al-type-dot"
                              style={{
                                backgroundColor:
                                  style.dot,
                              }}
                            />

                            {alert.label}

                          </span>

                        </td>

                        {/* DATE */}

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

                        {/* STATUS */}

                        <td className="al-td al-td-status">

                          {getStatusBadge(
                            alert.status
                          )}

                        </td>

                        {/* VIEW */}

                        <td className="al-td al-td-action">

                          <button
                            className="al-view-btn"
                            title="View Details"
                            onClick={() =>
                              handleViewAlert(
                                alert
                              )
                            }
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

          {/* =================================================
              PAGINATION
          ================================================= */}

          <div className="al-bottom-bar">

            <span className="al-record-count">

              Showing{" "}
              {(currentPage - 1) *
                itemsPerPage +
                1}{" "}
              to{" "}

              {Math.min(
                currentPage *
                  itemsPerPage,

                filteredAlerts.length
              )}{" "}

              of{" "}

              {filteredAlerts.length} alerts

            </span>

            <div className="al-pagination">

              <button
                className="al-page-btn"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(
                      1,
                      page - 1
                    )
                  )
                }
              >

                <ChevronLeft size={16} />

                Previous

              </button>

              {Array.from(
                {
                  length:
                    totalPages,
                },

                (_, index) =>
                  index + 1
              ).map((page) => (

                <button
                  key={page}
                  className={`al-page-btn al-page-num ${
                    currentPage === page
                      ? "al-page-active"
                      : ""
                  }`}
                  onClick={() =>
                    setCurrentPage(page)
                  }
                >

                  {page}

                </button>

              ))}

              <button
                className="al-page-btn"
                disabled={
                  currentPage ===
                  totalPages
                }
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(
                      totalPages,
                      page + 1
                    )
                  )
                }
              >

                Next

                <ChevronRight size={16} />

              </button>

            </div>

          </div>

          {/* =================================================
              DETAILS + EMERGENCY
          ================================================= */}

          <div className="al-bottom-cards">

            {/* ================= DETAILS ================= */}

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
                        backgroundColor:
                          getTypeStyle(
                            selectedAlert.type
                          ).bg,

                        color:
                          getTypeStyle(
                            selectedAlert.type
                          ).text,
                      }}
                    >

                      {(() => {

                        const DetailIcon =
                          getTypeStyle(
                            selectedAlert.type
                          ).icon;

                        return (
                          <DetailIcon
                            size={30}
                          />
                        );

                      })()}

                    </div>

                    <span
                      className="al-detail-label"
                      style={{
                        backgroundColor:
                          getTypeStyle(
                            selectedAlert.type
                          ).bg,

                        color:
                          getTypeStyle(
                            selectedAlert.type
                          ).text,
                      }}
                    >

                      {selectedAlert.label}

                    </span>

                  </div>

                  <div className="al-detail-info">

                    <div className="al-detail-row">

                      <span className="al-detail-key">
                        Medicine
                      </span>

                      <span className="al-detail-value">
                        {
                          selectedAlert.medicineName
                        }
                      </span>

                    </div>

                    <div className="al-detail-row">

                      <span className="al-detail-key">
                        Alert Type
                      </span>

                      <span className="al-detail-value">
                        {
                          selectedAlert.label
                        }
                      </span>

                    </div>

                    <div className="al-detail-row">

                      <span className="al-detail-key">
                        Current Stock
                      </span>

                      <span className="al-detail-value">

                        {selectedAlert.currentStock !==
                        undefined
                          ? `${selectedAlert.currentStock} Tablets`
                          : "N/A"}

                      </span>

                    </div>

                    <div className="al-detail-row">

                      <span className="al-detail-key">
                        Minimum Stock
                      </span>

                      <span className="al-detail-value">

                        {selectedAlert.minimumStock !==
                        undefined
                          ? `${selectedAlert.minimumStock} Tablets`
                          : "N/A"}

                      </span>

                    </div>

                    <div className="al-detail-row">

                      <span className="al-detail-key">
                        Date & Time
                      </span>

                      <span className="al-detail-value">

                        {selectedAlert.date}{" "}
                        {selectedAlert.time}

                      </span>

                    </div>

                    <div className="al-detail-row al-detail-row-msg">

                      <span className="al-detail-key">
                        Message
                      </span>

                      <span className="al-detail-value">
                        {selectedAlert.message}
                      </span>

                    </div>

                  </div>

                  <div className="al-detail-actions">

                    <button
                      className="al-btn al-btn-primary"
                      onClick={
                        handleMarkAsRead
                      }
                    >

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

                  <p>
                    Select an alert to view details
                  </p>

                </div>

              )}

            </div>

            {/* ================= EMERGENCY ================= */}

            <div className="al-emergency-card">

              <h3 className="al-emergency-heading">

                <Megaphone size={20} />

                Recent Emergency Alerts

              </h3>

              {emergencyAlerts.length > 0 ? (

                <div className="al-emergency-table">

                  <div className="al-emergency-header">

                    <span className="al-ecol al-ecol-datetime">
                      Date & Time
                    </span>

                    <span className="al-ecol al-ecol-status">
                      Status
                    </span>

                    <span className="al-ecol al-ecol-sentto">
                      Sent To
                    </span>

                  </div>

                  {emergencyAlerts.map(
                    (alert) => (

                      <div
                        key={alert.id}
                        className="al-emergency-row"
                      >

                        <span className="al-ecol al-ecol-datetime">

                          {alert.date}{" "}
                          {alert.time}

                        </span>

                        <span className="al-ecol al-ecol-status">

                          <span className="al-status-sent">

                            <Check size={12} />

                            Sent

                          </span>

                        </span>

                        <span className="al-ecol al-ecol-sentto">

                          <Phone size={12} />

                          {alert.sentTo ||
                            "Family Members"}

                        </span>

                      </div>

                    )
                  )}

                </div>

              ) : (

                <div className="al-emergency-empty">

                  <Megaphone size={28} />

                  <p>
                    No emergency alerts
                  </p>

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
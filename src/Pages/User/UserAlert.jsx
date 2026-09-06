import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import "./UserAlert.css";
import api from "../../api/axiosInstance";

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
  Trash2,
  X,
} from "lucide-react";

// ========================================================
// API HELPERS
// ========================================================

const ALERT_TYPE_TO_UI = {
  LOW_STOCK: "low-stock",
  OUT_OF_STOCK: "out-of-stock",
  MISSED_DOSE: "missed-dose",
  EMERGENCY: "emergency",
};

const UI_TYPE_TO_BACKEND = {
  "low-stock": "LOW_STOCK",
  "out-of-stock": "OUT_OF_STOCK",
  "missed-dose": "MISSED_DOSE",
  emergency: "EMERGENCY",
};

const ALERT_TYPE_LABELS = {
  "low-stock": "Low Stock",
  "out-of-stock": "Out of Stock",
  "missed-dose": "Missed Dose",
  emergency: "Emergency Alert",
};

const normalizeArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.alerts)) return data.alerts;
  return [];
};

const getAlertId = (alert) => alert?.alertId ?? alert?.id ?? null;

const normalizeType = (type) => {
  const rawType = String(type || "LOW_STOCK").trim().toUpperCase();
  return ALERT_TYPE_TO_UI[rawType] || rawType.toLowerCase().replaceAll("_", "-");
};

const formatAlertDateTime = (value) => {
  if (!value) {
    return {
      date: "N/A",
      time: "N/A",
    };
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return {
      date: String(value),
      time: "",
    };
  }

  return {
    date: parsedDate.toLocaleDateString("en-GB"),
    time: parsedDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
};

const normalizeStatus = (status) => {
  const nextStatus = String(status || "UNREAD").trim().toLowerCase();
  return nextStatus === "read" ? "read" : "unread";
};

const normalizeAlert = (alert = {}) => {
  const type = normalizeType(alert.alertType || alert.type);
  const alertDateTime = formatAlertDateTime(alert.alertTime || alert.createdAt || alert.dateTime);

  return {
    ...alert,
    id: getAlertId(alert),
    type,
    label: alert.label || ALERT_TYPE_LABELS[type] || "Alert",
    medicineName: alert.medicineName || "Medicine",
    message: alert.message || "Alert generated for this medicine.",
    currentStock: alert.currentStock,
    minimumStock: alert.minimumStock,
    date: alert.date || alertDateTime.date,
    time: alert.time || alertDateTime.time,
    status: normalizeStatus(alert.status),
    sentTo: alert.sentTo || "Family Members",
  };
};

const normalizeEmergencyLog = (log = {}) => {
  const alertDateTime = formatAlertDateTime(log.sentAt || log.createdAt || log.dateTime);
  const deliveryStatus = String(log.status || "SENT").trim().toUpperCase();
  const recipientType = String(log.recipientType || log.recipient || "PATIENT")
    .trim()
    .replaceAll("_", " ");

  return {
    ...log,
    id: log.logId ?? log.id ?? `${log.sentAt || "emergency"}-${log.medicineName || "medicine"}`,
    type: "emergency",
    label: "Emergency Alert",
    medicineName: log.medicineName || "Medicine",
    message: `${log.eventType || "Emergency"} notification ${
      deliveryStatus === "FAILED" ? "failed" : "sent"
    }.`,
    currentStock: undefined,
    minimumStock: undefined,
    isEmergencyLog: true,
    status: "read",
    date: alertDateTime.date,
    time: alertDateTime.time,
    statusLabel: deliveryStatus === "FAILED" ? "Failed" : "Sent",
    statusClass: deliveryStatus === "FAILED" ? "failed" : "sent",
    sentTo: recipientType
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
  };
};

// ========================================================
// COMPONENT
// ========================================================

const UserAlert = ({ onAddMedicine, onViewInventory }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [emergencyPage, setEmergencyPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const [alerts, setAlerts] = useState([]);
  const [selectedAlertIds, setSelectedAlertIds] = useState([]);
  const [alertDeleteMode, setAlertDeleteMode] = useState(false);
  const [deletedAlertIds, setDeletedAlertIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("deletedAlertIds") || "[]");
    } catch {
      return [];
    }
  });
  const [deleteAlertModal, setDeleteAlertModal] = useState(null);
  const [emergencyLogs, setEmergencyLogs] = useState([]);
  const [selectedEmergencyIds, setSelectedEmergencyIds] = useState([]);
  const [emergencyDeleteMode, setEmergencyDeleteMode] = useState(false);
  const [deletedEmergencyIds, setDeletedEmergencyIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("deletedEmergencyAlertIds") || "[]");
    } catch {
      return [];
    }
  });
  const [deleteEmergencyModal, setDeleteEmergencyModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const itemsPerPage = 4;
  const emergencyItemsPerPage = 5;

  useEffect(() => {
    let active = true;

    const loadAlerts = async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const [alertsResponse, emergencyLogResponse] = await Promise.all([
          api.get("/api/alerts", {
            params:
              activeTab === "all"
                ? undefined
                : {
                    type: UI_TYPE_TO_BACKEND[activeTab],
                  },
          }),
          api.get("/api/alerts/emergency-log"),
        ]);
        const nextAlerts = normalizeArray(alertsResponse.data).map(normalizeAlert);
        const nextEmergencyLogs = normalizeArray(emergencyLogResponse.data).map(
          normalizeEmergencyLog
        );

        if (!active) return;

        const hiddenAlertIds = new Set(deletedAlertIds.map(String));
        setAlerts(
          nextAlerts.filter((alert) => !hiddenAlertIds.has(String(getAlertId(alert))))
        );
        const hiddenIds = new Set(deletedEmergencyIds.map(String));
        setEmergencyLogs(
          nextEmergencyLogs.filter((alert) => !hiddenIds.has(String(alert.id)))
        );
        setSelectedAlert((currentAlert) => {
          if (!currentAlert) return null;

          const refreshedAlert = nextAlerts.find(
            (alert) => String(getAlertId(alert)) === String(getAlertId(currentAlert))
          );

          return refreshedAlert || currentAlert;
        });
        setErrorMessage("");
      } catch (error) {
        if (!active) return;

        console.error("Alerts fetch error:", error?.response?.data || error.message);

        if (!silent) {
          setAlerts([]);
          setSelectedAlert(null);
          setErrorMessage(
            error?.response?.data?.message || "Failed to load alerts."
          );
        }
      } finally {
        if (active && !silent) {
          setLoading(false);
        }
      }
    };

    void loadAlerts();

    const intervalId = setInterval(() => {
      void loadAlerts(true);
    }, 5000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [activeTab, deletedAlertIds, deletedEmergencyIds]);

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
    activeTab === "emergency"
      ? emergencyLogs
      : activeTab === "all"
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
  const paginatedAlertIds = paginatedAlerts
    .map((alert) => getAlertId(alert))
    .filter((id) => id != null)
    .map(String);
  const allVisibleAlertsSelected =
    paginatedAlertIds.length > 0 &&
    paginatedAlertIds.every((id) => selectedAlertIds.includes(id));
  const selectedAlertCount = selectedAlertIds.length;

  // ========================================================
  // EMERGENCY ALERTS
  // ========================================================

  const emergencyAlerts = emergencyLogs;
  const emergencyTotalPages = Math.max(
    1,
    Math.ceil(emergencyAlerts.length / emergencyItemsPerPage)
  );
  const paginatedEmergencyAlerts = emergencyAlerts.slice(
    (emergencyPage - 1) * emergencyItemsPerPage,
    emergencyPage * emergencyItemsPerPage
  );
  const paginatedEmergencyIds = paginatedEmergencyAlerts.map((alert) =>
    String(alert.id)
  );
  const allVisibleEmergencySelected =
    paginatedEmergencyIds.length > 0 &&
    paginatedEmergencyIds.every((id) => selectedEmergencyIds.includes(id));
  const selectedEmergencyCount = selectedEmergencyIds.length;

  useEffect(() => {
    setEmergencyPage((page) => Math.min(page, emergencyTotalPages));
  }, [emergencyTotalPages]);

  useEffect(() => {
    const visibleIds = new Set(emergencyAlerts.map((alert) => String(alert.id)));
    setSelectedEmergencyIds((ids) => ids.filter((id) => visibleIds.has(id)));
  }, [emergencyAlerts]);

  useEffect(() => {
    localStorage.setItem(
      "deletedEmergencyAlertIds",
      JSON.stringify(deletedEmergencyIds)
    );
  }, [deletedEmergencyIds]);

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

  const handleViewAlert = async (alert) => {
    const alertId = getAlertId(alert);

    setSelectedAlert(alert);

    if (alertId == null || alert.isEmergencyLog) {
      return;
    }

    try {
      const response = await api.get(`/api/alerts/${alertId}`);
      setSelectedAlert(normalizeAlert(response.data));
    } catch (error) {
      console.error("Alert detail fetch error:", error?.response?.data || error.message);
      toast.error(
        error?.response?.data?.message || "Failed to load alert details."
      );
    }
  };

  // ========================================================
  // MARK AS READ
  // ========================================================

  const handleMarkAsRead = async () => {
    if (!selectedAlert) return;

    const alertId = getAlertId(selectedAlert);

    if (alertId == null) {
      toast.error("Could not find a valid alert ID.");
      return;
    }

    try {
      const response = await api.patch(`/api/alerts/${alertId}/read`);
      const readAlert = normalizeAlert({
        ...selectedAlert,
        ...(response?.data || {}),
        status: response?.data?.status || "READ",
      });

      setAlerts((previousAlerts) =>
        previousAlerts.map((alert) =>
          String(getAlertId(alert)) === String(alertId) ? readAlert : alert
        )
      );

      setSelectedAlert(readAlert);
      toast.success("Alert marked as read");
    } catch (error) {
      console.error("Alert read error:", error?.response?.data || error.message);
      toast.error(
        error?.response?.data?.message || "Failed to mark alert as read."
      );
    }
  };


  const toggleAlert = (alertId) => {
    const id = String(alertId);
    setSelectedAlertIds((ids) =>
      ids.includes(id)
        ? ids.filter((selectedId) => selectedId !== id)
        : [...ids, id]
    );
  };

  const toggleAllVisibleAlerts = () => {
    setSelectedAlertIds((ids) => {
      if (allVisibleAlertsSelected) {
        return ids.filter((id) => !paginatedAlertIds.includes(id));
      }

      return Array.from(new Set([...ids, ...paginatedAlertIds]));
    });
  };

  const requestDeleteAlerts = (mode, alertId = null) => {
    const ids =
      mode === "selected"
        ? selectedAlertIds
        : mode === "single" && alertId != null
          ? [String(alertId)]
          : filteredAlerts.map((alert) => String(getAlertId(alert)));

    if (ids.length === 0) {
      toast.error("No alerts selected.");
      return;
    }

    setDeleteAlertModal({ mode, ids });
  };

  const confirmDeleteAlerts = async () => {
    if (!deleteAlertModal) return;

    const idsToDelete = deleteAlertModal.ids.map(String);

    setAlerts((items) =>
      items.filter((alert) => !idsToDelete.includes(String(getAlertId(alert))))
    );
    setSelectedAlertIds([]);
    setDeletedAlertIds((ids) =>
      Array.from(new Set([...ids.map(String), ...idsToDelete]))
    );
    setAlertDeleteMode(false);
    setDeleteAlertModal(null);
    setSelectedAlert((currentAlert) =>
      currentAlert && idsToDelete.includes(String(getAlertId(currentAlert)))
        ? null
        : currentAlert
    );

    // Normal alerts delete API is not available yet; keep this local until backend endpoints are added.

    toast.success(
      idsToDelete.length === 1 ? "Alert deleted" : "Alerts deleted"
    );
  };
  const toggleEmergencyAlert = (alertId) => {
    const id = String(alertId);
    setSelectedEmergencyIds((ids) =>
      ids.includes(id)
        ? ids.filter((selectedId) => selectedId !== id)
        : [...ids, id]
    );
  };

  const toggleAllVisibleEmergencyAlerts = () => {
    setSelectedEmergencyIds((ids) => {
      if (allVisibleEmergencySelected) {
        return ids.filter((id) => !paginatedEmergencyIds.includes(id));
      }

      return Array.from(new Set([...ids, ...paginatedEmergencyIds]));
    });
  };

  const requestDeleteEmergencyAlerts = (mode, alertId = null) => {
    const ids =
      mode === "selected"
        ? selectedEmergencyIds
        : mode === "single" && alertId != null
          ? [String(alertId)]
          : emergencyAlerts.map((alert) => String(alert.id));

    if (ids.length === 0) {
      toast.error("No emergency alerts selected.");
      return;
    }

    setDeleteEmergencyModal({ mode, ids });
  };

  const confirmDeleteEmergencyAlerts = async () => {
    if (!deleteEmergencyModal) return;

    const idsToDelete = deleteEmergencyModal.ids.map(String);

    setEmergencyLogs((logs) =>
      logs.filter((alert) => !idsToDelete.includes(String(alert.id)))
    );
    setSelectedEmergencyIds((ids) =>
      ids.filter((id) => !idsToDelete.includes(id))
    );
    setDeletedEmergencyIds((ids) =>
      Array.from(new Set([...ids.map(String), ...idsToDelete]))
    );
    setEmergencyDeleteMode(false);
    setDeleteEmergencyModal(null);

    try {
      if (deleteEmergencyModal.mode === "all") {
        await api.delete("/api/alerts/emergency-log");
      } else {
        await Promise.allSettled(
          idsToDelete.map((id) => api.delete(`/api/alerts/emergency-log/${id}`))
        );
      }
    } catch (error) {
      console.warn(
        "Emergency alert delete sync failed:",
        error?.response?.data || error.message
      );
    }

    toast.success(
      idsToDelete.length === 1
        ? "Emergency alert deleted"
        : "Emergency alerts deleted"
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
              {loading
                ? "Loading Alerts..."
                : errorMessage
                  ? "Unable to Load Alerts"
                  : "No Alerts Found"}
            </h2>

            <p className="al-empty-desc">

              {loading
                ? "Fetching your latest alerts."
                : errorMessage ||
                  (activeTab === "all"
                    ? "You have no alerts at the moment. Stay worry-free!"
                    : `No ${
                        tabs.find(
                          (tab) => tab.id === activeTab
                        )?.label || ""
                      } alerts available.`)}
            </p>

            {!loading && !errorMessage && (
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
            )}

          </div>

        </div>

      ) : (

        <>

          {/* =================================================
              ALERT TABLE
          ================================================= */}

          <div className="al-card">

                        <div className="al-alert-toolbar">
              <span>{filteredAlerts.length} alerts</span>

              <div className="al-alert-delete-actions">
                {alertDeleteMode && (
                  <button
                    type="button"
                    className="al-alert-cancel-mode"
                    onClick={() => {
                      setAlertDeleteMode(false);
                      setSelectedAlertIds([]);
                    }}
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="button"
                  className="al-alert-delete-all"
                  onClick={() => {
                    if (alertDeleteMode) {
                      requestDeleteAlerts("all");
                      return;
                    }
                    setAlertDeleteMode(true);
                  }}
                >
                  <Trash2 size={15} />
                  {alertDeleteMode ? "Confirm All" : "Delete All"}
                </button>
              </div>
            </div>
            <div className="al-table-wrap">

              <table className="al-table">

                <thead>

                  <tr>

                    
                    {alertDeleteMode && (
                      <th className="al-th al-th-check">
                        <input
                          type="checkbox"
                          checked={allVisibleAlertsSelected}
                          onChange={toggleAllVisibleAlerts}
                          aria-label="Select all visible alerts"
                        />
                      </th>
                    )}
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

                        
                        {alertDeleteMode && (
                          <td className="al-td al-td-check">
                            <input
                              type="checkbox"
                              checked={selectedAlertIds.includes(String(getAlertId(alert)))}
                              onChange={() => toggleAlert(getAlertId(alert))}
                              aria-label={`Select ${alert.medicineName || "alert"}`}
                            />
                          </td>
                        )}
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
                          <button
                            type="button"
                            className="al-alert-row-delete"
                            title="Delete alert"
                            onClick={() => requestDeleteAlerts("single", getAlertId(alert))}
                          >
                            <Trash2 size={16} />
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

                        <div className="al-record-count">
              {alertDeleteMode ? (
                <span>{selectedAlertCount} selected</span>
              ) : (
                <span>
                  Showing{" "}
                  {(currentPage - 1) * itemsPerPage + 1}{" "}
                  to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredAlerts.length)}{" "}
                  of {filteredAlerts.length} alerts
                </span>
              )}

              {alertDeleteMode && selectedAlertCount > 0 && (
                <button
                  type="button"
                  className="al-alert-selected-delete"
                  onClick={() => requestDeleteAlerts("selected")}
                >
                  <Trash2 size={14} />
                  Delete Selected
                </button>
              )}
            </div><div className="al-pagination">

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

                    {deleteAlertModal && (
            <div className="al-delete-modal-backdrop" role="presentation">
              <div
                className="al-delete-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="al-main-delete-title"
              >
                <button
                  type="button"
                  className="al-delete-close"
                  onClick={() => setDeleteAlertModal(null)}
                  aria-label="Close delete confirmation"
                >
                  <X size={20} />
                </button>

                <div className="al-delete-icon">
                  <Trash2 size={24} />
                </div>

                <h4 id="al-main-delete-title">
                  {deleteAlertModal.mode === "all"
                    ? "Delete All Alerts?"
                    : "Delete Alert?"}
                </h4>

                <p>
                  Are you sure you want to delete{" "}
                  {deleteAlertModal.ids.length === 1
                    ? "this alert"
                    : `these ${deleteAlertModal.ids.length} alerts`}
                  ? This action cannot be undone.
                </p>

                {deleteAlertModal.mode === "all" && (
                  <div className="al-delete-warning">
                    <AlertTriangle size={18} />
                    <span>
                      All your alerts, including low stock, out of stock and
                      missed dose alerts, will be permanently deleted.
                    </span>
                  </div>
                )}

                <div className="al-delete-actions">
                  <button
                    type="button"
                    className="al-delete-cancel"
                    onClick={() => setDeleteAlertModal(null)}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="al-delete-confirm"
                    onClick={confirmDeleteAlerts}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
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
                        undefined && selectedAlert.currentStock !== null
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
                        undefined && selectedAlert.minimumStock !== null
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

                    <button
                      className="al-btn al-btn-secondary"
                      onClick={onViewInventory}
                    >

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

              <div className="al-emergency-heading">

                <span>
                  <Megaphone size={20} />

                  Recent Emergency Alerts
                </span>

                <button
                  type="button"
                  className="al-emergency-delete-all"
                  onClick={() => {
                    if (emergencyDeleteMode) {
                      requestDeleteEmergencyAlerts("all");
                      return;
                    }
                    setEmergencyDeleteMode(true);
                  }}
                  disabled={emergencyAlerts.length === 0}
                  title="Delete all emergency alerts"
                >
                  <Trash2 size={15} />
                  {emergencyDeleteMode ? "Confirm All" : "Delete All"}
                </button>

              </div>

              {emergencyAlerts.length > 0 ? (

                <div className="al-emergency-table">

                  <div className="al-emergency-header">

                    {emergencyDeleteMode && (
                      <span className="al-ecol al-ecol-check">
                        <input
                          type="checkbox"
                          checked={allVisibleEmergencySelected}
                          onChange={toggleAllVisibleEmergencyAlerts}
                          aria-label="Select all visible emergency alerts"
                        />
                      </span>
                    )}

                    <span className="al-ecol al-ecol-datetime">
                      Date & Time
                    </span>

                    <span className="al-ecol al-ecol-medalert">
                      Medicine / Alert
                    </span>

                    <span className="al-ecol al-ecol-status">
                      Status
                    </span>

                    <span className="al-ecol al-ecol-sentto">
                      Sent To
                    </span>

                    <span className="al-ecol al-ecol-action">
                      Actions
                    </span>

                  </div>

                  {paginatedEmergencyAlerts.map(
                    (alert) => (

                      <div
                        key={alert.id}
                        className="al-emergency-row"
                      >

                        {emergencyDeleteMode && (
                          <span className="al-ecol al-ecol-check">
                            <input
                              type="checkbox"
                              checked={selectedEmergencyIds.includes(String(alert.id))}
                              onChange={() => toggleEmergencyAlert(alert.id)}
                              aria-label={`Select ${alert.medicineName || "emergency"} alert`}
                            />
                          </span>
                        )}

                        <span className="al-ecol al-ecol-datetime">

                          {alert.date}{" "}
                          {alert.time}

                        </span>
                        <span className="al-ecol al-ecol-medalert">
                          {alert.medicineName || "Medicine"}
                        </span>
                        <span className="al-ecol al-ecol-status">

                          <span
                            className={`al-status-sent ${
                              alert.statusClass === "failed" ? "al-status-failed" : ""
                            }`}
                          >

                            <Check size={12} />

                            {alert.statusLabel || "Sent"}

                          </span>

                        </span>

                        <span className="al-ecol al-ecol-sentto">

                          <Phone size={12} />

                          {alert.sentTo ||
                            "Family Members"}

                        </span>

                        <span className="al-ecol al-ecol-action">
                          <button
                            type="button"
                            className="al-emergency-row-delete"
                            onClick={() =>
                              requestDeleteEmergencyAlerts("single", alert.id)
                            }
                            title="Delete alert"
                          >
                            <Trash2 size={15} />
                          </button>
                        </span>

                      </div>

                    )
                  )}

                  <div className="al-emergency-footer">
                    <span>{selectedEmergencyCount} selected</span>

                    <div className="al-emergency-footer-actions">
                      {selectedEmergencyCount > 0 && (
                        <button
                          type="button"
                          className="al-emergency-selected-delete"
                          onClick={() => requestDeleteEmergencyAlerts("selected")}
                        >
                          <Trash2 size={14} />
                          Delete Selected
                        </button>
                      )}

                      <div className="al-emergency-pagination">
                        <button
                          type="button"
                          className="al-emergency-page-btn"
                          disabled={emergencyPage === 1}
                          onClick={() =>
                            setEmergencyPage((page) => Math.max(1, page - 1))
                          }
                        >
                          <ChevronLeft size={16} />
                        </button>

                        <span>
                          {emergencyPage} / {emergencyTotalPages}
                        </span>

                        <button
                          type="button"
                          className="al-emergency-page-btn"
                          disabled={emergencyPage === emergencyTotalPages}
                          onClick={() =>
                            setEmergencyPage((page) =>
                              Math.min(emergencyTotalPages, page + 1)
                            )
                          }
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

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

            {deleteEmergencyModal && (
              <div className="al-delete-modal-backdrop" role="presentation">
                <div
                  className="al-delete-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="al-delete-title"
                >
                  <button
                    type="button"
                    className="al-delete-close"
                    onClick={() => setDeleteEmergencyModal(null)}
                    aria-label="Close delete confirmation"
                  >
                    <X size={20} />
                  </button>

                  <div className="al-delete-icon">
                    <Trash2 size={24} />
                  </div>

                  <h4 id="al-delete-title">
                    {deleteEmergencyModal.mode === "all"
                      ? "Delete All Alerts?"
                      : "Delete Alert?"}
                  </h4>

                  <p>
                    Are you sure you want to delete{" "}
                    {deleteEmergencyModal.ids.length === 1
                      ? "this emergency alert"
                      : `these ${deleteEmergencyModal.ids.length} emergency alerts`}
                    ? This action cannot be undone.
                  </p>

                  <div className="al-delete-actions">
                    <button
                      type="button"
                      className="al-delete-cancel"
                      onClick={() => setDeleteEmergencyModal(null)}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="al-delete-confirm"
                      onClick={confirmDeleteEmergencyAlerts}
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </>

      )}

    </div>
  );
};

export default UserAlert;


















import { useState } from "react";
import "./UserNotifi.css";

import {
  Bell,
  Search,
  CheckCheck,
  Clock,
  Info,
  AlertTriangle,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Inbox,
  Filter,
  MailOpen,
  Mail,
  Trash2,
} from "lucide-react";

// ================================================================
// DEMO MODE
// No Backend
// No Axios
// No Ngrok
// Notifications are stored in localStorage
// ================================================================

const STORAGE_KEY = "demo_notifications";

// ================================================================
// DEFAULT DEMO NOTIFICATIONS
// ================================================================

const createDefaultNotifications = () => [
  {
    id: "n1",
    type: "info",
    title: "Medicine Reminder",
    message: "It's time to take Metformin 500mg.",
    status: "Unread",
    createdAt: new Date().toISOString(),
  },

  {
    id: "n2",
    type: "warning",
    title: "Low Stock Alert",
    message: "Paracetamol stock is running low.",
    status: "Unread",
    createdAt: new Date(
      Date.now() - 60 * 60 * 1000
    ).toISOString(),
  },

  {
    id: "n3",
    type: "success",
    title: "Medicine Taken",
    message: "Metformin has been marked as taken.",
    status: "Read",
    createdAt: new Date(
      Date.now() - 2 * 60 * 60 * 1000
    ).toISOString(),
  },

  {
    id: "n4",
    type: "critical",
    title: "Missed Medicine",
    message: "You missed your Paracetamol dose.",
    status: "Unread",
    createdAt: new Date(
      Date.now() - 3 * 60 * 60 * 1000
    ).toISOString(),
  },
];

// ================================================================
// LOCAL STORAGE HELPERS
// ================================================================

const loadNotifications = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    const defaultData = createDefaultNotifications();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaultData)
    );

    return defaultData;
  } catch (error) {
    console.error(
      "Unable to load notifications:",
      error
    );

    return createDefaultNotifications();
  }
};

const saveNotifications = (notifications) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(notifications)
    );
  } catch (error) {
    console.error(
      "Unable to save notifications:",
      error
    );
  }
};

// ================================================================
// DATE FORMATTER
// ================================================================

const formatCreatedAt = (createdAt) => {
  if (!createdAt) {
    return {
      date: "No date",
      time: "—",
    };
  }

  const dt = new Date(createdAt);

  if (Number.isNaN(dt.getTime())) {
    return {
      date: "Invalid date",
      time: "—",
    };
  }

  const date = dt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const time = dt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return {
    date,
    time,
  };
};

// ================================================================
// STATUS NORMALIZER
// ================================================================

const normalizeStatus = (status) =>
  String(status || "Unread").toLowerCase();

// ================================================================
// COMPONENT
// ================================================================

const UserNotifi = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [filter, setFilter] = useState("all");

  const [notifications, setNotifications] = useState(
    () => loadNotifications()
  );

  const itemsPerPage = 6;

  // ================================================================
  // MARK SINGLE NOTIFICATION AS READ
  // ================================================================

  const handleMarkAsRead = (notification) => {
    if (!notification?.id) return;

    if (
      normalizeStatus(notification.status) === "read"
    ) {
      return;
    }

    const updatedNotifications = notifications.map(
      (item) =>
        item.id === notification.id
          ? {
              ...item,
              status: "Read",
            }
          : item
    );

    setNotifications(updatedNotifications);

    saveNotifications(updatedNotifications);
  };

  // ================================================================
  // MARK ALL AS READ
  // ================================================================

  const handleMarkAllRead = () => {
    const hasUnread = notifications.some(
      (notification) =>
        normalizeStatus(notification.status) ===
        "unread"
    );

    if (!hasUnread) return;

    const updatedNotifications = notifications.map(
      (notification) => ({
        ...notification,
        status: "Read",
      })
    );

    setNotifications(updatedNotifications);

    saveNotifications(updatedNotifications);
  };

  // ================================================================
  // DELETE / DISMISS NOTIFICATION
  // ================================================================

  const handleDismiss = (id) => {
    const updatedNotifications = notifications.filter(
      (notification) => notification.id !== id
    );

    setNotifications(updatedNotifications);

    saveNotifications(updatedNotifications);

    // If deletion leaves current page empty
    const remainingPages = Math.max(
      1,
      Math.ceil(
        updatedNotifications.length / itemsPerPage
      )
    );

    if (currentPage > remainingPages) {
      setCurrentPage(remainingPages);
    }
  };

  // ================================================================
  // NOTIFICATION CLICK
  // ================================================================

  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification);
  };

  // ================================================================
  // UNREAD COUNT
  // ================================================================

  const unreadCount = notifications.filter(
    (notification) =>
      normalizeStatus(notification.status) === "unread"
  ).length;

  // ================================================================
  // FILTER + SEARCH
  // ================================================================

  let filteredNotifications = notifications;

  if (filter === "unread") {
    filteredNotifications =
      filteredNotifications.filter(
        (notification) =>
          normalizeStatus(notification.status) ===
          "unread"
      );
  }

  if (filter === "read") {
    filteredNotifications =
      filteredNotifications.filter(
        (notification) =>
          normalizeStatus(notification.status) ===
          "read"
      );
  }

  if (searchQuery.trim()) {
    const query = searchQuery
      .trim()
      .toLowerCase();

    filteredNotifications =
      filteredNotifications.filter(
        (notification) => {
          const title = String(
            notification.title || ""
          ).toLowerCase();

          const message = String(
            notification.message || ""
          ).toLowerCase();

          return (
            title.includes(query) ||
            message.includes(query)
          );
        }
      );
  }

  // ================================================================
  // PAGINATION
  // ================================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredNotifications.length / itemsPerPage
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedNotifications =
    filteredNotifications.slice(
      (safeCurrentPage - 1) * itemsPerPage,
      safeCurrentPage * itemsPerPage
    );

  // ================================================================
  // TYPE CONFIG
  // ================================================================

  const typeConfig = {
    info: {
      icon: Info,
      bg: "#DBEAFE",
      color: "#2563EB",
      badge: "nt-badge-info",
      label: "Info",
    },

    warning: {
      icon: AlertTriangle,
      bg: "#FEF3C7",
      color: "#D97706",
      badge: "nt-badge-warning",
      label: "Warning",
    },

    critical: {
      icon: AlertCircle,
      bg: "#FEE2E2",
      color: "#DC2626",
      badge: "nt-badge-critical",
      label: "Critical",
    },

    success: {
      icon: CheckCircle2,
      bg: "#D1FAE5",
      color: "#059669",
      badge: "nt-badge-success",
      label: "Success",
    },
  };

  const getTypeConfig = (type) =>
    typeConfig[type] || typeConfig.info;

  // ================================================================
  // UI
  // ================================================================

  return (
    <div className="nt-page">

      {/* =========================================================
          HEADER
      ========================================================= */}

      <div className="nt-header-section">

        <div className="nt-header-top">

          <div className="nt-header-left">

            <h1 className="nt-heading">
              Notifications
            </h1>

            <p className="nt-subtitle">
              Stay updated with medicine reminders,
              stock alerts, and system notifications.
            </p>

          </div>

          <div className="nt-header-actions">

            {/* SEARCH */}

            <div className="nt-search-box">

              <Search size={18} />

              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />

            </div>

            {/* MARK ALL READ */}

            <button
              className="nt-mark-all-btn"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >

              <CheckCheck size={18} />

              Mark All Read

            </button>

          </div>

        </div>

        {/* =====================================================
            SUMMARY
        ===================================================== */}

        <div className="nt-summary-bar">

          <div className="nt-summary-info">

            <span className="nt-summary-total">

              <Inbox size={16} />

              <strong>
                {notifications.length}
              </strong>

              Total

            </span>

            <span className="nt-summary-unread">

              <Bell size={16} />

              <strong>
                {unreadCount}
              </strong>

              Unread

            </span>

          </div>

          {/* =================================================
              FILTER TABS
          ================================================= */}

          <div className="nt-filter-tabs">

            <button
              className={`nt-filter-tab ${
                filter === "all"
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                setFilter("all");
                setCurrentPage(1);
              }}
            >

              <Filter size={14} />

              All

            </button>

            <button
              className={`nt-filter-tab ${
                filter === "unread"
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                setFilter("unread");
                setCurrentPage(1);
              }}
            >

              <Bell size={14} />

              Unread

              {unreadCount > 0 && (
                <span className="nt-filter-count">
                  {unreadCount}
                </span>
              )}

            </button>

            <button
              className={`nt-filter-tab ${
                filter === "read"
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                setFilter("read");
                setCurrentPage(1);
              }}
            >

              <CheckCheck size={14} />

              Read

            </button>

          </div>

        </div>

      </div>

      {/* =========================================================
          EMPTY STATE
      ========================================================= */}

      {filteredNotifications.length === 0 ? (

        <div className="nt-card">

          <div className="nt-empty">

            <div className="nt-empty-icon">

              {searchQuery || filter !== "all" ? (
                <Search size={40} />
              ) : (
                <Bell size={40} />
              )}

            </div>

            <h3>

              {searchQuery
                ? "No Search Results"
                : filter !== "all"
                ? `No ${filter} Notifications`
                : "No Notifications Yet"}

            </h3>

            <p>

              {searchQuery
                ? "No notifications match your search. Try a different keyword."
                : filter !== "all"
                ? `You don't have any ${filter} notifications right now.`
                : "You're all caught up! When new notifications arrive, they will appear here."}

            </p>

            {(searchQuery || filter !== "all") && (

              <button
                className="nt-clear-filter-btn"
                onClick={() => {
                  setSearchQuery("");
                  setFilter("all");
                  setCurrentPage(1);
                }}
              >

                Clear Filters

              </button>

            )}

            <div className="nt-empty-decoration">

              <div className="nt-empty-dot" />
              <div className="nt-empty-dot" />
              <div className="nt-empty-dot" />

            </div>

          </div>

        </div>

      ) : (

        <>

          {/* =====================================================
              NOTIFICATION TABLE
          ===================================================== */}

          <div className="nt-card">

            {/* TABLE HEADER */}

            <div className="nt-table-header">

              <div className="nt-th nt-th-type">
                Type
              </div>

              <div className="nt-th nt-th-message">
                Notification
              </div>

              <div className="nt-th nt-th-date">
                Date
              </div>

              <div className="nt-th nt-th-time">
                Time
              </div>

              <div className="nt-th nt-th-status">
                Status
              </div>

              <div className="nt-th nt-th-actions">
                Actions
              </div>

            </div>

            {/* TABLE BODY */}

            <div className="nt-table-body">

              {paginatedNotifications.map(
                (notification) => {

                  const config =
                    getTypeConfig(
                      notification.type
                    );

                  const TypeIcon =
                    config.icon;

                  const isUnread =
                    normalizeStatus(
                      notification.status
                    ) === "unread";

                  const {
                    date,
                    time,
                  } = formatCreatedAt(
                    notification.createdAt
                  );

                  return (

                    <div
                      key={notification.id}
                      className={`nt-table-row ${
                        isUnread
                          ? "nt-row-unread"
                          : ""
                      }`}
                      onClick={() =>
                        handleNotificationClick(
                          notification
                        )
                      }
                    >

                      {/* TYPE */}

                      <div className="nt-td nt-td-type">

                        <div
                          className="nt-type-icon"
                          style={{
                            backgroundColor:
                              config.bg,

                            color:
                              config.color,
                          }}
                        >

                          <TypeIcon size={18} />

                        </div>

                        <span
                          className={`nt-type-label ${config.badge}`}
                        >

                          {config.label}

                        </span>

                      </div>

                      {/* MESSAGE */}

                      <div className="nt-td nt-td-message">

                        <div className="nt-msg-title">

                          {isUnread && (
                            <span className="nt-unread-dot" />
                          )}

                          <span
                            className={
                              isUnread
                                ? "nt-msg-title-text unread"
                                : "nt-msg-title-text"
                            }
                          >

                            {notification.title ||
                              notification.message}

                          </span>

                        </div>

                        <p className="nt-msg-desc">

                          {notification.message || ""}

                        </p>

                      </div>

                      {/* DATE */}

                      <div className="nt-td nt-td-date">

                        <Calendar size={14} />

                        <span>
                          {date}
                        </span>

                      </div>

                      {/* TIME */}

                      <div className="nt-td nt-td-time">

                        <Clock size={14} />

                        <span>
                          {time}
                        </span>

                      </div>

                      {/* STATUS */}

                      <div className="nt-td nt-td-status">

                        <span
                          className={`nt-status-pill ${
                            isUnread
                              ? "unread"
                              : "read"
                          }`}
                        >

                          {isUnread ? (
                            <Mail size={12} />
                          ) : (
                            <MailOpen size={12} />
                          )}

                          {isUnread
                            ? "Unread"
                            : "Read"}

                        </span>

                      </div>

                      {/* ACTION */}

                      <div className="nt-td nt-td-actions">

                        <button
                          className="nt-dismiss-btn"
                          title="Dismiss"
                          onClick={(e) => {
                            e.stopPropagation();

                            handleDismiss(
                              notification.id
                            );
                          }}
                        >

                          <Trash2 size={15} />

                        </button>

                      </div>

                    </div>

                  );
                }
              )}

            </div>

          </div>

          {/* =====================================================
              PAGINATION
          ===================================================== */}

          <div className="nt-bottom-bar">

            <span className="nt-record-count">

              Showing{" "}

              {(safeCurrentPage - 1) *
                itemsPerPage +
                1}

              {" "}to{" "}

              {Math.min(
                safeCurrentPage *
                  itemsPerPage,

                filteredNotifications.length
              )}

              {" "}of{" "}

              {filteredNotifications.length}

              {" "}notifications

            </span>

            <div className="nt-pagination">

              {/* PREVIOUS */}

              <button
                className="nt-page-btn"
                disabled={
                  safeCurrentPage === 1
                }
                onClick={() =>
                  setCurrentPage(
                    Math.max(
                      1,
                      safeCurrentPage - 1
                    )
                  )
                }
              >

                <ChevronLeft size={16} />

                Previous

              </button>

              {/* PAGE NUMBERS */}

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
                  className={`nt-page-btn nt-page-num ${
                    safeCurrentPage === page
                      ? "nt-page-active"
                      : ""
                  }`}
                  onClick={() =>
                    setCurrentPage(page)
                  }
                >

                  {page}

                </button>

              ))}

              {/* NEXT */}

              <button
                className="nt-page-btn"
                disabled={
                  safeCurrentPage ===
                  totalPages
                }
                onClick={() =>
                  setCurrentPage(
                    Math.min(
                      totalPages,
                      safeCurrentPage + 1
                    )
                  )
                }
              >

                Next

                <ChevronRight size={16} />

              </button>

            </div>

          </div>

        </>

      )}

    </div>
  );
};

export default UserNotifi;
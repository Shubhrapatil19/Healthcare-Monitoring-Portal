import { useCallback, useEffect, useState } from "react";
import "./UserNotifi.css";
import toast from "react-hot-toast";
import api from "../../api/axiosInstance";

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
// API HELPERS
// ================================================================

const normalizeArray = (data) => {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.notifications)) {
    return data.notifications;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.alerts)) {
    return data.alerts;
  }

  if (Array.isArray(data?.data?.notifications)) {
    return data.data.notifications;
  }

  if (Array.isArray(data?.data?.items)) {
    return data.data.items;
  }

  if (Array.isArray(data?.data?.content)) {
    return data.data.content;
  }

  return [];
};

const getNotificationId = (notification) =>
  notification?.notificationId ?? notification?.id ?? null;


const normalizeType = (type) => {
  const nextType = String(type || "INFO").trim().toLowerCase();

  if (nextType === "success") return "success";
  if (nextType === "warning" || nextType === "low_stock") return "warning";
  if (
    nextType === "critical" ||
    nextType === "error" ||
    nextType === "out_of_stock"
  ) return "critical";

  if (nextType === "missed_dose" || nextType === "reminder") return "reminder";

  return "info";
};

const normalizeNotification = (notification = {}) => {
  const title = String(notification.title || "")
    .trim()
    .toLowerCase();

  const message = String(notification.message || "")
    .trim()
    .toLowerCase();

  let resolvedType = normalizeType(notification.type);

  // Backend can send medicine reminders with type = INFO.
  // Detect reminder notifications from title/message too.
  if (
    title.includes("medicine reminder") ||
    title === "reminder" ||
    message.includes("it's time to take") ||
    message.includes("it’s time to take")
  ) {
    resolvedType = "reminder";
  }

  return {
    ...notification,
    id: getNotificationId(notification),
    source: "notification",
    sourceId: getNotificationId(notification),
    type: resolvedType,
    title: notification.title || "Notification",
    message: notification.message || "",
    status: String(notification.status || "UNREAD")
      .trim()
      .toUpperCase(),
    createdAt:
      notification.createdAt ||
      notification.time ||
      notification.date,
  };
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

  let dateValue = String(createdAt).trim();

  // Backend UTC timestamp timezone ke bina bhej raha hai,
  // example: 2026-08-26T09:21:18.327899
  // Agar timestamp me Z ya +05:30 jaisa timezone nahi hai,
  // to use UTC treat karne ke liye Z append kar dete hain.
  const hasTimezone =
    /Z$/i.test(dateValue) ||
    /[+-]\d{2}:\d{2}$/.test(dateValue);

  if (!hasTimezone) {
    dateValue += "Z";
  }

  const dt = new Date(dateValue);

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
    timeZone: "Asia/Kolkata",
  });

  const time = dt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
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

  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [apiUnreadCount, setApiUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const itemsPerPage = 6;

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await api.get("/api/notifications", {
        params: {
          status: filter === "all" ? undefined : filter.toUpperCase(),
          search: searchQuery.trim() || undefined,
        },
      });
      const data = response?.data || {};
      const nextNotifications = normalizeArray(data).map(normalizeNotification);

      setNotifications(nextNotifications);
      setTotalCount(Number(data.totalCount) || nextNotifications.length);
      setApiUnreadCount(
        Number(data.unreadCount) ||
          nextNotifications.filter(
            (notification) => normalizeStatus(notification.status) === "unread"
          ).length
      );
      setErrorMessage("");
    } catch (error) {
      console.error("Notification fetch error:", error?.response?.data || error.message);

      if (!silent) {
        setNotifications([]);
        setTotalCount(0);
        setApiUnreadCount(0);
        setErrorMessage(
          error?.response?.data?.message || "Failed to load notifications."
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [filter, searchQuery]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get("/api/notifications/unread-count");
      const data = response?.data || {};
      const count =
        data.unreadCount ?? data.count ?? data.total ?? data.additionalProp1 ?? 0;

      setApiUnreadCount(Number(count) || 0);
    } catch (error) {
      console.error("Notification unread count error:", error?.response?.data || error.message);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchNotifications();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchNotifications]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      void fetchNotifications(true);
      void fetchUnreadCount();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchNotifications, fetchUnreadCount]);

  // ================================================================
  // MARK SINGLE NOTIFICATION AS READ
  // ================================================================

  const handleMarkAsRead = async (notification) => {
    const notificationId = getNotificationId(notification);

    if (notificationId == null) return;

    if (normalizeStatus(notification.status) === "read") {
      return;
    }

    try {
      const response = await api.patch(`/api/notifications/${notificationId}/read`);
      const readNotification = normalizeNotification({
        ...notification,
        ...(response?.data || {}),
        status: response?.data?.status || "READ",
      });

      setNotifications((previousNotifications) =>
        previousNotifications.map((item) =>
          String(getNotificationId(item)) === String(notificationId)
            ? readNotification
            : item
        )
      );
      setApiUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error("Mark notification read error:", error?.response?.data || error.message);
      toast.error(
        error?.response?.data?.message || "Failed to mark notification as read."
      );
    }
  };

  // ================================================================
  // MARK ALL AS READ
  // ================================================================

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    try {
      await api.patch("/api/notifications/read-all");

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) => ({
          ...notification,
          status: "READ",
        }))
      );
      setApiUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Mark all notifications read error:", error?.response?.data || error.message);
      toast.error(
        error?.response?.data?.message || "Failed to mark all notifications as read."
      );
    }
  };

  // ================================================================
  // DELETE / DISMISS NOTIFICATION
  // ================================================================

  const handleDismiss = async (notification) => {
    const notificationId = getNotificationId(notification);

    if (notificationId == null) return;

    try {
      await api.delete(`/api/notifications/${notificationId}`);

      setNotifications((previousNotifications) => {
        const updatedNotifications = previousNotifications.filter(
          (item) => String(getNotificationId(item)) !== String(notificationId)
        );

        const remainingPages = Math.max(
          1,
          Math.ceil(updatedNotifications.length / itemsPerPage)
        );

        if (currentPage > remainingPages) {
          setCurrentPage(remainingPages);
        }

        setTotalCount((count) => Math.max(0, count - 1));

        return updatedNotifications;
      });

      void fetchUnreadCount();
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Delete notification error:", error?.response?.data || error.message);
      toast.error(
        error?.response?.data?.message || "Failed to delete notification."
      );
    }
  };

  // ================================================================
  // CLEAR ALL NOTIFICATIONS
  // ================================================================

  const handleClearAll = async () => {
    if (notifications.length === 0) return;

    try {
      await api.delete("/api/notifications");
      setNotifications([]);
      setTotalCount(0);
      setApiUnreadCount(0);
      setSearchQuery("");
      setFilter("all");
      setCurrentPage(1);
      toast.success("All notifications cleared");
    } catch (error) {
      console.error("Clear notifications error:", error?.response?.data || error.message);
      toast.error(
        error?.response?.data?.message || "Failed to clear notifications."
      );
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

  const localUnreadCount = notifications.filter(
    (notification) =>
      normalizeStatus(notification.status) === "unread"
  ).length;

  const unreadCount = apiUnreadCount || localUnreadCount;

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

    reminder: {
      icon: Bell,
      bg: "#DBEAFE",
      color: "#2563EB",
      badge: "nt-badge-info",
      label: "Medicine Reminder",
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
            {/* CLEAR ALL */}

            <button
              className="nt-clear-all-btn"
              onClick={handleClearAll}
              disabled={notifications.length === 0}
            >

              <Trash2 size={18} />

              Clear All

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
                {totalCount || notifications.length}
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

            {!loading && !errorMessage && (searchQuery || filter !== "all") && (

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
                              notification
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













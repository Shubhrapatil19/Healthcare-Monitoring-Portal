import { useState, useMemo, useEffect, useCallback } from "react";
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

const formatCreatedAt = (createdAt) => {
  if (!createdAt) return { date: "No date", time: "—" };
  const dt = new Date(createdAt);
  if (Number.isNaN(dt.getTime())) return { date: "Invalid date", time: "—" };

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

  return { date, time };
};

const normalizeStatus = (status) => String(status || "Unseen").toLowerCase();

const UserNotifi = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "unread" | "read"
  const itemsPerPage = 6;

  // Notification data — starts empty to show empty state
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      const rawData = Array.isArray(res.data) ? res.data : res.data?.notifications || res.data?.data || [];
      const data = rawData.map((item) => {
        const { date, time } = formatCreatedAt(item.createdAt);
        return {
          ...item,
          status: String(item.status || "Unread"),
          normalizedStatus: normalizeStatus(item.status),
          formattedDate: date,
          formattedTime: time,
        };
      });
      setNotifications(data);
    } catch (error) {
      console.log("Fetch Notifications API Error:", error.message, error.response?.data);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      await fetchNotifications();
    };

    void Promise.resolve().then(loadNotifications);
  }, [fetchNotifications]);

  // ================= API CALL: MARK AS READ (SINGLE) =================
  // Endpoint: PUT /notifications/{notificationId}/read
  const handleMarkAsRead = async (notification) => {
    const notificationId = notification?.id ?? notification?._id ?? notification?.notificationId;

    if (notificationId == null) {
      console.log("Mark Read aborted — no valid notification ID found on:", notification);
      toast.error("Could not find a valid notification ID for this item.");
      return;
    }

    const currentStatus = normalizeStatus(notification.status);
    if (currentStatus !== "unread") {
      return;
    }

    try {
      const res = await api.put(`/notifications/${notificationId}/read`);

      if (res.data && res.data.success === false) {
        console.log("Mark Read API returned failure body:", res.data, "for id:", notificationId);
        toast.error(res.data.message || "Failed to mark as read. Please try again.");
        return;
      }

      setNotifications((prev) =>
        prev.map((n) =>
          (n.id === notificationId || n._id === notificationId) && normalizeStatus(n.status) === "unread"
            ? { ...n, status: "Read", normalizedStatus: "read" }
            : n
        )
      );
    } catch (error) {
      console.log("Mark Read API Error:", error.message, error.response?.data);
      const errorMsg = error.response?.data?.message || "";
      toast.error(errorMsg || "Failed to mark as read. Please try again.");
    }
  };

  // ================= API CALL: MARK ALL AS READ =================
  // Endpoint: PUT /notifications/{notificationId}/read (for each unread)
  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => normalizeStatus(n.status) === "unread");

    if (unread.length === 0) return;

    setNotifications((prev) =>
      prev.map((n) =>
        normalizeStatus(n.status) === "unread"
          ? { ...n, status: "Read", normalizedStatus: "read" }
          : n
      )
    );

    try {
      await Promise.all(
        unread.map((notification) => {
          const notificationId = notification?.id ?? notification?._id ?? notification?.notificationId;
          if (notificationId == null) return Promise.resolve();
          return api.put(`/notifications/${notificationId}/read`);
        })
      );
    } catch (error) {
      console.log("Mark All Read API Error:", error.message, error.response?.data);
      toast.error("Some notifications could not be marked as read.");
      fetchNotifications();
    }
  };

  // Dismiss a notification (local only)
  const handleDismiss = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id && n._id !== id));
  };

  // Mark single as read on click
  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification);
  };

  // Unread count
  const unreadCount = useMemo(
    () => notifications.filter((n) => normalizeStatus(n.status) === "unread").length,
    [notifications]
  );

  // Filtered by status filter + search query
  const filteredNotifications = useMemo(() => {
    let result = notifications;

    // Status filter
    if (filter === "unread") {
      result = result.filter((n) => normalizeStatus(n.status) === "unread");
    } else if (filter === "read") {
      result = result.filter((n) => normalizeStatus(n.status) === "read");
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          (n.title || n.message || "").toLowerCase().includes(query) ||
          (n.message || "").toLowerCase().includes(query)
      );
    }

    return result;
  }, [notifications, searchQuery, filter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / itemsPerPage));
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Notification icon and style config
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

  const getTypeConfig = (type) => typeConfig[type] || typeConfig.info;

  return (
    <div className="nt-page">
      {/* ===== HEADER ===== */}
      <div className="nt-header-section">
        <div className="nt-header-top">
          <div className="nt-header-left">
            <h1 className="nt-heading">Notifications</h1>
            <p className="nt-subtitle">
              Stay updated with medicine reminders, stock alerts, and system notifications.
            </p>
          </div>
          <div className="nt-header-actions">
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
            <button className="nt-mark-all-btn" onClick={handleMarkAllRead}>
              <CheckCheck size={18} />
              Mark All Read
            </button>
          </div>
        </div>

        {/* ===== STATUS SUMMARY BAR ===== */}
        <div className="nt-summary-bar">
          <div className="nt-summary-info">
            <span className="nt-summary-total">
              <Inbox size={16} />
              <strong>{notifications.length}</strong> Total
            </span>
            <span className="nt-summary-unread">
              <Bell size={16} />
              <strong>{unreadCount}</strong> Unread
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="nt-filter-tabs">
            <button
              className={`nt-filter-tab ${filter === "all" ? "active" : ""}`}
              onClick={() => {
                setFilter("all");
                setCurrentPage(1);
              }}
            >
              <Filter size={14} />
              All
            </button>
            <button
              className={`nt-filter-tab ${filter === "unread" ? "active" : ""}`}
              onClick={() => {
                setFilter("unread");
                setCurrentPage(1);
              }}
            >
              <Bell size={14} />
              Unread
              {unreadCount > 0 && <span className="nt-filter-count">{unreadCount}</span>}
            </button>
            <button
              className={`nt-filter-tab ${filter === "read" ? "active" : ""}`}
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

      {/* ===== NOTIFICATION TABLE ===== */}
      {loading ? (
        /* Loading skeleton */
        <div className="nt-card">
          <div className="nt-skeleton-list">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="nt-skeleton-item">
                <div className="nt-skeleton-icon"></div>
                <div className="nt-skeleton-lines">
                  <div className="nt-skeleton-line short"></div>
                  <div className="nt-skeleton-line"></div>
                  <div className="nt-skeleton-line medium"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="nt-card">
          <div className="nt-empty">
            <div className="nt-empty-icon">
              {searchQuery || filter !== "all" ? <Search size={40} /> : <Bell size={40} />}
            </div>
            <h3>{searchQuery ? "No Search Results" : filter !== "all" ? `No ${filter} Notifications` : "No Notifications Yet"}</h3>
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
                }}
              >
                Clear Filters
              </button>
            )}
            <div className="nt-empty-decoration">
              <div className="nt-empty-dot"></div>
              <div className="nt-empty-dot"></div>
              <div className="nt-empty-dot"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="nt-card">
            {/* Table Header */}
            <div className="nt-table-header">
              <div className="nt-th nt-th-type">Type</div>
              <div className="nt-th nt-th-message">Notification</div>
              <div className="nt-th nt-th-date">Date</div>
              <div className="nt-th nt-th-time">Time</div>
              <div className="nt-th nt-th-status">Status</div>
              <div className="nt-th nt-th-actions">Actions</div>
            </div>

            {/* Table Body */}
            <div className="nt-table-body">
              {paginatedNotifications.map((notification) => {
                const config = getTypeConfig(notification.type);
                const TypeIcon = config.icon;
                const isUnread = normalizeStatus(notification.status) === "unread";
                const notifId = notification.id ?? notification._id ?? notification.notificationId;

                return (
                  <div
                    key={notifId}
                    className={`nt-table-row ${isUnread ? "nt-row-unread" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Type */}
                    <div className="nt-td nt-td-type">
                      <div
                        className="nt-type-icon"
                        style={{ backgroundColor: config.bg, color: config.color }}
                      >
                        <TypeIcon size={18} />
                      </div>
                      <span className={`nt-type-label ${config.badge}`}>{config.label}</span>
                    </div>

                    {/* Message */}
                    <div className="nt-td nt-td-message">
                      <div className="nt-msg-title">
                        {isUnread && <span className="nt-unread-dot"></span>}
                        <span className={isUnread ? "nt-msg-title-text unread" : "nt-msg-title-text"}>
                          {notification.title || notification.message}
                        </span>
                      </div>
                      <p className="nt-msg-desc">{notification.message || ""}</p>
                    </div>

                    {/* Date */}
                    <div className="nt-td nt-td-date">
                      <Calendar size={14} />
                      <span>{notification.formattedDate || "No date"}</span>
                    </div>

                    {/* Time */}
                    <div className="nt-td nt-td-time">
                      <Clock size={14} />
                      <span>{notification.formattedTime || "—"}</span>
                    </div>

                    {/* Status */}
                    <div className="nt-td nt-td-status">
                      <span className={`nt-status-pill ${isUnread ? "unread" : "read"}`}>
                        {isUnread ? <Mail size={12} /> : <MailOpen size={12} />}
                        {isUnread ? "Unread" : "Read"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="nt-td nt-td-actions">
                      <button
                        className="nt-dismiss-btn"
                        title="Dismiss"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(notifId);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===== BOTTOM BAR ===== */}
          <div className="nt-bottom-bar">
            <span className="nt-record-count">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of{" "}
              {filteredNotifications.length} notifications
            </span>
            <div className="nt-pagination">
              <button
                className="nt-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`nt-page-btn nt-page-num ${
                    currentPage === page ? "nt-page-active" : ""
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="nt-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
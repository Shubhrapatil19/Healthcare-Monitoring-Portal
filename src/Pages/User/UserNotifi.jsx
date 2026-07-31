import { useState, useMemo } from "react";
import "./UserNotifi.css";

import {
  Bell,
  Search,
  CheckCheck,
  Clock,
  X,
  Info,
  AlertTriangle,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

const UserNotifi = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Notification data — starts empty to show empty state
  const [notifications, setNotifications] = useState([]);

  // Filtered and searched notifications
  const filteredNotifications = useMemo(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return notifications.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query)
      );
    }
    return notifications;
  }, [notifications, searchQuery]);

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

  // Mark all as read
  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => (n.status === "unread" ? { ...n, status: "read" } : n))
    );
  };

  // Dismiss a notification
  const handleDismiss = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Mark single as read on click
  const handleNotificationClick = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && n.status === "unread" ? { ...n, status: "read" } : n))
    );
  };

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

      </div>

      {/* ===== NOTIFICATION LIST ===== */}
      {filteredNotifications.length === 0 ? (
        <div className="nt-card">
          <div className="nt-empty">
            <div className="nt-empty-icon">
              <Bell size={40} />
            </div>
            <h3>No Notifications Yet</h3>
            <p>
              {searchQuery
                ? "No notifications match your search. Try a different keyword."
                : "You're all caught up! When new notifications arrive, they will appear here."}
            </p>
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
            <div className="nt-list">
              {paginatedNotifications.map((notification) => {
                const config = getTypeConfig(notification.type);
                const TypeIcon = config.icon;
                const isUnread = notification.status === "unread";

                return (
                  <div
                    key={notification.id}
                    className={`nt-item ${isUnread ? "nt-unread" : ""}`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div
                      className="nt-item-icon"
                      style={{ backgroundColor: config.bg }}
                    >
                      <TypeIcon size={20} style={{ color: config.color }} />
                    </div>

                    <div className="nt-item-content">
                      <div className="nt-item-header">
                        <span className="nt-item-title">{notification.title}</span>
                        <span className={`nt-item-badge ${config.badge}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="nt-item-msg">{notification.message}</p>
                      <div className="nt-item-time">
                        <Calendar size={12} />
                        {notification.date}
                        <Clock size={12} style={{ marginLeft: 8 }} />
                        {notification.time}
                      </div>
                    </div>

                    <div className="nt-item-actions">
                      <button
                        className="nt-dismiss-btn"
                        title="Dismiss"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(notification.id);
                        }}
                      >
                        <X size={16} />
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
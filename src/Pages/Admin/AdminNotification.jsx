import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import gsap from "gsap";

import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

import {
  getAdminNotifications,
  getAdminNotificationStats,
} from "../../api/AdminMockApi";

import "./AdminNotification.css";

const ROWS_PER_PAGE = 5;

// ================================================================
// STAT COLORS
// ================================================================

const themeMap = {
  blue: {
    bg: "#3B82F6",
    text: "#2563EB",
  },

  green: {
    bg: "#22C55E",
    text: "#16A34A",
  },

  orange: {
    bg: "#F59E0B",
    text: "#D97706",
  },
};

// ================================================================
// STATUS CLASS
// ================================================================

const statusClassMap = {
  Delivered: "delivered",
  Pending: "pending",
};

// ================================================================
// HEADER
// ================================================================

function NotificationHeader() {
  return (
    <div className="notif-header">
      <div className="notif-header-left">
        <h1>
          Notifications
        </h1>

        <p>
          Medicine reminder notifications
          sent by the system to patients.
        </p>
      </div>
    </div>
  );
}

// ================================================================
// STATS
// ================================================================

function NotificationStats({
  stats,
  loading,
}) {
  const statsData = [
    {
      icon:
        <FiCalendar />,

      value:
        loading
          ? "..."
          : stats.sentToday,

      label:
        "SENT TODAY",

      theme:
        "blue",
    },

    {
      icon:
        <FiCheckCircle />,

      value:
        loading
          ? "..."
          : stats.delivered,

      label:
        "DELIVERED",

      theme:
        "green",
    },

    {
      icon:
        <FiClock />,

      value:
        loading
          ? "..."
          : stats.pending,

      label:
        "PENDING",

      theme:
        "orange",
    },
  ];

  return (
    <div className="notif-stats-row">
      {statsData.map(
        (stat) => {
          const colors =
            themeMap[
              stat.theme
            ];

          return (
            <div
              key={stat.label}
              className="notif-stat-card"
              style={{
                "--stat-teal":
                  colors.bg,
              }}
            >
              <div
                className="notif-stat-icon-wrap"
                style={{
                  background:
                    colors.bg,
                }}
              >
                {stat.icon}
              </div>

              <div>
                <div
                  className="notif-stat-value"
                  style={{
                    color:
                      colors.text,
                  }}
                >
                  {stat.value}
                </div>

                <div className="notif-stat-label">
                  {stat.label}
                </div>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

// ================================================================
// FILTERS
// ================================================================

function NotificationFilters({
  searchTerm,
  onSearchChange,

  patientFilter,
  onPatientChange,

  statusFilter,
  onStatusChange,

  patients,
}) {
  return (
    <div className="notif-filter-card">
      <div className="notif-filter-row">

        {/* SEARCH */}

        <div className="notif-search-wrap">
          <FiSearch className="notif-search-icon" />

          <input
            type="text"
            className="notif-search-input"
            placeholder="Search by patient or medicine..."
            value={
              searchTerm
            }
            onChange={(event) =>
              onSearchChange(
                event.target.value
              )
            }
          />
        </div>

        {/* PATIENT FILTER */}

        <div className="notif-filter-group">
          <select
            className="notif-filter-select"
            value={
              patientFilter
            }
            onChange={(event) =>
              onPatientChange(
                event.target.value
              )
            }
          >
            <option value="All Patients">
              All Patients
            </option>

            {patients.map(
              (patient) => (
                <option
                  key={
                    patient
                  }
                  value={
                    patient
                  }
                >
                  {patient}
                </option>
              )
            )}
          </select>
        </div>

        {/* STATUS FILTER */}

        <div className="notif-filter-group">
          <select
            className="notif-filter-select"
            value={
              statusFilter
            }
            onChange={(event) =>
              onStatusChange(
                event.target.value
              )
            }
          >
            <option value="All Statuses">
              All Statuses
            </option>

            <option value="Delivered">
              Delivered
            </option>

            <option value="Pending">
              Pending
            </option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// TABLE
// ================================================================

function NotificationTable({
  notifications,
  loading,
}) {
  return (
    <div className="notif-table-card">
      <div className="notif-table-wrap">
        <table className="notif-table">
          <colgroup>
            <col className="notif-col-patient" />
            <col className="notif-col-medicine" />
            <col className="notif-col-message" />
            <col className="notif-col-sent" />
            <col className="notif-col-status" />
          </colgroup>

          <thead>
            <tr>
              <th>
                Patient
              </th>

              <th>
                Medicine
              </th>

              <th>
                Message
              </th>

              <th>
                Sent At
              </th>

              <th>
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  className="notif-empty-row"
                >
                  Loading notifications...
                </td>
              </tr>
            ) : notifications.length ===
              0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="notif-empty-row"
                >
                  No notifications found.
                </td>
              </tr>
            ) : (
              notifications.map(
                (notification) => (
                  <tr
                    key={
                      notification.id
                    }
                  >
                    {/* PATIENT */}

                    <td>
                      <div className="notif-patient-cell">
                        <span className="notif-patient-name">
                          {
                            notification.patient
                          }
                        </span>

                        <span className="notif-patient-id">
                          Patient ID:{" "}
                          {
                            notification.patientId
                          }
                        </span>
                      </div>
                    </td>

                    {/* MEDICINE */}

                    <td>
                      <span className="notif-medicine-text">
                        {
                          notification.medicine
                        }
                      </span>
                    </td>

                    {/* MESSAGE */}

                    <td>
                      <span className="notif-message-text">
                        {
                          notification.message
                        }
                      </span>
                    </td>

                    {/* SENT AT */}

                    <td>
                      <span className="notif-sent-text">
                        {
                          notification.sentAt
                        }
                      </span>
                    </td>

                    {/* STATUS */}

                    <td>
                      <span
                        className={`notif-status-badge ${
                          statusClassMap[
                            notification.status
                          ] || ""
                        }`}
                      >
                        {
                          notification.status
                        }
                      </span>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ================================================================
// PAGINATION
// ================================================================

function NotificationPagination({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  onPageChange,
}) {
  if (
    totalItems === 0
  ) {
    return null;
  }

  const safeTotalPages =
    Math.max(
      totalPages,
      1
    );

  const pages =
    Array.from(
      {
        length:
          safeTotalPages,
      },

      (_, index) =>
        index + 1
    );

  const endIndex =
    Math.min(
      startIndex +
        ROWS_PER_PAGE,

      totalItems
    );

  return (
    <div className="notif-pagination">
      <div className="notif-pagination-info">
        Showing{" "}
        {startIndex + 1}
        {" "}to{" "}
        {endIndex}
        {" "}of{" "}
        {totalItems}
        {" "}entries
      </div>

      <div className="notif-pagination-controls">

        {/* PREVIOUS */}

        <button
          type="button"
          className="notif-page-btn"
          disabled={
            currentPage ===
            1
          }
          onClick={() =>
            onPageChange(
              currentPage -
                1
            )
          }
        >
          <FiChevronLeft
            size={16}
          />
        </button>

        {/* PAGE NUMBERS */}

        {pages.map(
          (page) => (
            <button
              type="button"
              key={
                page
              }
              className={`notif-page-btn ${
                currentPage ===
                page
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                onPageChange(
                  page
                )
              }
            >
              {page}
            </button>
          )
        )}

        {/* NEXT */}

        <button
          type="button"
          className="notif-page-btn"
          disabled={
            currentPage ===
            safeTotalPages
          }
          onClick={() =>
            onPageChange(
              currentPage +
                1
            )
          }
        >
          <FiChevronRight
            size={16}
          />
        </button>
      </div>
    </div>
  );
}

// ================================================================
// MAIN ADMIN NOTIFICATION
// ================================================================

export default function AdminNotification() {
  // =========================================================
  // DATA
  // =========================================================

  const [
    notifications,
    setNotifications,
  ] =
    useState([]);

  const [
    stats,
    setStats,
  ] =
    useState({
      sentToday: 0,
      delivered: 0,
      pending: 0,
    });

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  // =========================================================
  // FILTERS
  // =========================================================

  const [
    searchTerm,
    setSearchTerm,
  ] =
    useState("");

  const [
    patientFilter,
    setPatientFilter,
  ] =
    useState(
      "All Patients"
    );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState(
      "All Statuses"
    );

  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(1);

  const pageRef =
    useRef(null);

  // =========================================================
  // LOAD DATA FROM AdminMockApi
  // =========================================================

  useEffect(() => {
    let cancelled =
      false;

    const loadNotifications =
      async () => {
        try {
          const [
            notificationResponse,
            statResponse,
          ] =
            await Promise.all([
              getAdminNotifications(),
              getAdminNotificationStats(),
            ]);

          if (cancelled) {
            return;
          }

          setNotifications(
            notificationResponse
              ?.data
              ?.notifications ||
              []
          );

          setStats({
            sentToday:
              Number(
                statResponse
                  ?.data
                  ?.sentToday
              ) || 0,

            delivered:
              Number(
                statResponse
                  ?.data
                  ?.delivered
              ) || 0,

            pending:
              Number(
                statResponse
                  ?.data
                  ?.pending
              ) || 0,
          });
        } catch (error) {
          if (cancelled) {
            return;
          }

          console.error(
            "Admin notification load error:",
            error
          );

          setNotifications([]);

          setStats({
            sentToday: 0,
            delivered: 0,
            pending: 0,
          });
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // GSAP
  // =========================================================

  useEffect(() => {
    if (loading) {
      return undefined;
    }

    try {
      const context =
        gsap.context(
          () => {
            gsap.from(
              ".notif-header",
              {
                opacity: 0,
                y: -20,
                duration:
                  0.5,

                clearProps:
                  "all",
              }
            );

            gsap.from(
              ".notif-stat-card",
              {
                opacity: 0,
                y: 30,
                scale: 0.9,
                duration:
                  0.5,

                stagger:
                  0.1,

                clearProps:
                  "all",
              }
            );

            gsap.from(
              ".notif-filter-card",
              {
                opacity: 0,
                x: -25,
                duration:
                  0.5,

                delay:
                  0.2,

                clearProps:
                  "all",
              }
            );

            gsap.from(
              ".notif-table-card",
              {
                opacity: 0,
                x: 25,
                duration:
                  0.5,

                delay:
                  0.3,

                clearProps:
                  "all",
              }
            );
          },

          pageRef
        );

      return () =>
        context.revert();
    } catch {
      return undefined;
    }
  }, [loading]);

  // =========================================================
  // PATIENT OPTIONS
  // =========================================================

  const patientOptions =
    useMemo(() => {
      return [
        ...new Set(
          notifications
            .map(
              (item) =>
                item.patient
            )
            .filter(Boolean)
        ),
      ].sort();
    }, [notifications]);

  // =========================================================
  // FILTERED NOTIFICATIONS
  // =========================================================

  const filteredNotifications =
    useMemo(() => {
      const query =
        searchTerm
          .trim()
          .toLowerCase();

      return notifications.filter(
        (notification) => {
          const patient =
            String(
              notification.patient ||
                ""
            ).toLowerCase();

          const medicine =
            String(
              notification.medicine ||
                ""
            ).toLowerCase();

          const message =
            String(
              notification.message ||
                ""
            ).toLowerCase();

          const matchesSearch =
            !query ||
            patient.includes(
              query
            ) ||
            medicine.includes(
              query
            ) ||
            message.includes(
              query
            );

          const matchesPatient =
            patientFilter ===
              "All Patients" ||
            notification.patient ===
              patientFilter;

          const matchesStatus =
            statusFilter ===
              "All Statuses" ||
            notification.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesPatient &&
            matchesStatus
          );
        }
      );
    }, [
      notifications,
      searchTerm,
      patientFilter,
      statusFilter,
    ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages =
    Math.ceil(
      filteredNotifications.length /
        ROWS_PER_PAGE
    );

  const safeCurrentPage =
    Math.min(
      currentPage,
      Math.max(
        totalPages,
        1
      )
    );

  const startIndex =
    (safeCurrentPage - 1) *
    ROWS_PER_PAGE;

  const paginatedNotifications =
    filteredNotifications.slice(
      startIndex,
      startIndex +
        ROWS_PER_PAGE
    );

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      className="notif-page"
      ref={pageRef}
    >
      <NotificationHeader />

      <NotificationStats
        stats={stats}
        loading={loading}
      />

      <NotificationFilters
        searchTerm={
          searchTerm
        }
        onSearchChange={(
          value
        ) => {
          setSearchTerm(
            value
          );

          setCurrentPage(
            1
          );
        }}

        patientFilter={
          patientFilter
        }
        onPatientChange={(
          value
        ) => {
          setPatientFilter(
            value
          );

          setCurrentPage(
            1
          );
        }}

        statusFilter={
          statusFilter
        }
        onStatusChange={(
          value
        ) => {
          setStatusFilter(
            value
          );

          setCurrentPage(
            1
          );
        }}

        patients={
          patientOptions
        }
      />

      <NotificationTable
        notifications={
          paginatedNotifications
        }
        loading={
          loading
        }
      />

      {!loading && (
        <NotificationPagination
          currentPage={
            safeCurrentPage
          }
          totalPages={
            totalPages
          }
          totalItems={
            filteredNotifications.length
          }
          startIndex={
            startIndex
          }
          onPageChange={
            setCurrentPage
          }
        />
      )}
    </div>
  );
}

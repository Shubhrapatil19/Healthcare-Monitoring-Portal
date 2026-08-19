import {
  useEffect,
  useRef,
  useState,
} from "react";

import gsap from "gsap";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

import {
  FiGrid,
  FiUsers,
  FiFileText,
  FiLogOut,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiPackage,
  FiActivity,
  FiClipboard,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiAlertCircle,
  FiBell,
  FiAlertTriangle,
  FiArchive,
  FiUserPlus,
} from "react-icons/fi";

/* ================================================================
   ADMIN MOCK API
================================================================ */

import {
  getAdminDashboardData,
  getAdminInfo,
  logoutAdmin,
} from "../../api/AdminMockApi";

/* ================================================================
   ADMIN PAGES
   Same folder ke andar hain
================================================================ */

import AdminPatientManagementPage from "./AdminPatientManagementPage";
import AdminNotification from "./AdminNotification";
import AdminReport from "./AdminReport";
import AdminProfile from "./AdminProfile";
import LogoutModal from "./LogoutModal";

/* ================================================================
   CSS
================================================================ */

import "./AdminDashboard.css";

// ================================================================
// SIDEBAR ITEMS
// ================================================================

const mainNavItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <FiGrid />,
  },
  {
    id: "patients",
    label: "Patient Management",
    icon: <FiUsers />,
  },
];

const secondaryNavItems = [
  {
    id: "reports",
    label: "Patient Report",
    icon: <FiFileText />,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <FiBell />,
  },
  {
    id: "profile",
    label: "Profile",
    icon: <FiUserPlus />,
  },
];

// ================================================================
// SIDEBAR
// ================================================================

function AdminSidebar({
  activePage,
  onNavigate,
  isOpen,
  onToggle,
  onClose,
  onLogout,
}) {
  const renderNavGroup = (items) => (
    <>
      <div className="sidebar-section-items">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            title={item.label}
            className={`sidebar-item ${
              activePage === item.id
                ? "active"
                : ""
            }`}
            onClick={() => {
              onNavigate(item.id);

              if (onClose) {
                onClose();
              }
            }}
          >
            <span className="sidebar-icon">
              {item.icon}
            </span>

            {isOpen && (
              <span>
                {item.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <aside
      className={`sidebar ${
        isOpen ? "open" : ""
      }`}
    >
      <div className="sidebar-header">
        {isOpen && (
          <h3 className="sidebar-title">
            Menu
          </h3>
        )}
      </div>

      <nav className="sidebar-menu">
        {renderNavGroup(mainNavItems)}

        <div className="sidebar-divider" />

        {renderNavGroup(secondaryNavItems)}

        <div className="sidebar-divider" />

        <button
          type="button"
          className="sidebar-item sidebar-logout"
          title="Logout"
          onClick={onLogout}
        >
          <span className="sidebar-icon">
            <FiLogOut />
          </span>

          {isOpen && (
            <span>
              Logout
            </span>
          )}
        </button>
      </nav>
    </aside>
  );
}

// ================================================================
// NAVBAR
// ================================================================

function AdminNavbar({
  onToggleSidebar,
  adminInfo,
  onNotifications,
  onProfile,
}) {
  const name =
    adminInfo?.name ||
    adminInfo?.fullName ||
    localStorage.getItem(
      "currentUserName"
    ) ||
    "Healthcare Admin";

  const role =
    adminInfo?.role ||
    "Admin";

  const initials =
    adminInfo?.initials ||
    name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <header className="admin-navbar">
      {/* LEFT */}

      <div className="admin-navbar-left">
        <button
          type="button"
          className="admin-menu-btn"
          aria-label="Toggle admin sidebar"
          onClick={
            onToggleSidebar
          }
        >
          <FiMenu />
        </button>

        <div className="admin-navbar-brand">
          <img
            src="ChatGPT Image Jun 22, 2026, 07_52_50 PM.png"
            alt="logo"
            className="admin-brand-logo"
          />

          <div className="admin-brand-texts">
            <h1 className="admin-brand-title">
              Healthcare Monitoring System
            </h1>

            <span className="admin-brand-subtitle">
              Secure • Reliable • Care Focused
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT */}

      <div className="admin-navbar-right">
        <button
          type="button"
          className="admin-notif-btn"
          onClick={
            onNotifications
          }
          title="Notifications"
        >
          <FiBell />

          <span className="admin-notif-dot" />
        </button>

        <button
          type="button"
          className="admin-user-profile"
          onClick={
            onProfile
          }
        >
          <div className="admin-user-avatar">
            {initials}
          </div>

          <div className="admin-user-details">
            <span className="admin-user-name">
              {name}
            </span>

            <span className="admin-user-role">
              {role}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}

// ================================================================
// DATE CONSTANTS
// ================================================================

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const shortDayNames = [
  "Su",
  "Mo",
  "Tu",
  "We",
  "Th",
  "Fr",
  "Sa",
];

// ================================================================
// DATE WIDGET
// Past dates visible
// Future dates blurred/disabled
// ================================================================

function DateWidget({
  selectedDate,
  onDateChange,
}) {
  const [
    showPicker,
    setShowPicker,
  ] = useState(false);

  const [
    pickerMonth,
    setPickerMonth,
  ] = useState(
    selectedDate.getMonth()
  );

  const [
    pickerYear,
    setPickerYear,
  ] = useState(
    selectedDate.getFullYear()
  );

  const pickerRef =
    useRef(null);

  const today =
    new Date();

  const todayMidnight =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

  // =========================================================
  // OUTSIDE CLICK
  // =========================================================

  useEffect(() => {
    const handleOutside = (
      event
    ) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(
          event.target
        )
      ) {
        setShowPicker(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutside
      );
    };
  }, []);

  // =========================================================
  // CALENDAR DAYS
  // =========================================================

  const generateDays = () => {
    const firstDay =
      new Date(
        pickerYear,
        pickerMonth,
        1
      ).getDay();

    const totalDays =
      new Date(
        pickerYear,
        pickerMonth + 1,
        0
      ).getDate();

    const days = [];

    // Previous month days
    for (
      let i =
        firstDay - 1;
      i >= 0;
      i--
    ) {
      days.push({
        date:
          new Date(
            pickerYear,
            pickerMonth,
            0
          ).getDate() - i,

        other: true,

        disabled: true,
      });
    }

    // Current month
    for (
      let day = 1;
      day <= totalDays;
      day++
    ) {
      const current =
        new Date(
          pickerYear,
          pickerMonth,
          day
        );

      const isFuture =
        current >
        todayMidnight;

      days.push({
        date: day,
        other: false,
        disabled: isFuture,
      });
    }

    return days;
  };

  // =========================================================
  // SELECT DATE
  // =========================================================

  const handleDatePick = (
    day
  ) => {
    if (
      day.other ||
      day.disabled
    ) {
      return;
    }

    const date =
      new Date(
        pickerYear,
        pickerMonth,
        day.date
      );

    onDateChange(date);

    setShowPicker(false);
  };

  // =========================================================
  // TOGGLE
  // =========================================================

  const togglePicker =
    () => {
      setPickerMonth(
        selectedDate.getMonth()
      );

      setPickerYear(
        selectedDate.getFullYear()
      );

      setShowPicker(
        (prev) => !prev
      );
    };

  const month =
    monthNames[
      selectedDate.getMonth()
    ];

  const dayName =
    dayNames[
      selectedDate.getDay()
    ];

  return (
    <div
      className="date-widget"
      onClick={togglePicker}
      style={{
        position: "relative",
        cursor: "pointer",
      }}
    >
      <div className="date-widget-icon">
        <FiCalendar />
      </div>

      <div className="date-widget-info">
        <div className="date-widget-day">
          {dayName}
        </div>

        <div className="date-widget-date">
          {month}{" "}
          {selectedDate.getDate()},
          {" "}
          {selectedDate.getFullYear()}
        </div>
      </div>

      {/* CALENDAR */}

      {showPicker && (
        <div
          className="date-picker-dropdown"
          ref={pickerRef}
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <div className="date-picker-header">
            <button
              type="button"
              onClick={() => {
                if (
                  pickerMonth ===
                  0
                ) {
                  setPickerMonth(11);

                  setPickerYear(
                    (prev) =>
                      prev - 1
                  );
                } else {
                  setPickerMonth(
                    (prev) =>
                      prev - 1
                  );
                }
              }}
            >
              <FiChevronLeft />
            </button>

            <span>
              {
                monthNames[
                  pickerMonth
                ]
              }{" "}
              {pickerYear}
            </span>

            <button
              type="button"
              disabled={
                pickerYear >
                  today.getFullYear() ||
                (
                  pickerYear ===
                    today.getFullYear() &&
                  pickerMonth >=
                    today.getMonth()
                )
              }
              onClick={() => {
                if (
                  pickerMonth ===
                  11
                ) {
                  setPickerMonth(0);

                  setPickerYear(
                    (prev) =>
                      prev + 1
                  );
                } else {
                  setPickerMonth(
                    (prev) =>
                      prev + 1
                  );
                }
              }}
            >
              <FiChevronRight />
            </button>
          </div>

          <div className="date-picker-grid">
            {shortDayNames.map(
              (day) => (
                <div
                  className="dp-day-name"
                  key={day}
                >
                  {day}
                </div>
              )
            )}

            {generateDays().map(
              (
                day,
                index
              ) => (
                <div
                  key={index}
                  className={`dp-day ${
                    day.other
                      ? "other"
                      : ""
                  } ${
                    day.disabled
                      ? "disabled"
                      : ""
                  } ${
                    !day.other &&
                    day.date ===
                      selectedDate.getDate() &&
                    pickerMonth ===
                      selectedDate.getMonth() &&
                    pickerYear ===
                      selectedDate.getFullYear()
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleDatePick(
                      day
                    )
                  }
                >
                  {day.date}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ================================================================
// COUNT UP
// ================================================================

function useCountUp(value) {
  const [
    displayValue,
    setDisplayValue,
  ] = useState(
    Number(value) || 0
  );

  const previousRef =
    useRef(
      Number(value) || 0
    );

  useEffect(() => {
    const from =
      previousRef.current;

    const to =
      Number(value) || 0;

    if (from === to) {
      setDisplayValue(to);
      return undefined;
    }

    const duration =
      600;

    const start =
      performance.now();

    let frame;

    const animate = (
      now
    ) => {
      const progress =
        Math.min(
          (now - start) /
            duration,
          1
        );

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3
        );

      setDisplayValue(
        Math.round(
          from +
            (to - from) *
              eased
        )
      );

      if (
        progress < 1
      ) {
        frame =
          requestAnimationFrame(
            animate
          );
      } else {
        previousRef.current =
          to;
      }
    };

    frame =
      requestAnimationFrame(
        animate
      );

    return () =>
      cancelAnimationFrame(
        frame
      );
  }, [value]);

  return displayValue;
}

// ================================================================
// STAT CARD
// ================================================================

function StatCard({
  card,
  color,
}) {
  const value =
    useCountUp(
      card.value
    );

  return (
    <div className="stat-card-item">
      <div
        className="stat-icon-circle"
        style={{
          background:
            color.bg,
        }}
      >
        {card.icon}
      </div>

      <div>
        <div
          className="stat-number"
          style={{
            color:
              color.text,
          }}
        >
          {value}
        </div>

        <div className="stat-label">
          {card.label}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// DASHBOARD CARDS
// ================================================================

function DashboardCards({
  data,
  selectedDate,
  onDateChange,
}) {
  const cards = [
    {
      id: 1,
      label:
        "TODAY'S MEDICINE",
      value:
        data?.todaysMedicines ??
        0,
      icon:
        <FiActivity />,
    },

    {
      id: 2,
      label: "TAKEN",
      value:
        data?.medicinesTaken ??
        0,
      icon:
        <FiCheckCircle />,
    },

    {
      id: 3,
      label: "MISSED",
      value:
        data?.medicinesMissed ??
        0,
      icon:
        <FiXCircle />,
    },

    {
      id: 4,
      label:
        "LOW STOCK ALERTS",
      value:
        data?.lowStockAlerts ??
        0,
      icon:
        <FiPackage />,
    },
  ];

  const colors = {
    1: {
      bg: "#8B5CF6",
      text: "#7C3AED",
    },

    2: {
      bg: "#22C55E",
      text: "#16A34A",
    },

    3: {
      bg: "#EF4444",
      text: "#DC2626",
    },

    4: {
      bg: "#F59E0B",
      text: "#D97706",
    },
  };

  return (
    <div className="stat-cards-row">
      <div className="stat-cards">
        {cards.map(
          (card) => (
            <StatCard
              key={card.id}
              card={card}
              color={
                colors[
                  card.id
                ]
              }
            />
          )
        )}
      </div>

      <DateWidget
        selectedDate={
          selectedDate
        }
        onDateChange={
          onDateChange
        }
      />
    </div>
  );
}

// ================================================================
// SUMMARY
// ================================================================

function SummaryCard({
  data,
  selectedDate,
}) {
  const rows = [
    {
      label:
        "Medicines Taken",
      value:
        data?.taken ?? 0,
    },

    {
      label:
        "Medicines Missed",
      value:
        data?.missed ?? 0,
    },

    {
      label:
        "Total Alerts",
      value:
        data?.totalAlerts ??
        0,
    },

    {
      label:
        "New Patients",
      value:
        data?.newPatients ??
        0,
    },

    {
      label:
        "Blocked Patients",
      value:
        data?.blockedPatients ??
        0,
    },
  ];

  return (
    <div className="card summary-card">
      <div className="summary-card-header">
        <div className="summary-title-wrap">
          <span className="summary-header-icon">
            <FiClipboard size={20} />
          </span>

          <div>
            <h3 className="summary-heading">
              TODAY&apos;S SUMMARY
            </h3>

            <span className="summary-caption">
              Daily patient activity
            </span>
          </div>
        </div>

        <span className="summary-date-pill">
          {
            monthNames[
              selectedDate.getMonth()
            ]
          }{" "}
          {
            selectedDate.getDate()
          }
        </span>
      </div>

      <div className="summary-table">
        {rows.map(
          (row, index) => (
            <div
              className="summary-row"
              key={
                row.label
              }
            >
              <span className="summary-row-marker">
                {index + 1}
              </span>

              <span className="label">
                {
                  row.label
                }
              </span>

              <span className="badge-teal">
                {
                  row.value
                }
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ================================================================
// PATIENT CHART
// ================================================================

function PatientChart({
  data,
}) {
  const active =
    data?.active ?? 0;

  const inactive =
    data?.inactive ?? 0;

  const total =
    data?.total ??
    active + inactive;

  const chartData = [
    {
      name: "Active",
      value: active,
      color: "#22C55E",
    },

    {
      name: "Inactive",
      value: inactive,
      color: "#EF4444",
    },
  ];

  return (
    <div className="card patient-status-card">
      <div className="patient-status-header">
        <div className="patient-status-title-wrap">
          <span className="patient-status-icon">
            <FiUsers size={20} />
          </span>

          <div>
            <h3 className="patient-status-heading">
              PATIENTS STATUS
            </h3>

            <span className="patient-status-caption">
              Active vs inactive patients
            </span>
          </div>
        </div>

        <span className="patient-status-total-pill">
          {total} Total
        </span>
      </div>

      <div className="pc-chart-area">
        <div
          className="doughnut-wrapper"
          style={{
            width: 260,
            height: 260,
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={82}
                outerRadius={115}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map(
                  (
                    entry,
                    index
                  ) => (
                    <Cell
                      key={
                        index
                      }
                      fill={
                        entry.color
                      }
                    />
                  )
                )}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="doughnut-center-text">
            <strong>
              {total}
            </strong>

            Total
          </div>
        </div>

        <div className="pc-stats-vertical">
          {chartData.map(
            (item) => (
              <div
                className="pc-stat-item"
                key={
                  item.name
                }
              >
                <span
                  className="pc-dot"
                  style={{
                    background:
                      item.color,
                  }}
                />

                <span className="pc-stat-label">
                  {
                    item.name
                  }
                </span>

                <span className="pc-stat-value">
                  {
                    item.value
                  }
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// ALERT CARD
// ================================================================

function AlertsCard({
  data,
}) {
  const alerts = [
    {
      label:
        "Today's Alerts",
      value:
        data?.todayAlerts ??
        0,
      icon:
        <FiAlertTriangle />,
      color:
        "#EF4444",
    },

    {
      label:
        "Medicine Alerts",
      value:
        data?.medicineAlerts ??
        0,
      icon:
        <FiBell />,
      color:
        "#F59E0B",
    },

    {
      label:
        "Low Stock Alerts",
      value:
        data?.lowStockAlerts ??
        0,
      icon:
        <FiPackage />,
      color:
        "#18A999",
    },

    {
      label:
        "Out of Stock",
      value:
        data?.outOfStockAlerts ??
        0,
      icon:
        <FiArchive />,
      color:
        "#6366F1",
    },
  ];

  return (
    <div className="card">
      <h3>
        <FiAlertCircle
          style={{
            marginRight: 10,
            verticalAlign:
              "middle",
          }}
        />

        ALERTS
      </h3>

      <div className="alerts-list">
        {alerts.map(
          (alert) => (
            <div
              className="alert-row"
              key={
                alert.label
              }
            >
              <span className="alert-label">
                <span
                  className="alert-icon"
                  style={{
                    color:
                      alert.color,
                  }}
                >
                  {
                    alert.icon
                  }
                </span>

                <span className="alert-text">
                  {
                    alert.label
                  }
                </span>
              </span>

              <span
                className="alert-value"
                style={{
                  background:
                    `${alert.color}18`,

                  color:
                    alert.color,
                }}
              >
                {
                  alert.value
                }
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ================================================================
// INVENTORY CHART
// ================================================================

function InventoryChart({
  data,
}) {
  const [
    selectedInventoryIndex,
    setSelectedInventoryIndex,
  ] = useState(0);

  const chartData = [
    {
      name:
        "In Stock",
      value:
        data?.inStock ??
        0,
      color:
        "#18B6A5",
    },

    {
      name: "Low",
      value:
        data?.low ?? 0,
      color:
        "#4C8BF5",
    },

    {
      name:
        "Out of Stock",
      value:
        data?.outOfStock ??
        0,
      color:
        "#FFA726",
    },

    {
      name: "Expired",
      value:
        data?.expired ??
        0,
      color:
        "#F44336",
    },
  ];

  const total =
    data?.total ??
    chartData.reduce(
      (sum, item) =>
        sum +
        item.value,
      0
    );

  const selectedInventory =
    chartData[
      selectedInventoryIndex
    ] ?? chartData[0];

  const selectedPercent =
    total > 0
      ? Math.round(
          (selectedInventory.value /
            total) *
            100
        )
      : 0;

  return (
    <div className="card inventory-card">
      <div className="inventory-header">
        <div className="inventory-title-wrap">
          <span className="inventory-header-icon">
            <FiArchive size={20} />
          </span>

          <div>
            <h3 className="inventory-heading">
              INVENTORY OVERVIEW
            </h3>

            <span className="inventory-caption">
              Stock health by category
            </span>
          </div>
        </div>

        <span className="inventory-total-pill">
          {total} Items
        </span>
      </div>

      <div className="inventory-content">
        <div className="inventory-chart-shell">
        <div
          className="doughnut-wrapper"
          style={{
            width: 340,
            height: 340,
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={95}
                outerRadius={150}
                paddingAngle={2}
                dataKey="value"
                onClick={(
                  _entry,
                  index
                ) =>
                  setSelectedInventoryIndex(
                    index
                  )
                }
              >
                {chartData.map(
                  (
                    entry,
                    index
                  ) => (
                    <Cell
                      key={
                        index
                      }
                      fill={
                        entry.color
                      }
                      stroke={
                        selectedInventoryIndex ===
                        index
                          ? "#ffffff"
                          : "transparent"
                      }
                      strokeWidth={
                        selectedInventoryIndex ===
                        index
                          ? 4
                          : 0
                      }
                      opacity={
                        selectedInventoryIndex ===
                        index
                          ? 1
                          : 0.82
                      }
                      cursor="pointer"
                    />
                  )
                )}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="doughnut-center-text">
            <strong>
              {total}
            </strong>

            Total Medicines
          </div>
        </div>

          <div className="inventory-detail-card">
            <span
              className="inventory-detail-dot"
              style={{
                background:
                  selectedInventory.color,
              }}
            />

            <div>
              <span className="inventory-detail-label">
                {
                  selectedInventory.name
                }
              </span>

              <strong>
                {
                  selectedInventory.value
                }{" "}
                medicines
              </strong>
            </div>

            <span className="inventory-detail-percent">
              {selectedPercent}%
            </span>
          </div>
        </div>

        <div className="inventory-legend">
          {chartData.map(
            (item, index) => (
              <div
                className={`inventory-legend-item ${
                  selectedInventoryIndex ===
                  index
                    ? "active"
                    : ""
                }`}
                key={
                  item.name
                }
                role="button"
                tabIndex={0}
                onClick={() =>
                  setSelectedInventoryIndex(
                    index
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                      "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();
                    setSelectedInventoryIndex(
                      index
                    );
                  }
                }}
              >
                <span
                  className="legend-dot"
                  style={{
                    background:
                      item.color,
                  }}
                />

                <span>
                  {
                    item.name
                  }
                </span>

                <span className="inv-value">
                  {
                    item.value
                  }
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// QUICK ACTIONS
// ================================================================

function QuickActionsCard({
  onAddPatient,
  onGenerateReport,
}) {
  return (
    <div className="card qa-card">
      <div className="qa-header">
        <div className="qa-header-left">
          <span className="qa-header-icon">
            <FiClipboard
              size={18}
            />
          </span>

          <h3 className="qa-title">
            QUICK ACTIONS
          </h3>
        </div>

        <div className="qa-divider" />
      </div>

      <div className="qa-grid">
        <button
          type="button"
          className="qa-action-card"
          onClick={
            onAddPatient
          }
        >
          <span className="qa-action-icon">
            <FiUserPlus
              size={36}
            />
          </span>

          <span className="qa-action-text">
            Add New Patient
          </span>
        </button>

        <button
          type="button"
          className="qa-action-card"
          onClick={
            onGenerateReport
          }
        >
          <span className="qa-action-icon">
            <FiFileText
              size={36}
            />
          </span>

          <span className="qa-action-text">
            Generate Report
          </span>
        </button>
      </div>
    </div>
  );
}

// ================================================================
// MAIN ADMIN DASHBOARD
// ================================================================

function AdminDashboard({
  onLogout,
}) {
  // =========================================================
  // NAVIGATION
  // =========================================================

  const [
    activePage,
    setActivePage,
  ] = useState(
    "dashboard"
  );

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.innerWidth > 992;
  });

  const [
    isMobileSidebar,
    setIsMobileSidebar,
  ] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.innerWidth <= 992;
  });

  // =========================================================
  // DATE
  // =========================================================

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    new Date()
  );

  // =========================================================
  // DATA
  // =========================================================

  const [
    dashboardData,
    setDashboardData,
  ] = useState({
    cards: {},
    summary: {},
    patientStatus: {},
    alerts: {},
    inventory: {},
  });

  const [
    adminInfo,
    setAdminInfo,
  ] = useState({
    name:
      "Healthcare Admin",
    role:
      "Admin",
    initials:
      "HA",
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  // =========================================================
  // LOGOUT
  // =========================================================

  const [
    showLogoutModal,
    setShowLogoutModal,
  ] = useState(false);

  const dashboardRef =
    useRef(null);

  // =========================================================
  // LOAD ADMIN INFO
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadAdmin =
      async () => {
        try {
          const response =
            await getAdminInfo();

          if (
            mounted &&
            response?.data
          ) {
            setAdminInfo(
              response.data
            );
          }
        } catch (error) {
          console.error(
            "Admin info error:",
            error
          );
        }
      };

    loadAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // LOAD DASHBOARD DATA
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadDashboard =
      async () => {
        setLoading(true);

        try {
          const response =
            await getAdminDashboardData(
              selectedDate
            );

          if (mounted) {
            setDashboardData(
              response?.data || {
                cards: {},
                summary: {},
                patientStatus:
                  {},
                alerts: {},
                inventory: {},
              }
            );
          }
        } catch (error) {
          console.error(
            "Dashboard mock data error:",
            error
          );
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [selectedDate]);

  // =========================================================
  // SIDEBAR RESPONSIVE STATE
  // =========================================================

  useEffect(() => {
    const handleResize =
      () => {
        const isMobile =
          window.innerWidth <=
          992;

        setIsMobileSidebar(
          isMobile
        );

        setSidebarOpen(
          isMobile ? false : true
        );
      };

    handleResize();

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  // =========================================================
  // ANIMATION
  // =========================================================

  useEffect(() => {
    if (
      loading ||
      activePage !==
        "dashboard"
    ) {
      return undefined;
    }

    try {
      const context =
        gsap.context(
          () => {
            const timeline =
              gsap.timeline({
                defaults: {
                  ease: "power3.out",
                  clearProps:
                    "all",
                },
              });

            timeline.from(
              ".admin-dashboard-title",
              {
                opacity: 0,
                y: 6,
                duration: 0.42,
              }
            );

            timeline.from(
              ".stat-card-item, .admin-second-row .card, .admin-third-row .card",
              {
                opacity: 0,
                y: 10,
                scale: 0.992,
                stagger: 0.015,
                duration: 0.5,
              }
              ,
              "-=0.26"
            );
          },
          dashboardRef
        );

      return () =>
        context.revert();
    } catch {
      return undefined;
    }
  }, [
    loading,
    activePage,
    selectedDate,
  ]);

  // =========================================================
  // NAVIGATION
  // =========================================================

  const handleNavigate =
    (page) => {
      setActivePage(page);

      if (isMobileSidebar) {
        setSidebarOpen(false);
      }
    };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout =
    () => {
      logoutAdmin();

      if (
        typeof onLogout ===
        "function"
      ) {
        onLogout();
      }
    };

  // =========================================================
  // RENDER PAGE
  // =========================================================

  const renderPageContent =
    () => {
      // DASHBOARD

      if (
        activePage ===
        "dashboard"
      ) {
        return (
          <>
            <h2 className="admin-dashboard-title">
              DASHBOARD
            </h2>

            {loading ? (
              <div className="card">
                Loading dashboard...
              </div>
            ) : (
              <>
                <DashboardCards
                  data={
                    dashboardData.cards
                  }
                  selectedDate={
                    selectedDate
                  }
                  onDateChange={
                    setSelectedDate
                  }
                />

                <div className="admin-second-row">
                  <SummaryCard
                    data={
                      dashboardData.summary
                    }
                    selectedDate={
                      selectedDate
                    }
                  />

                  <PatientChart
                    data={
                      dashboardData.patientStatus
                    }
                  />

                  <AlertsCard
                    data={
                      dashboardData.alerts
                    }
                  />
                </div>

                <div className="admin-third-row">
                  <InventoryChart
                    data={
                      dashboardData.inventory
                    }
                  />

                  <QuickActionsCard
                    onAddPatient={() => {
                      setActivePage(
                        "patients"
                      );
                    }}
                    onGenerateReport={() =>
                      setActivePage(
                        "reports"
                      )
                    }
                  />
                </div>
              </>
            )}
          </>
        );
      }

      // PATIENT MANAGEMENT

      if (
        activePage ===
        "patients"
      ) {
        return (
          <AdminPatientManagementPage />
        );
      }

      // REPORT

      if (
        activePage ===
        "reports"
      ) {
        return (
          <AdminReport />
        );
      }

      // NOTIFICATIONS

      if (
        activePage ===
        "notifications"
      ) {
        return (
          <AdminNotification />
        );
      }

      // PROFILE

      if (
        activePage ===
        "profile"
      ) {
        return (
          <AdminProfile />
        );
      }

      return null;
    };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      className={`dashboard-layout ${
        sidebarOpen
          ? "sidebar-expanded"
          : "sidebar-collapsed"
      } ${
        isMobileSidebar
          ? "sidebar-mobile"
          : ""
      }`}
    >
      {/* MOBILE OVERLAY */}

      {isMobileSidebar &&
        sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() =>
              setSidebarOpen(false)
            }
          />
        )}

      {/* SIDEBAR */}

      <AdminSidebar
        activePage={
          activePage
        }
        onNavigate={
          handleNavigate
        }
        isOpen={
          sidebarOpen
        }
        onToggle={() =>
          setSidebarOpen(
            (prev) => !prev
          )
        }
        onClose={() =>
          isMobileSidebar &&
          setSidebarOpen(false)
        }
        onLogout={() =>
          setShowLogoutModal(true)
        }
      />

      {/* MAIN */}

      <div
        className="dashboard-main"
        ref={dashboardRef}
      >
        <AdminNavbar
          adminInfo={
            adminInfo
          }
          onToggleSidebar={() =>
            setSidebarOpen(
              (prev) => !prev
            )
          }
          onNotifications={() =>
            setActivePage(
              "notifications"
            )
          }
          onProfile={() =>
            setActivePage(
              "profile"
            )
          }
        />

        <main className="admin-dashboard-body">
          {renderPageContent()}
        </main>
      </div>

      {/* LOGOUT MODAL */}

      <LogoutModal
        open={
          showLogoutModal
        }
        onClose={() =>
          setShowLogoutModal(false)
        }
        onConfirm={() => {
          setShowLogoutModal(false);
          handleLogout();
        }}
      />
    </div>
  );
}

export default AdminDashboard;


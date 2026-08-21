import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";



import api from "../../api/axiosInstance";

import "./UserDash.css";

// =========================================================
// COMPONENTS
// =========================================================

import CompleteProfileModal from "../../Component/ComProfile";
import AddMedicineModal from "../../Component/UserAddMed";
import AddStockModal from "../../Component/AddStock";

import UserInvent from "./UserInvent";
import UserReport from "./UserReport";
import UserRem from "./UserRem";
import UserAlert from "./UserAlert";
import UserLogout from "./UserLogout";
import UserManage from "./UserManage";
import UserProfiles from "./UserProfiles";
import UserViewRep from "./UserViewRep";
import UserNotifi from "./UserNotifi";

// =========================================================
// ICONS
// =========================================================

import {
  Home,
  User,
  ClipboardPlus,
  Bell,
  TriangleAlert,
  BarChart3,
  LogOut,
  CalendarDays,
  Package,
  ShieldCheck,
  CircleCheck,
  CircleX,
  ArrowDownCircle,
  Plus,
  Menu,
  Clock,
  FileText,
  ChevronDown,
} from "lucide-react";

const UserDash = ({ onLogout }) => {
  // =========================================================
  // RESPONSIVE
  // =========================================================

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.innerWidth < 900;
  });

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return false;

    if (window.innerWidth < 900) return false;

    return localStorage.getItem("sidebarOpen") === "true";
  });

  // =========================================================
  // PROFILE
  // =========================================================

  const [profileCompleted, setProfileCompleted] = useState(
    localStorage.getItem("profileCompleted") === "true"
  );

  const [showProfile, setShowProfile] = useState(false);

  // =========================================================
  // NAVIGATION
  // =========================================================

  const [activeItem, setActiveItem] = useState("Home");

  const [showViewReport, setShowViewReport] = useState(false);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);

  // =========================================================
  // MODALS
  // =========================================================

  const [showAddMedicineModal, setShowAddMedicineModal] =
    useState(false);

  const [showAddStockModal, setShowAddStockModal] =
    useState(false);

  // =========================================================
  // REF
  // =========================================================

  const myMedicineRef = useRef(null);

  // =========================================================
  // DATE
  // =========================================================

  const today = useMemo(() => new Date(), []);

  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  // =========================================================
  // DASHBOARD SUMMARY
  //
  // GET /api/dashboard
  // =========================================================

  const [dashboardSummary, setDashboardSummary] = useState({
    todaysMedicines: 0,
    taken: 0,
    missed: 0,
    lowStockAlerts: 0,
  });

  const [summaryLoading, setSummaryLoading] = useState(true);

  // =========================================================
  // TODAY SCHEDULE
  // =========================================================

  const [todaySchedule, setTodaySchedule] = useState([]);

  const [scheduleLoading, setScheduleLoading] = useState(true);

  const [schedulePage, setSchedulePage] = useState(1);

  const scheduleItemsPerPage = 4;

  // =========================================================
  // INVENTORY
  // =========================================================

  const [inventoryData, setInventoryData] = useState([]);

  const [inventoryLoading, setInventoryLoading] = useState(true);

  // =========================================================
  // CALENDAR
  // =========================================================

  const [calendarMonth, setCalendarMonth] =
    useState(todayMonth);

  const [calendarYear, setCalendarYear] =
    useState(todayYear);

  const [calendarData, setCalendarData] =
    useState([]);

  const [calendarLoading, setCalendarLoading] =
    useState(true);

  const [visibleStatuses, setVisibleStatuses] = useState({
    taken: true,
    missed: true,
  });

  // =========================================================
  // CURRENT USER NAME
  // =========================================================

  const currentUserName = useMemo(() => {
    try {
      const stored = localStorage.getItem("currentUserName");

      if (stored?.trim()) {
        return stored.trim();
      }

      const registeredUser =
        localStorage.getItem("registeredUser");

      if (registeredUser) {
        const parsed = JSON.parse(registeredUser);

        if (parsed?.fullName?.trim()) {
          return parsed.fullName.trim();
        }
      }
    } catch {
      // ignore
    }

    return "User";
  }, []);

  // =========================================================
  // ARRAY RESPONSE HELPER
  // =========================================================

  const extractArray = (payload, keys = []) => {
    if (Array.isArray(payload)) {
      return payload;
    }

    for (const key of keys) {
      if (Array.isArray(payload?.[key])) {
        return payload[key];
      }
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    return [];
  };

  // =========================================================
  // DASHBOARD SUMMARY
  //
  // GET /api/dashboard
  //
  // RESPONSE:
  // {
  //   todaysMedicines: 0,
  //   taken: 0,
  //   missed: 0,
  //   lowStockAlerts: 0
  // }
  // =========================================================

  const fetchDashboardSummary = async () => {
    try {
      const response = await api.get("/api/dashboard");

      const data = response?.data || {};

      setDashboardSummary({
        todaysMedicines:
          Number(data.todaysMedicines) || 0,

        taken:
          Number(data.taken) || 0,

        missed:
          Number(data.missed) || 0,

        lowStockAlerts:
          Number(data.lowStockAlerts) || 0,
      });
    } catch (error) {
      console.error(
        "Dashboard Summary Error:",
        error?.response?.data || error.message
      );

      setDashboardSummary({
        todaysMedicines: 0,
        taken: 0,
        missed: 0,
        lowStockAlerts: 0,
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  // =========================================================
  // TODAY'S DOSES
  //
  // GET /api/doses/today
  // =========================================================

  const fetchTodaySchedule = async () => {
    try {
      const response = await api.get("/api/doses/today");

      const doses = extractArray(
        response.data,
        ["doses", "todayDoses"]
      );

      setTodaySchedule(doses);

      setSchedulePage(1);
    } catch (error) {
      console.error(
        "Today Schedule Error:",
        error?.response?.data || error.message
      );

      setTodaySchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  // =========================================================
  // INVENTORY
  //
  // GET /api/inventory
  // =========================================================

  const fetchInventory = async () => {
    try {
      const response = await api.get("/api/inventory");

      const inventory = extractArray(
        response.data,
        [
          "inventory",
          "stockItems",
          "items",
        ]
      );

      setInventoryData(inventory);
    } catch (error) {
      console.error(
        "Inventory Error:",
        error?.response?.data || error.message
      );

      setInventoryData([]);
    } finally {
      setInventoryLoading(false);
    }
  };

  // =========================================================
  // CALENDAR
  //
  // GET /api/doses/calendar
  // =========================================================

  const fetchCalendarData = async () => {
    try {
      const response = await api.get(
        "/api/doses/calendar"
      );

      const calendar = extractArray(
        response.data,
        [
          "doses",
          "calendar",
        ]
      );

      setCalendarData(calendar);
    } catch (error) {
      console.error(
        "Calendar Error:",
        error?.response?.data || error.message
      );

      setCalendarData([]);
    } finally {
      setCalendarLoading(false);
    }
  };

  // =========================================================
  // INITIAL DASHBOARD LOAD
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const [
          dashboardResponse,
          scheduleResponse,
          inventoryResponse,
          calendarResponse,
        ] = await Promise.all([
          api.get("/api/dashboard"),

          api.get("/api/doses/today"),

          api.get("/api/inventory"),

          api.get("/api/doses/calendar"),
        ]);

        if (cancelled) return;

        // ===============================================
        // DASHBOARD CARDS
        // ===============================================

        const summary =
          dashboardResponse?.data || {};

        setDashboardSummary({
          todaysMedicines:
            Number(summary.todaysMedicines) || 0,

          taken:
            Number(summary.taken) || 0,

          missed:
            Number(summary.missed) || 0,

          lowStockAlerts:
            Number(summary.lowStockAlerts) || 0,
        });

        // ===============================================
        // TODAY SCHEDULE
        // ===============================================

        const schedules =
          Array.isArray(scheduleResponse.data)
            ? scheduleResponse.data
            : Array.isArray(scheduleResponse.data?.doses)
              ? scheduleResponse.data.doses
              : Array.isArray(
                    scheduleResponse.data?.todayDoses
                  )
                ? scheduleResponse.data.todayDoses
                : Array.isArray(
                      scheduleResponse.data?.data
                    )
                  ? scheduleResponse.data.data
                  : [];

        setTodaySchedule(schedules);

        // ===============================================
        // INVENTORY
        // ===============================================

        const inventory =
          Array.isArray(inventoryResponse.data)
            ? inventoryResponse.data
            : Array.isArray(
                  inventoryResponse.data?.inventory
                )
              ? inventoryResponse.data.inventory
              : Array.isArray(
                    inventoryResponse.data?.stockItems
                  )
                ? inventoryResponse.data.stockItems
                : Array.isArray(
                      inventoryResponse.data?.data
                    )
                  ? inventoryResponse.data.data
                  : [];

        setInventoryData(inventory);

        // ===============================================
        // CALENDAR
        // ===============================================

        const calendar =
          Array.isArray(calendarResponse.data)
            ? calendarResponse.data
            : Array.isArray(calendarResponse.data?.doses)
              ? calendarResponse.data.doses
              : Array.isArray(
                    calendarResponse.data?.calendar
                  )
                ? calendarResponse.data.calendar
                : Array.isArray(
                      calendarResponse.data?.data
                    )
                  ? calendarResponse.data.data
                  : [];

        setCalendarData(calendar);
      } catch (error) {
        console.error(
          "Dashboard Initial Load Error:",
          error?.response?.data || error.message
        );
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
          setScheduleLoading(false);
          setInventoryLoading(false);
          setCalendarLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // RESPONSIVE
  // =========================================================

  useEffect(() => {
    const handleResize = () => {
      const mobile =
        window.innerWidth < 900;

      setIsMobile(mobile);

      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(
          localStorage.getItem("sidebarOpen") === "true"
        );
      }
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  // =========================================================
  // PROFILE COMPLETE
  // =========================================================

  const handleProfileComplete = () => {
    localStorage.setItem(
      "profileCompleted",
      "true"
    );

    setProfileCompleted(true);
  };

  // =========================================================
  // SIDEBAR
  // =========================================================

  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;

    setSidebarOpen(newState);

    localStorage.setItem(
      "sidebarOpen",
      String(newState)
    );
  };

  // =========================================================
  // MENU
  // =========================================================

  const handleMenuItemClick = (itemName) => {
    setActiveItem(itemName);

    setShowNotifications(false);

    if (isMobile) {
      setSidebarOpen(false);
    }

    if (itemName === "My Profile") {
      setShowProfile(true);

      setShowLogoutModal(false);
    } else if (itemName === "Logout") {
      setShowLogoutModal(true);

      setShowProfile(false);
    } else {
      setShowProfile(false);

      setShowLogoutModal(false);
    }

    if (
      itemName ===
      "Medicine Management"
    ) {
      setTimeout(() => {
        myMedicineRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  // =========================================================
  // ADD MEDICINE
  // =========================================================

  const handleAddMedicine = () => {
    setShowAddMedicineModal(true);
  };

  // =========================================================
  // AFTER MEDICINE ADDED
  // =========================================================

  const handleCloseMedicineModal = async (
    medicineData
  ) => {
    setShowAddMedicineModal(false);

    if (!medicineData) return;

    try {
      await Promise.all([
        fetchTodaySchedule(),

        fetchDashboardSummary(),

        fetchCalendarData(),
      ]);
    } catch {
      // individual fetch functions handle errors
    }

    // =====================================================
    // LOCAL NOTIFICATION
    // =====================================================

    const notification = {
      id: Date.now(),

      type: "success",

      title: "Medicine Added",

      message: `${
        medicineData.medicineName ||
        "Medicine"
      } ${
        medicineData.dosage || ""
      } has been successfully added to your medicine list.`,

      time: "Just now",

      date:
        new Date().toLocaleDateString(
          "en-GB"
        ),

      category: "system",

      status: "unread",
    };

    try {
      const existing =
        JSON.parse(
          localStorage.getItem(
            "userNotifications"
          ) || "[]"
        );

      existing.unshift(
        notification
      );

      localStorage.setItem(
        "userNotifications",
        JSON.stringify(existing)
      );
    } catch {
      // ignore
    }
  };

  // =========================================================
  // AFTER STOCK ADDED
  // =========================================================

  const handleAddStock = async (
    savedStockItem
  ) => {
    setShowAddStockModal(false);

    if (!savedStockItem) return;

    await Promise.all([
      fetchInventory(),

      fetchDashboardSummary(),
    ]);
  };

  // =========================================================
  // AFTER TAKEN / MISSED STATUS CHANGE
  // =========================================================

  const handleDoseActionComplete = async () => {
    await Promise.all([
      fetchTodaySchedule(),

      fetchDashboardSummary(),

      fetchCalendarData(),
    ]);
  };

  // =========================================================
  // TODAY SCHEDULE PAGINATION
  // =========================================================

  const scheduleTotalPages =
    Math.max(
      1,
      Math.ceil(
        todaySchedule.length /
          scheduleItemsPerPage
      )
    );

  const schedulePageSafe =
    Math.min(
      schedulePage,
      scheduleTotalPages
    );

  const scheduleStartIndex =
    (schedulePageSafe - 1) *
    scheduleItemsPerPage;

  const schedulePageItems =
    todaySchedule.slice(
      scheduleStartIndex,
      scheduleStartIndex +
        scheduleItemsPerPage
    );

  // =========================================================
  // GROUP DOSES BY MEDICINE
  // =========================================================

  const scheduleMedicineRows =
    useMemo(() => {
      const grouped = new Map();

      schedulePageItems.forEach(
        (medicine) => {
          const name =
            medicine.medicineName ||
            "Medicine";

          const key =
            name
              .trim()
              .toLowerCase();

          if (!grouped.has(key)) {
            grouped.set(key, {
              name,

              medicines: [],

              notes: "",
            });
          }

          const row =
            grouped.get(key);

          row.medicines.push(
            medicine
          );

          const notes =
            String(
              medicine.notes ||
                medicine.note ||
                medicine.instructions ||
                ""
            ).trim();

          if (!row.notes && notes) {
            row.notes = notes;
          }
        }
      );

      return Array.from(
        grouped.values()
      );
    }, [schedulePageItems]);

  // =========================================================
  // TODAY LABEL
  // =========================================================

  const todayScheduleDate =
    today.toLocaleDateString(
      "en-US",
      {
        day: "2-digit",

        month: "short",

        year: "numeric",
      }
    );

  // =========================================================
  // DOSE TIME
  //
  // Real API = scheduledTime
  // =========================================================

  const getScheduleTimeLabel = (
    medicine
  ) =>
    medicine.scheduledTime ||
    medicine.timing ||
    medicine.time ||
    "00:00";

  // =========================================================
  // TIMELINE POSITION
  // =========================================================

  const getScheduleTimelinePosition = (
    medicine
  ) => {
    const rawTime = String(
      getScheduleTimeLabel(
        medicine
      )
    ).trim();

    const match =
      rawTime.match(
        /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i
      );

    if (!match) {
      return 50;
    }

    let hours =
      Number(match[1]);

    const minutes =
      Number(
        match[2] || 0
      );

    const period =
      match[3]?.toUpperCase();

    if (
      period === "PM" &&
      hours < 12
    ) {
      hours += 12;
    }

    if (
      period === "AM" &&
      hours === 12
    ) {
      hours = 0;
    }

    const totalMinutes =
      Math.min(
        Math.max(
          hours * 60 +
            minutes,
          0
        ),
        1440
      );

    return Math.min(
      Math.max(
        (totalMinutes /
          1440) *
          100,
        6
      ),
      82
    );
  };

  // =========================================================
  // CALENDAR
  // =========================================================

  const monthLabel =
    new Date(
      calendarYear,
      calendarMonth,
      1
    ).toLocaleString(
      "en-US",
      {
        month: "long",

        year: "numeric",
      }
    );

  const daysInMonth =
    new Date(
      calendarYear,
      calendarMonth + 1,
      0
    ).getDate();

  const firstDayOfMonth =
    new Date(
      calendarYear,
      calendarMonth,
      1
    ).getDay();

  const calendarDays = [
    ...Array(
      firstDayOfMonth
    ).fill(""),

    ...Array.from(
      {
        length:
          daysInMonth,
      },

      (_, index) =>
        String(index + 1)
    ),
  ];

  while (
    calendarDays.length %
      7 !==
    0
  ) {
    calendarDays.push("");
  }

  // =========================================================
  // CALENDAR STATUS MAP
  // =========================================================

  const calendarStatusMap =
    useMemo(() => {
      const map = {};

      calendarData.forEach(
        (item) => {
          const dateStr =
            item.scheduledDate ||
            item.date ||
            item.reminderDate;

          if (!dateStr) return;

          const date =
            new Date(dateStr);

          if (
            Number.isNaN(
              date.getTime()
            )
          ) {
            return;
          }

          const key =
            `${date.getFullYear()}-` +
            `${String(
              date.getMonth() +
                1
            ).padStart(
              2,
              "0"
            )}-` +
            `${String(
              date.getDate()
            ).padStart(
              2,
              "0"
            )}`;

          if (!map[key]) {
            map[key] = [];
          }

          map[key].push(
            String(
              item.status ||
                "PENDING"
            ).toLowerCase()
          );
        }
      );

      return map;
    }, [calendarData]);

  // =========================================================
  // CALENDAR DATE CLASS
  // =========================================================

  const getCalendarDateClass = (
    day
  ) => {
    const dateValue =
      Number(day);

    if (!dateValue) {
      return "";
    }

    const key =
      `${calendarYear}-` +
      `${String(
        calendarMonth + 1
      ).padStart(
        2,
        "0"
      )}-` +
      `${String(
        dateValue
      ).padStart(
        2,
        "0"
      )}`;

    const statuses =
      calendarStatusMap[
        key
      ];

    const currentDate =
      new Date(
        calendarYear,
        calendarMonth,
        dateValue
      );

    const todayOnly =
      new Date(
        todayYear,
        todayMonth,
        todayDate
      );

    const isPastDate =
      currentDate <
      todayOnly;

    const isToday =
      dateValue ===
        todayDate &&
      calendarMonth ===
        todayMonth &&
      calendarYear ===
        todayYear;

    if (isPastDate) {
      return " past-date";
    }

    if (
      statuses &&
      statuses.length > 0
    ) {
      const anyVisible =
        statuses.some(
          (status) =>
            visibleStatuses[
              status
            ]
        );

      if (!anyVisible) {
        return `${
          isToday
            ? " today"
            : ""
        } filtered-out`;
      }
    }

    let statusClass =
      "";

    if (
      statuses &&
      statuses.length > 0
    ) {
      if (
        statuses.includes(
          "missed"
        ) &&
        visibleStatuses.missed
      ) {
        statusClass =
          " missed";
      } else if (
        statuses.includes(
          "taken"
        ) &&
        visibleStatuses.taken
      ) {
        statusClass =
          " taken";
      }
    }

    return `${
      isToday
        ? " today"
        : ""
    }${statusClass}`;
  };

  // =========================================================
  // CALENDAR NAVIGATION
  // =========================================================

  const handlePrevMonth = () => {
    if (
      calendarMonth === 0
    ) {
      setCalendarMonth(11);

      setCalendarYear(
        (year) =>
          year - 1
      );
    } else {
      setCalendarMonth(
        (month) =>
          month - 1
      );
    }
  };

  const handleNextMonth = () => {
    if (
      calendarMonth === 11
    ) {
      setCalendarMonth(0);

      setCalendarYear(
        (year) =>
          year + 1
      );
    } else {
      setCalendarMonth(
        (month) =>
          month + 1
      );
    }
  };

  const handleGoToToday = () => {
    setCalendarMonth(
      todayMonth
    );

    setCalendarYear(
      todayYear
    );
  };

  const toggleStatusFilter = (
    status
  ) => {
    setVisibleStatuses(
      (prev) => ({
        ...prev,

        [status]:
          !prev[status],
      })
    );
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      {/* PROFILE */}

      {!profileCompleted && (
        <CompleteProfileModal
          onComplete={
            handleProfileComplete
          }
        />
      )}

      {/* ADD MEDICINE */}

      {showAddMedicineModal && (
        <AddMedicineModal
          onClose={
            handleCloseMedicineModal
          }
        />
      )}

      {/* ADD STOCK */}

      {showAddStockModal && (
        <AddStockModal
          onClose={
            handleAddStock
          }
        />
      )}

      <div
        className={`dashboard ${
          !profileCompleted
            ? "dashboard-blur"
            : ""
        }`}
      >
        {/* HEADER */}

        <header className="topbar">
          <button
            type="button"
            className="header-menu-btn"
            aria-label="Toggle menu"
            onClick={
              handleSidebarToggle
            }
          >
            <Menu size={24} />
          </button>

          <div className="logo-section">
            <img
              src="ChatGPT Image Jun 22, 2026, 07_52_50 PM.png"
              alt="logo"
              className="logo"
            />

            <div className="logo-text">
              <h2>
                Healthcare Monitoring{" "}
                <span>
                  System
                </span>
              </h2>

              <p>
                Secure • Reliable • Care Focused
              </p>
            </div>
          </div>

          <div className="top-right">
            <button
              type="button"
              className="notification-btn"
              aria-label="Notifications"
              onClick={() => {
                setShowNotifications(
                  true
                );

                setShowProfile(
                  false
                );

                setShowLogoutModal(
                  false
                );

                if (isMobile) {
                  setSidebarOpen(
                    false
                  );
                }
              }}
            >
              <Bell className="top-icon" />

              <span className="notification-badge" />
            </button>

            <div className="profile-box">
              <div className="avatar">
                <User size={24} />
              </div>

              <span>
                {currentUserName}
              </span>

              <ChevronDown
                className="profile-chevron"
                size={16}
              />
            </div>
          </div>
        </header>

        {/* BODY */}

        <div
          className={`dashboard-body ${
            sidebarOpen
              ? "sidebar-open"
              : "sidebar-closed"
          } ${
            isMobile
              ? "mobile-view"
              : ""
          }`}
        >
          {isMobile &&
            sidebarOpen && (
              <div
                className="sidebar-backdrop"
                onClick={() =>
                  setSidebarOpen(
                    false
                  )
                }
              />
            )}

          {/* SIDEBAR */}

          <aside className="sidebar">
            <div className="sidebar-header">
              {sidebarOpen && (
                <h3 className="sidebar-title">
                  Menu
                </h3>
              )}
            </div>

            <ul className="sidebar-menu">
              <li
                className={`sidebar-item ${
                  activeItem ===
                  "Home"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuItemClick(
                    "Home"
                  )
                }
              >
                <Home size={22} />

                {sidebarOpen && (
                  <span>Home</span>
                )}
              </li>

              <li
                className={`sidebar-item ${
                  activeItem ===
                  "My Profile"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuItemClick(
                    "My Profile"
                  )
                }
              >
                <User size={22} />

                {sidebarOpen && (
                  <span>
                    My Profile
                  </span>
                )}
              </li>

              <li
                className={`sidebar-item ${
                  activeItem ===
                  "Medicine Management"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuItemClick(
                    "Medicine Management"
                  )
                }
              >
                <ClipboardPlus
                  size={22}
                />

                {sidebarOpen && (
                  <span>
                    Medicine Management
                  </span>
                )}
              </li>

              <li
                className={`sidebar-item ${
                  activeItem ===
                  "Medicine Inventory"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuItemClick(
                    "Medicine Inventory"
                  )
                }
              >
                <Package size={22} />

                {sidebarOpen && (
                  <span>
                    Medicine Inventory
                  </span>
                )}
              </li>

              <li
                className={`sidebar-item ${
                  activeItem ===
                  "Reminders"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuItemClick(
                    "Reminders"
                  )
                }
              >
                <Bell size={22} />

                {sidebarOpen && (
                  <span>
                    Reminders
                  </span>
                )}
              </li>

              <li
                className={`sidebar-item ${
                  activeItem ===
                  "Alerts"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuItemClick(
                    "Alerts"
                  )
                }
              >
                <TriangleAlert
                  size={22}
                />

                {sidebarOpen && (
                  <span>
                    Alerts
                  </span>
                )}
              </li>

              <li
                className={`sidebar-item ${
                  activeItem ===
                  "Reports"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuItemClick(
                    "Reports"
                  )
                }
              >
                <BarChart3
                  size={22}
                />

                {sidebarOpen && (
                  <span>
                    Reports
                  </span>
                )}
              </li>

              <li className="sidebar-divider" />

              <li
                className={`sidebar-item sidebar-logout ${
                  activeItem ===
                  "Logout"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuItemClick(
                    "Logout"
                  )
                }
              >
                <LogOut size={22} />

                {sidebarOpen && (
                  <span>
                    Logout
                  </span>
                )}
              </li>
            </ul>
          </aside>

          {/* MAIN */}

          <main className="main-content">
            {showNotifications ? (
              <UserNotifi />
            ) : showViewReport ? (
              <UserViewRep
                onBack={() =>
                  setShowViewReport(
                    false
                  )
                }
              />
            ) : activeItem ===
              "Medicine Inventory" ? (
              <UserInvent
                onAddStock={() =>
                  setShowAddStockModal(
                    true
                  )
                }
              />
            ) : activeItem ===
              "Reports" ? (
              <UserReport
                onViewReport={() =>
                  setShowViewReport(
                    true
                  )
                }
              />
            ) : activeItem ===
              "Alerts" ? (
              <UserAlert
                onAddMedicine={
                  handleAddMedicine
                }
              />
            ) : activeItem ===
              "Reminders" ? (
              <UserRem
                onAddMedicine={
                  handleAddMedicine
                }
                onReminderActionComplete={
                  handleDoseActionComplete
                }
              />
            ) : showLogoutModal ? (
              <UserLogout
                onCancel={() =>
                  setShowLogoutModal(
                    false
                  )
                }
                onLogout={() => {
                  setShowLogoutModal(
                    false
                  );

                  onLogout?.();
                }}
              />
            ) : showProfile ? (
              <UserProfiles />
            ) : (
              <>
                <h2 className="page-title">
                  Dashboard
                </h2>

                {/* =====================================
                    TOP 4 CARDS
                ===================================== */}

                <div className="stats-grid">
                  <div className="stat-card">
                    <CalendarDays />

                    <div>
                      <h1>
                        {summaryLoading
                          ? "..."
                          : dashboardSummary.todaysMedicines}
                      </h1>

                      <p>
                        Today's Medicines
                      </p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <CircleCheck />

                    <div>
                      <h1>
                        {summaryLoading
                          ? "..."
                          : dashboardSummary.taken}
                      </h1>

                      <p>
                        Taken
                      </p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <CircleX />

                    <div>
                      <h1>
                        {summaryLoading
                          ? "..."
                          : dashboardSummary.missed}
                      </h1>

                      <p>
                        Missed
                      </p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <ArrowDownCircle />

                    <div>
                      <h1>
                        {summaryLoading
                          ? "..."
                          : dashboardSummary.lowStockAlerts}
                      </h1>

                      <p>
                        Low Stock Alerts
                      </p>
                    </div>
                  </div>
                </div>

                {/* =====================================
                    ROW 1
                ===================================== */}

                <div className="card-row">
                  {/* TODAY'S SCHEDULE */}

                  <div className="dashboard-card today-schedule-card">
                    <div className="card-header">
                      <CalendarDays />

                      Today's Schedules
                    </div>

                    <div className="schedule-content">
                      {scheduleLoading ? (
                        <div className="empty-card">
                          <CalendarDays
                            size={60}
                          />

                          <h4>
                            Loading today's schedule...
                          </h4>
                        </div>
                      ) : todaySchedule.length ===
                        0 ? (
                        <div className="empty-card">
                          <CalendarDays
                            size={60}
                          />

                          <h4>
                            No medicine scheduled for today
                          </h4>

                          <p>
                            Add medicine and set reminder to see your schedule
                          </p>

                          <button
                            className="add-first-medicine-btn"
                            onClick={
                              handleAddMedicine
                            }
                          >
                            <Plus
                              size={24}
                            />

                            <span>
                              Add Your First Medicine
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div className="today-timeline medicine-list--today">
                          <div className="today-timeline-scroll-area">
                            <div className="today-timeline-date-card">
                              <CalendarDays
                                size={
                                  24
                                }
                              />

                              <span>
                                Today
                              </span>

                              <strong>
                                {
                                  todayScheduleDate
                                }
                              </strong>
                            </div>

                            <div className="today-timeline-track-wrap">
                              <div className="today-timeline-scale">
                                <span>
                                  00:00
                                </span>

                                <span>
                                  12:00
                                </span>

                                <span>
                                  24:00
                                </span>
                              </div>

                              <div className="today-timeline-rows">
                                {scheduleMedicineRows.map(
                                  (row) => (
                                    <div
                                      key={
                                        row.name
                                      }
                                      className="today-timeline-row"
                                    >
                                      <div className="today-timeline-row-name">
                                        {
                                          row.name
                                        }
                                      </div>

                                      <div
                                        className="today-timeline-track"
                                        style={{
                                          minHeight: `${
                                            96 +
                                            Math.max(
                                              0,
                                              row
                                                .medicines
                                                .length -
                                                1
                                            ) *
                                              8
                                          }px`,
                                        }}
                                      >
                                        <span className="today-timeline-node start" />
                                        <span className="today-timeline-node mid" />
                                        <span className="today-timeline-node end" />

                                        {row.medicines.map(
                                          (
                                            medicine,
                                            index
                                          ) => {
                                            const status =
                                              String(
                                                medicine.status ||
                                                  "PENDING"
                                              ).toLowerCase();

                                            return (
                                              <div
                                                key={
                                                  medicine.doseId ||
                                                  medicine.id ||
                                                  `${row.name}-${index}`
                                                }
                                                className={`today-timeline-medicine ${status}`}
                                                style={{
                                                  left: `${getScheduleTimelinePosition(
                                                    medicine
                                                  )}%`,

                                                  "--card-offset": `${
                                                    (index -
                                                      (row
                                                        .medicines
                                                        .length -
                                                        1) /
                                                        2) *
                                                    44
                                                  }px`,
                                                }}
                                              >
                                                <span className="today-timeline-pin" />

                                                <div className="today-timeline-card">
                                                  <strong>
                                                    {getScheduleTimeLabel(
                                                      medicine
                                                    )}
                                                  </strong>

                                                  <small>
                                                    <Clock
                                                      size={
                                                        12
                                                      }
                                                    />

                                                    {status
                                                      .charAt(
                                                        0
                                                      )
                                                      .toUpperCase() +
                                                      status.slice(
                                                        1
                                                      )}
                                                  </small>
                                                </div>
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>

                                      {row.notes && (
                                        <div className="today-schedule-notes">
                                          <div className="today-schedule-notes-label">
                                            <FileText
                                              size={
                                                14
                                              }
                                            />

                                            <span>
                                              Notes
                                            </span>
                                          </div>

                                          <p>
                                            {
                                              row.notes
                                            }
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="dashboard-schedule-pagination">
                            <div className="schedule-page-info">
                              Showing{" "}
                              {scheduleStartIndex +
                                1}{" "}
                              to{" "}
                              {Math.min(
                                scheduleStartIndex +
                                  scheduleItemsPerPage,
                                todaySchedule.length
                              )}{" "}
                              of{" "}
                              {
                                todaySchedule.length
                              }
                            </div>

                            <div className="schedule-pagination-controls">
                              <button
                                className="schedule-page-btn"
                                disabled={
                                  schedulePage ===
                                  1
                                }
                                onClick={() =>
                                  setSchedulePage(
                                    (
                                      page
                                    ) =>
                                      Math.max(
                                        1,
                                        page -
                                          1
                                      )
                                  )
                                }
                              >
                                Prev
                              </button>

                              {Array.from(
                                {
                                  length:
                                    scheduleTotalPages,
                                },
                                (
                                  _,
                                  index
                                ) =>
                                  index +
                                  1
                              ).map(
                                (
                                  page
                                ) => (
                                  <button
                                    key={
                                      page
                                    }
                                    className={`schedule-page-btn schedule-page-num ${
                                      schedulePage ===
                                      page
                                        ? "active"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      setSchedulePage(
                                        page
                                      )
                                    }
                                  >
                                    {
                                      page
                                    }
                                  </button>
                                )
                              )}

                              <button
                                className="schedule-page-btn"
                                disabled={
                                  schedulePage ===
                                  scheduleTotalPages
                                }
                                onClick={() =>
                                  setSchedulePage(
                                    (
                                      page
                                    ) =>
                                      Math.min(
                                        scheduleTotalPages,
                                        page +
                                          1
                                      )
                                  )
                                }
                              >
                                Next
                              </button>
                            </div>
                          </div>

                          <button
                            className="add-more-btn"
                            onClick={
                              handleAddMedicine
                            }
                          >
                            <Plus
                              size={24}
                            />

                            Add More Medicine
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* INVENTORY OVERVIEW */}

                  <div className="dashboard-card inventory-overview-card">
                    <div className="card-header">
                      <Package />

                      Inventory Overview
                    </div>

                    {inventoryLoading ? (
                      <div className="empty-card">
                        <Package
                          size={60}
                        />

                        <h4>
                          Loading inventory...
                        </h4>
                      </div>
                    ) : inventoryData.length ===
                      0 ? (
                      <div className="empty-card">
                        <Package
                          size={60}
                        />

                        <h4>
                          No inventory data available
                        </h4>

                        <p>
                          Add medicine stock to track stock and get alerts
                        </p>

                        <button
                          className="add-first-medicine-btn"
                          onClick={() =>
                            setShowAddStockModal(
                              true
                            )
                          }
                        >
                          <Plus
                            size={24}
                          />

                          <span>
                            Add Medicine Stock
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="stock-table">
                        <div className="stock-table-header">
                          <span>
                            Medicine
                          </span>

                          <span>
                            Current Stock
                          </span>

                          <span>
                            Min Stock
                          </span>

                          <span>
                            Expiry Date
                          </span>
                        </div>

                        {inventoryData.map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              key={
                                item.id ||
                                item.inventoryId ||
                                index
                              }
                              className="stock-table-row"
                            >
                              <span className="stock-medicine-name">
                                {
                                  item.medicineName
                                }
                              </span>

                              <span>
                                {
                                  item.currentStock
                                }
                              </span>

                              <span>
                                {
                                  item.minimumStock
                                }
                              </span>

                              <span>
                                {
                                  item.expiryDate
                                }
                              </span>

                              <div
                                className="stock-mobile-top"
                                aria-hidden="true"
                              >
                                <span className="stock-mobile-name">
                                  {
                                    item.medicineName
                                  }
                                </span>
                              </div>

                              <div
                                className="stock-mobile-metrics"
                                aria-hidden="true"
                              >
                                <div className="stock-mobile-metric">
                                  <span className="stock-mobile-icon">
                                    <Package
                                      size={
                                        18
                                      }
                                    />
                                  </span>

                                  <strong>
                                    {
                                      item.currentStock
                                    }
                                  </strong>

                                  <small>
                                    Current
                                  </small>
                                </div>

                                <div className="stock-mobile-metric">
                                  <span className="stock-mobile-icon">
                                    <ShieldCheck
                                      size={
                                        18
                                      }
                                    />
                                  </span>

                                  <strong>
                                    {
                                      item.minimumStock
                                    }
                                  </strong>

                                  <small>
                                    Min
                                  </small>
                                </div>

                                <div className="stock-mobile-metric">
                                  <span className="stock-mobile-icon">
                                    <CalendarDays
                                      size={
                                        18
                                      }
                                    />
                                  </span>

                                  <strong>
                                    {item.expiryDate ||
                                      "--"}
                                  </strong>

                                  <small>
                                    Expiry
                                  </small>
                                </div>
                              </div>
                            </div>
                          )
                        )}

                        <button
                          className="add-stock-inline-btn"
                          onClick={() =>
                            setShowAddStockModal(
                              true
                            )
                          }
                        >
                          <Plus
                            size={20}
                          />

                          Add More Stock
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* =====================================
                    ROW 2
                ===================================== */}

                <div
                  className="card-row"
                  ref={myMedicineRef}
                >
                  {/* UserManage now handles its own
                      GET/PUT/DELETE APIs */}

                  <UserManage />

                  {/* CALENDAR */}

                  <div className="dashboard-card calendar-card">
                    <div className="card-header">
                      <span className="calendar-title">
                        <CalendarDays />

                        Calendar
                      </span>

                      <button
                        type="button"
                        className="calendar-today-btn"
                        onClick={
                          handleGoToToday
                        }
                      >
                        Today

                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 12a9 9 0 1 1-2.64-6.36" />

                          <polyline points="21 3 21 9 15 9" />
                        </svg>
                      </button>
                    </div>

                    <div className="calendar-container">
                      <div className="calendar-header">
                        <button
                          type="button"
                          className="calendar-nav-btn"
                          onClick={
                            handlePrevMonth
                          }
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="15 18 9 12 15 6" />
                          </svg>
                        </button>

                        <h3>
                          {monthLabel}
                        </h3>

                        <button
                          type="button"
                          className="calendar-nav-btn"
                          onClick={
                            handleNextMonth
                          }
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </div>

                      {calendarLoading && (
                        <div className="calendar-loading">
                          Loading...
                        </div>
                      )}

                      <div className="calendar-grid">
                        {[
                          "Sun",
                          "Mon",
                          "Tue",
                          "Wed",
                          "Thu",
                          "Fri",
                          "Sat",
                        ].map(
                          (day) => (
                            <div
                              key={
                                day
                              }
                              className="calendar-day-header"
                            >
                              {
                                day
                              }
                            </div>
                          )
                        )}

                        {calendarDays.map(
                          (
                            day,
                            index
                          ) => (
                            <div
                              key={
                                index
                              }
                              className={`calendar-date${getCalendarDateClass(
                                day
                              )}`}
                            >
                              {day}
                            </div>
                          )
                        )}
                      </div>

                      <div className="calendar-footer">
                        <div className="calendar-legend">
                          <div className="legend-item">
                            <button
                              type="button"
                              className={`legend-toggle ${
                                visibleStatuses.taken
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() =>
                                toggleStatusFilter(
                                  "taken"
                                )
                              }
                            >
                              <span className="legend-dot taken" />

                              <span>
                                Taken
                              </span>
                            </button>
                          </div>

                          <div className="legend-item">
                            <button
                              type="button"
                              className={`legend-toggle ${
                                visibleStatuses.missed
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() =>
                                toggleStatusFilter(
                                  "missed"
                                )
                              }
                            >
                              <span className="legend-dot missed" />

                              <span>
                                Missed
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="calendar-actions">
                          <button
                            type="button"
                            className="calendar-action-btn alert-btn"
                            onClick={() =>
                              handleMenuItemClick(
                                "Alerts"
                              )
                            }
                          >
                            Alert
                          </button>

                          <button
                            type="button"
                            className="calendar-action-btn reminder-btn"
                            onClick={() =>
                              handleMenuItemClick(
                                "Reminders"
                              )
                            }
                          >
                            Reminder
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default UserDash;
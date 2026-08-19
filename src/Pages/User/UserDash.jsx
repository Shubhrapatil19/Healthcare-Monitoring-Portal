import { useEffect, useState, useMemo, useRef } from "react";
import {
  getMedicines,
  getInventory,
  getTodaySchedule,
  getDashboardSummary,
  getCalendar,
  updateMedicine,
  deleteMedicine,
} from "../../api/MockApi";
import toast from "react-hot-toast";
import "./UserDash.css";

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
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 900;
  });
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("sidebarOpen");
    if (window.innerWidth < 900) return false;
    return stored === "true";
  });
  const [profileCompleted, setProfileCompleted] = useState(
    localStorage.getItem("profileCompleted") === "true"
  );
  const [activeItem, setActiveItem] = useState("Home");
  const [showViewReport, setShowViewReport] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const myMedicineRef = useRef(null);

  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  // ===== CALENDAR STATE =====
  // Displayed month/year (defaults to current month, navigable via arrows)
  const [calendarMonth, setCalendarMonth] = useState(todayMonth);
  const [calendarYear, setCalendarYear] = useState(todayYear);
  // Reminder data (mocked — no real reminder engine without a backend)
  const [calendarData, setCalendarData] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const monthLabel = new Date(calendarYear, calendarMonth, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();

  const calendarDays = [
    ...Array(firstDayOfMonth).fill(""),
    ...Array.from({ length: daysInMonth }, (_, index) => String(index + 1)),
  ];

  while (calendarDays.length % 7 !== 0) {
    calendarDays.push("");
  }

  // ================= MOCK: GET REMINDER CALENDAR =================
  const fetchCalendarData = async () => {
    try {
      setCalendarLoading(true);
      const response = await getCalendar();
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.reminders || response.data?.data || [];
      setCalendarData(data);
    } catch (err) {
      console.log("fetchCalendarData error:", err.response?.data || err.message);
      setCalendarData([]);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Fetch calendar data on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCalendarData();
  }, []);

  // Refetch when the displayed month/year changes
  useEffect(() => {
    queueMicrotask(() => {
      fetchCalendarData();
    });
  }, [calendarMonth, calendarYear]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 0) {
        setCalendarYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 11) {
        setCalendarYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleGoToToday = () => {
    setCalendarMonth(todayMonth);
    setCalendarYear(todayYear);
  };

  // Build a lookup map: "YYYY-MM-DD" -> reminder status(es) for that date
  const calendarStatusMap = useMemo(() => {
    const map = {};
    calendarData.forEach((item) => {
      const dateStr = item.date || item.reminderDate || item.scheduledDate;
      if (!dateStr) return;
      // Normalize to YYYY-MM-DD
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(item.status || "upcoming");
    });
    return map;
  }, [calendarData]);

  // Determine the status class for a given calendar date
  const getCalendarDateClass = (day) => {
    const dateValue = Number(day);
    if (!dateValue) return "";

    const key = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(
      dateValue
    ).padStart(2, "0")}`;

    const statuses = calendarStatusMap[key];

    // Create date objects without time so comparison is date-only.
    const currentDate = new Date(calendarYear, calendarMonth, dateValue);
    const todayOnly = new Date(todayYear, todayMonth, todayDate);

    const isPastDate = currentDate < todayOnly;
    const isToday =
      dateValue === todayDate &&
      calendarMonth === todayMonth &&
      calendarYear === todayYear;

    // Past dates remain visible, but use a faded/blurred disabled style.
    if (isPastDate) {
      return " past-date";
    }

    let statusClass = "";
    if (statuses && statuses.length > 0) {
      if (statuses.includes("missed")) statusClass = " missed";
      else if (statuses.includes("taken")) statusClass = " taken";
      else if (statuses.includes("snoozed")) statusClass = " snoozed";
      else statusClass = " upcoming";
    }

    return `${isToday ? " today" : ""}${statusClass}`;
  };

  const [stockItems, setStockItems] = useState([]);

  const [showProfile, setShowProfile] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [schedulePage, setSchedulePage] = useState(1);
  const scheduleItemsPerPage = 4;
  const scheduleTotalPages = Math.max(1, Math.ceil(todaySchedule.length / scheduleItemsPerPage));
  const schedulePageSafe = Math.min(schedulePage, scheduleTotalPages);
  const scheduleStartIndex = (schedulePageSafe - 1) * scheduleItemsPerPage;
  const schedulePageItems = todaySchedule.slice(scheduleStartIndex, scheduleStartIndex + scheduleItemsPerPage);
  const scheduleMedicineRows = useMemo(() => {
    const grouped = new Map();

    schedulePageItems.forEach((medicine) => {
      const name = medicine.medicineName || "Medicine";
      const key = name.trim().toLowerCase();
      if (!grouped.has(key)) {
        grouped.set(key, { name, medicines: [], notes: "" });
      }
      const row = grouped.get(key);
      const notes = String(
        medicine.notes || medicine.note || medicine.instructions || ""
      ).trim();

      row.medicines.push(medicine);
      if (!row.notes && notes) row.notes = notes;
    });

    return Array.from(grouped.values());
  }, [schedulePageItems]);
  const todayScheduleDate = today.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const getScheduleTimeLabel = (medicine) => medicine.timing || medicine.time || "00:00";

  const getScheduleTimelinePosition = (medicine) => {
    const rawTime = String(getScheduleTimeLabel(medicine)).trim();
    const match = rawTime.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (!match) return 50;

    let hours = Number(match[1]);
    const minutes = Number(match[2] || 0);
    const period = match[3]?.toUpperCase();

    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const totalMinutes = Math.min(Math.max(hours * 60 + minutes, 0), 24 * 60);
    return Math.min(Math.max((totalMinutes / (24 * 60)) * 100, 6), 82);
  };

  const [myMedicines, setMyMedicines] = useState([]);
  const [myMedicinesLoading, setMyMedicinesLoading] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [dashboardSummary, setDashboardSummary] = useState({
    todayMedicines: 0,
    taken: 0,
    missed: 0,
    lowStock: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const currentUserName = useMemo(() => {
    try {
      const stored = localStorage.getItem("currentUserName");
      if (stored && stored.trim()) return stored.trim();
      const registeredUser = localStorage.getItem("registeredUser");
      if (registeredUser) {
        const parsed = JSON.parse(registeredUser);
        if (parsed.fullName && parsed.fullName.trim()) return parsed.fullName.trim();
      }
    } catch {
      // ignore parse errors
    }
    return "User";
  }, []);

  const handleProfileComplete = () => {
    localStorage.setItem("profileCompleted", "true");
    setProfileCompleted(true);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);

      if (mobile) {
        setSidebarOpen(false);
      } else {
        const stored = localStorage.getItem("sidebarOpen");
        setSidebarOpen(stored === "true");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem("sidebarOpen", newState);
  };

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

    // Scroll to My Medicine card when Medicine Management is clicked
    if (itemName === "Medicine Management") {
      setTimeout(() => {
        if (myMedicineRef.current) {
          myMedicineRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  const handleAddMedicine = () => {
    setShowAddMedicineModal(true);
  };

  // ================= REUSABLE FETCH FUNCTIONS (mocked) =================
  const fetchStockItemsFromServer = async () => {
    try {
      const response = await getInventory();
      if (response.data?.stockItems && Array.isArray(response.data.stockItems)) {
        setStockItems(response.data.stockItems);
      }
    } catch (err) {
      console.log("fetchStockItemsFromServer error:", err.response?.data || err.message);
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      setScheduleLoading(true);
      const response = await getTodaySchedule();
      if (Array.isArray(response.data)) {
        setTodaySchedule(response.data);
      }
    } catch (err) {
      console.log("fetchTodaySchedule error:", err.response?.data || err.message);
    } finally {
      setScheduleLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      setInventoryLoading(true);
      const response = await getInventory();
      if (Array.isArray(response.data?.stockItems)) {
        setInventoryData(response.data.stockItems);
      }
    } catch (err) {
      console.log("fetchInventory error:", err.response?.data || err.message);
    } finally {
      setInventoryLoading(false);
    }
  };

  const fetchDashboardSummary = async () => {
    try {
      setSummaryLoading(true);
      const response = await getDashboardSummary();
      if (response.data && typeof response.data === "object") {
        setDashboardSummary((prev) => ({
          ...prev,
          ...response.data,
        }));
      }
    } catch (err) {
      console.log("fetchDashboardSummary error:", err.response?.data || err.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchMyMedicines = async () => {
    try {
      setMyMedicinesLoading(true);
      const response = await getMedicines();
      if (response.data?.medicines && Array.isArray(response.data.medicines)) {
        setMyMedicines(response.data.medicines);
      }
    } catch (err) {
      console.log("fetchMyMedicines error:", err.response?.data || err.message);
    } finally {
      setMyMedicinesLoading(false);
    }
  };

  // Called after a medicine is successfully added, to refresh every card
  // on the Home dashboard that depends on medicine data.
  const refreshAfterMedicineAdded = () => {
    fetchTodaySchedule();
    fetchMyMedicines();
    fetchDashboardSummary();
  };

  // Called after stock is successfully added, to refresh the Inventory
  // card and the low-stock count on the summary cards.
  const refreshAfterStockAdded = () => {
    fetchInventory();
    fetchDashboardSummary();
  };
  // ================================================================

  // ================= MEDICINE EDIT (My Medicine card) =================
  const handleEditMedicine = async (updatedMedicine) => {
    if (!updatedMedicine?.id) return;

    // Backend expects frequency in backend format (e.g. "ONCE_DAILY").
    const backendFrequency = (freq) => {
      const map = {
        "Once a day": "ONCE_DAILY",
        "Twice a day": "TWICE_DAILY",
        "Three times a day": "THRICE_DAILY",
      };
      if (freq && /^[A-Z_]+$/.test(freq)) return freq;
      return map[freq] || freq;
    };

    const timing = updatedMedicine.timing || updatedMedicine.time || "";
    const payload = {
      medicineName: updatedMedicine.medicineName,
      dosage: updatedMedicine.dosage,
      startTiming: timing ? `${timing}:00` : "",
      timing,
      frequency: backendFrequency(updatedMedicine.frequency),
    };

    try {
      const response = await updateMedicine(updatedMedicine.id, payload);
      const saved = response.data || updatedMedicine;

      // Update the My Medicine list with the saved/updated item
      setMyMedicines((prev) =>
        prev.map((med) => (med.id === updatedMedicine.id ? { ...med, ...saved } : med))
      );

      toast.success("Medicine updated successfully!", { duration: 3000 });

      // Refresh server-driven cards (schedule, my-medicines, summary)
      refreshAfterMedicineAdded();
      refreshAfterStockAdded();
    } catch (err) {
      console.log("Edit Medicine error:", err.response?.data || err.message);
      toast.error(
        err.response?.data?.message || "Failed to update medicine. Please try again.",
        { duration: 4000 }
      );
    }
  };

  // ================= MEDICINE DELETE (My Medicine card) =================
  const handleDeleteMedicine = async (id) => {
    if (!id) return;

    try {
      await deleteMedicine(id);

      // Remove from the medicine + stock lists
      setMyMedicines((prev) => prev.filter((med) => med.id !== id));
      setStockItems((prev) => prev.filter((item) => item.id !== id));

      toast.success("Medicine deleted successfully!", { duration: 3000 });

      // Refresh server-driven cards (schedule, my-medicines, inventory, summary)
      refreshAfterMedicineAdded();
      refreshAfterStockAdded();
    } catch (err) {
      console.log("Delete Medicine error:", err.response?.data || err.message);
      toast.error(
        err.response?.data?.message || "Failed to delete medicine. Please try again.",
        { duration: 4000 }
      );
    }
  };
  // ================================================================

  // Fetch all dashboard data on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStockItemsFromServer();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTodaySchedule();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInventory();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardSummary();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMyMedicines();
  }, []);

  const handleCloseMedicineModal = (medicineData) => {
    setShowAddMedicineModal(false);

    if (medicineData) {
      // Also add a notification for the new medicine
      const notification = {
        id: Date.now() + 1,
        type: "success",
        title: "Medicine Added",
        message: `${medicineData.medicineName} ${medicineData.dosage} has been successfully added to your medicine list.`,
        time: "Just now",
        date: new Date().toLocaleDateString("en-GB"),
        category: "system",
        status: "unread",
      };
      try {
        const existingNotifs = JSON.parse(localStorage.getItem("userNotifications") || "[]");
        existingNotifs.unshift(notification);
        localStorage.setItem("userNotifications", JSON.stringify(existingNotifs));
      } catch {
        // ignore
      }

      // The medicine was already saved (mocked) by AddMedicineModal.
      // Refresh the server-driven cards so the new medicine shows up in
      // "Today's Schedule", "My Medicine", and the summary counters right away.
      refreshAfterMedicineAdded();
    }
  };

  // Add stock — expects the mock-saved item (with generated id) from AddStockModal
  const handleAddStock = (savedStockItem) => {
    if (savedStockItem) {
      setStockItems((prev) => [...prev, savedStockItem]);
      // Refresh the Inventory Overview card + summary counters.
      refreshAfterStockAdded();
    }
    setShowAddStockModal(false);
  };

  // Update stock — called by UserInvent after a successful mock update
  const handleUpdateStock = (id, updatedData) => {
    setStockItems((prev) =>
      prev.map((item) =>
        String(item.id) === String(id) ? { ...item, ...updatedData } : item
      )
    );
    refreshAfterStockAdded();
  };

  // Delete stock — called by UserInvent after a successful mock delete
  const handleDeleteStock = (id) => {
    setStockItems((prev) => prev.filter((item) => String(item.id) !== String(id)));
    refreshAfterStockAdded();
  };

  return (
    <>
      {/* Profile Modal */}
      {!profileCompleted && (
        <CompleteProfileModal onComplete={handleProfileComplete} />
      )}

      {/* Add Medicine Modal */}
      {showAddMedicineModal && (
        <div>
          <AddMedicineModal onClose={handleCloseMedicineModal} />
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div>
          <AddStockModal onClose={handleAddStock} />
        </div>
      )}

      {/* Dashboard */}
      <div
        className={`dashboard ${
          !profileCompleted ? "dashboard-blur" : ""
        }`}
      >
        {/* ================= HEADER ================= */}
        <header className="topbar">
          <button
            type="button"
            className="header-menu-btn"
            aria-label="Toggle menu"
            onClick={handleSidebarToggle}
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
                Healthcare Monitoring <span>System</span>
              </h2>
              <p>Secure • Reliable • Care Focused</p>
            </div>
          </div>

          <div className="top-right">
            <button
              type="button"
              className="notification-btn"
              aria-label="Notifications"
              onClick={() => {
                setShowNotifications(true);
                setShowProfile(false);
                setShowLogoutModal(false);
                if (isMobile) setSidebarOpen(false);
              }}
            >
              <Bell className="top-icon" />
              <span className="notification-badge" />
            </button>
            <div className="profile-box">
              <div className="avatar">
                <User size={24} />
              </div>
              <span>{currentUserName}</span>
              <ChevronDown className="profile-chevron" size={16} />
            </div>
          </div>
        </header>

        {/* ================= BODY ================= */}
        <div className={`dashboard-body ${sidebarOpen ? "sidebar-open" : "sidebar-closed"} ${isMobile ? "mobile-view" : ""}`}>
          {isMobile && sidebarOpen && (
            <div
              className="sidebar-backdrop"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* ================= SIDEBAR ================= */}
          <aside className="sidebar">
            <div className="sidebar-header">
              {sidebarOpen && <h3 className="sidebar-title">Menu</h3>}
            </div>

            <ul className="sidebar-menu">
              <li
                className={`sidebar-item ${activeItem === "Home" ? "active" : ""}`}
                onClick={() => handleMenuItemClick("Home")}
              >
                <Home size={22} />
                {sidebarOpen && <span>Home</span>}
              </li>

              <li
                className={`sidebar-item ${
                  activeItem === "My Profile" ? "active" : ""
                }`}
                onClick={() => handleMenuItemClick("My Profile")}
              >
                <User size={22} />
                {sidebarOpen && <span>My Profile</span>}
              </li>

              <li
                className={`sidebar-item ${
                  activeItem === "Medicine Management" ? "active" : ""
                }`}
                onClick={() => handleMenuItemClick("Medicine Management")}
              >
                <ClipboardPlus size={22} />
                {sidebarOpen && <span>Medicine Management</span>}
              </li>

              <li
                className={`sidebar-item ${
                  activeItem === "Medicine Inventory" ? "active" : ""
                }`}
                onClick={() => handleMenuItemClick("Medicine Inventory")}
              >
                <Package size={22} />
                {sidebarOpen && <span>Medicine Inventory</span>}
              </li>

              <li
                className={`sidebar-item ${
                  activeItem === "Reminders" ? "active" : ""
                }`}
                onClick={() => handleMenuItemClick("Reminders")}
              >
                <Bell size={22} />
                {sidebarOpen && <span>Reminders</span>}
              </li>

              <li
                className={`sidebar-item ${activeItem === "Alerts" ? "active" : ""}`}
                onClick={() => handleMenuItemClick("Alerts")}
              >
                <TriangleAlert size={22} />
                {sidebarOpen && <span>Alerts</span>}
              </li>

              <li
                className={`sidebar-item ${activeItem === "Reports" ? "active" : ""}`}
                onClick={() => handleMenuItemClick("Reports")}
              >
                <BarChart3 size={22} />
                {sidebarOpen && <span>Reports</span>}
              </li>

              <li className="sidebar-divider"></li>

              <li
                className={`sidebar-item sidebar-logout ${
                  activeItem === "Logout" ? "active" : ""
                }`}
                onClick={() => handleMenuItemClick("Logout")}
              >
                <LogOut size={22} />
                {sidebarOpen && <span>Logout</span>}
              </li>
            </ul>
          </aside>

          {/* ================= MAIN ================= */}
          <main className="main-content">
            {showNotifications ? (
              <UserNotifi />
            ) : showViewReport ? (
              <UserViewRep onBack={() => setShowViewReport(false)} />
            ) : activeItem === "Medicine Inventory" ? (
              <UserInvent
                stockItems={stockItems}
                onAddStock={() => setShowAddStockModal(true)}
                onUpdateStock={handleUpdateStock}
                onDeleteStock={handleDeleteStock}
              />
            ) : activeItem === "Reports" ? (
              <UserReport onViewReport={() => setShowViewReport(true)} />
            ) : activeItem === "Alerts" ? (
              <UserAlert onAddMedicine={handleAddMedicine} />
            ) : activeItem === "Reminders" ? (
              <UserRem
                onAddMedicine={handleAddMedicine}
                onReminderActionComplete={refreshAfterMedicineAdded}
              />
            ) : showLogoutModal ? (
              <UserLogout
                onCancel={() => setShowLogoutModal(false)}
                onLogout={() => {
                  setShowLogoutModal(false);
                  if (onLogout) onLogout();
                }}
              />
            ) : showProfile ? (
              <UserProfiles />
            ) : (
              <>
                <h2 className="page-title">Dashboard</h2>

                {/* ================= TOP CARDS ================= */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <CalendarDays />
                    <div>
                      <h1>{summaryLoading ? "..." : dashboardSummary.todayMedicines}</h1>
                      <p>Today's Medicines</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <CircleCheck />
                    <div>
                      <h1>{summaryLoading ? "..." : dashboardSummary.taken}</h1>
                      <p>Taken</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <CircleX />
                    <div>
                      <h1>{summaryLoading ? "..." : dashboardSummary.missed}</h1>
                      <p>Missed</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <ArrowDownCircle />
                    <div>
                      <h1>{summaryLoading ? "..." : dashboardSummary.lowStock}</h1>
                      <p>Low Stock Alerts</p>
                    </div>
                  </div>
                </div>

                {/* ================= ROW 1 ================= */}
                <div className="card-row">
                  <div className="dashboard-card today-schedule-card">
                    <div className="card-header">
                      <CalendarDays />
                      Today's Schedules
                    </div>

                    <div className="schedule-content">
                      {scheduleLoading ? (
                        <div className="empty-card">
                          <CalendarDays size={60} />
                          <h4>Loading today's schedule...</h4>
                        </div>
                      ) : todaySchedule.length === 0 ? (
                        <div className="empty-card">
                          <CalendarDays size={60} />
                          <h4>No medicine scheduled for today</h4>
                          <p>Add medicine and set reminder to see your schedule</p>
                          <button
                            className="add-first-medicine-btn"
                            onClick={handleAddMedicine}
                          >
                            <Plus size={24} />
                            <span>Add Your First Medicine</span>
                          </button>
                        </div>
                      ) : (
                        <div className="today-timeline medicine-list--today">
                          <div className="today-timeline-scroll-area">
                          <div className="today-timeline-date-card">
                            <CalendarDays size={24} />
                            <span>Today</span>
                            <strong>{todayScheduleDate}</strong>
                          </div>

                            <div className="today-timeline-track-wrap">
                            <div className="today-timeline-scale">
                              <span>00:00</span>
                              <span>12:00</span>
                              <span>24:00</span>
                            </div>
                            <div className="today-timeline-rows">
                              {scheduleMedicineRows.map((row) => (
                                <div key={row.name} className="today-timeline-row">
                                  <div className="today-timeline-row-name">{row.name}</div>
                                  <div className="today-timeline-track" style={{ minHeight: `${96 + Math.max(0, row.medicines.length - 1) * 8}px` }}>
                                    <span className="today-timeline-node start" />
                                    <span className="today-timeline-node mid" />
                                    <span className="today-timeline-node end" />
                                    {row.medicines.map((medicine, index) => {
                                      const status = medicine.status || "upcoming";
                                      return (
                                        <div
                                          key={medicine.id || `${row.name}-${index}`}
                                          className={`today-timeline-medicine ${status}`}
                                          style={{ left: `${getScheduleTimelinePosition(medicine)}%`, "--card-offset": `${(index - (row.medicines.length - 1) / 2) * 44}px` }}
                                        >
                                          <span className="today-timeline-pin" />
                                          <div className="today-timeline-card">
                                            <strong>{getScheduleTimeLabel(medicine)}</strong>
                                            <small>
                                              <Clock size={12} />
                                              {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </small>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {row.notes && (
                                    <div className="today-schedule-notes">
                                      <div className="today-schedule-notes-label">
                                        <FileText size={14} />
                                        <span>Notes</span>
                                      </div>
                                      <p>{row.notes}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                          </div>
                          </div>
                          <div className="dashboard-schedule-pagination">
                            <div className="schedule-page-info">
                              Showing {scheduleStartIndex + 1} to {Math.min(scheduleStartIndex + scheduleItemsPerPage, todaySchedule.length)} of {todaySchedule.length}
                            </div>
                            <div className="schedule-pagination-controls">
                              <button
                                className="schedule-page-btn"
                                disabled={schedulePage === 1}
                                onClick={() => setSchedulePage((page) => Math.max(1, page - 1))}
                              >
                                Prev
                              </button>
                              {Array.from({ length: scheduleTotalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                  key={page}
                                  className={`schedule-page-btn schedule-page-num ${schedulePage === page ? "active" : ""}`}
                                  onClick={() => setSchedulePage(page)}
                                >
                                  {page}
                                </button>
                              ))}
                              <button
                                className="schedule-page-btn"
                                disabled={schedulePage === scheduleTotalPages}
                                onClick={() => setSchedulePage((page) => Math.min(scheduleTotalPages, page + 1))}
                              >
                                Next
                              </button>
                            </div>
                          </div>

                          <button className="add-more-btn" onClick={handleAddMedicine}>
                            <Plus size={24} />
                            Add More Medicine
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="dashboard-card inventory-overview-card">
                    <div className="card-header">
                      <Package />
                      Inventory Overview
                    </div>

                    {inventoryLoading ? (
                      <div className="empty-card">
                        <Package size={60} />
                        <h4>Loading inventory...</h4>
                      </div>
                    ) : inventoryData.length === 0 ? (
                      <div className="empty-card">
                        <Package size={60} />
                        <h4>No inventory data available</h4>
                        <p>Add medicine to track stock and get alerts</p>
                        <button
                          className="add-first-medicine-btn"
                          onClick={() => setShowAddStockModal(true)}
                        >
                          <Plus size={24} />
                          <span>Add Medicine Stock</span>
                        </button>
                      </div>
                    ) : (
                      <div className="stock-table">
                        <div className="stock-table-header">
                          <span>Medicine</span>
                          <span>Current Stock</span>
                          <span>Min Stock</span>
                          <span>Expiry Date</span>
                        </div>
                        {inventoryData.map((item, index) => (
                          <div key={item.id || index} className="stock-table-row">
                            <span className="stock-medicine-name">{item.medicineName}</span>
                            <span>{item.currentStock}</span>
                            <span>{item.minimumStock}</span>
                            <span>{item.expiryDate}</span>
                            <div className="stock-mobile-top" aria-hidden="true">
                              <span className="stock-mobile-name">{item.medicineName}</span>
                            </div>
                            <div className="stock-mobile-metrics" aria-hidden="true">
                              <div className="stock-mobile-metric">
                                <span className="stock-mobile-icon"><Package size={18} /></span>
                                <strong>{item.currentStock}</strong>
                                <small>Current</small>
                              </div>
                              <div className="stock-mobile-metric">
                                <span className="stock-mobile-icon"><ShieldCheck size={18} /></span>
                                <strong>{item.minimumStock}</strong>
                                <small>Min</small>
                              </div>
                              <div className="stock-mobile-metric">
                                <span className="stock-mobile-icon"><CalendarDays size={18} /></span>
                                <strong>{item.expiryDate || "--"}</strong>
                                <small>Expiry</small>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          className="add-stock-inline-btn"
                          onClick={() => setShowAddStockModal(true)}
                        >
                          <Plus size={20} />
                          Add More Stock
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ================= ROW 2 ================= */}
                <div className="card-row" ref={myMedicineRef}>
                  <UserManage
                    medicines={myMedicines}
                    loading={myMedicinesLoading}
                    onAddMedicine={handleCloseMedicineModal}
                    onEditMedicine={handleEditMedicine}
                    onDeleteMedicine={handleDeleteMedicine}
                  />

                  <div className="dashboard-card calendar-card">
                    <div className="card-header">
                      <span className="calendar-title">
                        <CalendarDays />
                        Calendar
                      </span>
                      <button
                        type="button"
                        className="calendar-today-btn"
                        onClick={handleGoToToday}
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
                          <path d="M21 12a9 9 0 1 1-2.64-6.36"></path>
                          <polyline points="21 3 21 9 15 9"></polyline>
                        </svg>
                      </button>
                    </div>

                    <div className="calendar-container">
                      <div className="calendar-header">
                        <button className="calendar-nav-btn" onClick={handlePrevMonth}>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="15 18 9 12 15 6"></polyline>
                          </svg>
                        </button>
                        <h3>{monthLabel}</h3>
                        <button className="calendar-nav-btn" onClick={handleNextMonth}>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                      </div>

                      {calendarLoading && (
                        <div className="calendar-loading">Loading...</div>
                      )}

                      <div className="calendar-grid">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="calendar-day-header">
                            {day}
                          </div>
                        ))}
                        {calendarDays.map((d, i) => (
                          <div
                            key={i}
                            className={`calendar-date${getCalendarDateClass(d)}`}
                          >
                            {d}
                          </div>
                        ))}
                      </div>

                      <div className="calendar-footer">
                        <div className="calendar-legend">
                          <div className="legend-item">
                            <div className="legend-dot taken"></div>
                            <span>Taken</span>
                          </div>
                          <div className="legend-item">
                            <div className="legend-dot missed"></div>
                            <span>Missed</span>
                          </div>
                        </div>

                        <div className="calendar-actions">
                          <button
                            type="button"
                            className="calendar-action-btn alert-btn"
                            onClick={() => handleMenuItemClick("Alerts")}
                          >
                            Alert
                          </button>
                          <button
                            type="button"
                            className="calendar-action-btn reminder-btn"
                            onClick={() => handleMenuItemClick("Reminders")}
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





























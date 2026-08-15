import { useEffect, useState, useMemo, useRef } from "react";
import api from "../../api/axiosInstance";
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
  CircleCheck,
  CircleX,
  ArrowDownCircle,
  Plus,
  Menu,
  Clock,
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
  // Reminder data fetched from GET /reminder/calendar?startDate=...&endDate=...
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

  // ================= API CALL: GET REMINDER CALENDAR =================
  // Endpoint: GET /reminder/calendar?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
  // Fetches reminders for the currently displayed month range.
  const fetchCalendarData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      setCalendarLoading(true);

      // Build start/end dates for the displayed month (YYYY-MM-DD)
      const startDate = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-01`;
      const endDate = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(
        daysInMonth
      ).padStart(2, "0")}`;

      const response = await api.get("/reminder/calendar", {
        params: { startDate, endDate },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.reminders || response.data?.data || [];
      setCalendarData(data);
    } catch (err) {
      // TEMP DEBUG
      console.log("fetchCalendarData API Error:", err.response?.status, err.response?.data || err.message);
      setCalendarData([]);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Fetch calendar data on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when the displayed month/year changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const isToday = dateValue === todayDate && calendarMonth === todayMonth && calendarYear === todayYear;

    let statusClass = "";
    if (statuses && statuses.length > 0) {
      if (statuses.includes("missed")) statusClass = " missed";
      else if (statuses.includes("taken")) statusClass = " taken";
      else if (statuses.includes("snoozed")) statusClass = " snoozed";
      else statusClass = " upcoming";
    }

    return `${isToday ? " today" : ""}${statusClass}`;
  };
  // CRITICAL FIX: Start with empty arrays — never initialize from
  // localStorage. Stale cached data contains old IDs that no longer
  // exist on the backend. Only real backend data should be shown.
  const [medicines, setMedicines] = useState([]);
  const [stockItems, setStockItems] = useState([]);

  // CRITICAL FIX: Clear stale localStorage cache on mount so old
  // reminder/medicine IDs that no longer exist on the backend are
  // never used again.
  useEffect(() => {
    try {
      localStorage.removeItem("userMedicines");
      localStorage.removeItem("userStockItems");
    } catch {
      // ignore
    }
  }, []);
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

  // Save medicines to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("userMedicines", JSON.stringify(medicines));
  }, [medicines]);

  // Save stock items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("userStockItems", JSON.stringify(stockItems));
  }, [stockItems]);

  // ================= REUSABLE FETCH FUNCTIONS =================
  // Pulled out of useEffect bodies so they can be called both on mount
  // AND again right after an add/update action (e.g. after adding a
  // medicine, so "Today's Schedule" / "My Medicine" / summary cards
  // reflect the new data immediately instead of staying stale until a
  // manual page refresh).

  const fetchMedicines = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await api.get("/medicine/my-medicines");
      if (response.data?.medicines && Array.isArray(response.data.medicines)) {
        setMedicines(response.data.medicines);
      } else if (response.data && Array.isArray(response.data)) {
        setMedicines(response.data);
      }
    } catch (err) {
      // TEMP DEBUG
      console.log('fetchMedicines API Error:', err.response?.status, err.response?.data || err.message);
    }
  };

  const fetchStockItemsFromServer = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await api.get("/medicine/inventory");
      if (response.data?.stockItems && Array.isArray(response.data.stockItems)) {
        setStockItems(response.data.stockItems);
      }
    } catch (err) {
      // TEMP DEBUG
      console.log('fetchStockItemsFromServer API Error:', err.response?.status, err.response?.data || err.message);
    }
  };

  // Endpoint: GET /medicine/today-schedule
  const fetchTodaySchedule = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      setScheduleLoading(true);
      const response = await api.get("/medicine/today-schedule");
      if (response.data && Array.isArray(response.data)) {
        setTodaySchedule(response.data);
      } else if (response.data?.schedules && Array.isArray(response.data.schedules)) {
        setTodaySchedule(response.data.schedules);
      } else if (response.data?.medicines && Array.isArray(response.data.medicines)) {
        setTodaySchedule(response.data.medicines);
      }
    } catch (err) {
      // TEMP DEBUG
      console.log('fetchTodaySchedule API Error:', err.response?.status, err.response?.data || err.message);
    } finally {
      setScheduleLoading(false);
    }
  };

  // Endpoint: GET /medicine/inventory
  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      setInventoryLoading(true);
      const response = await api.get("/medicine/inventory");
      if (response.data && Array.isArray(response.data)) {
        setInventoryData(response.data);
      } else if (response.data?.inventory && Array.isArray(response.data.inventory)) {
        setInventoryData(response.data.inventory);
      } else if (response.data?.items && Array.isArray(response.data.items)) {
        setInventoryData(response.data.items);
      }
    } catch (err) {
      // TEMP DEBUG
      console.log('fetchInventory API Error:', err.response?.status, err.response?.data || err.message);
    } finally {
      setInventoryLoading(false);
    }
  };

  // Endpoint: GET /medicine/dashboard-summary
  const fetchDashboardSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      setSummaryLoading(true);
      const response = await api.get("/medicine/dashboard-summary");
      if (response.data && typeof response.data === "object") {
        setDashboardSummary((prev) => ({
          ...prev,
          ...response.data,
        }));
      }
    } catch (err) {
      // TEMP DEBUG
      console.log('fetchDashboardSummary API Error:', err.response?.status, err.response?.data || err.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Endpoint: GET /medicine/my-medicines
  const fetchMyMedicines = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      setMyMedicinesLoading(true);
      const response = await api.get("/medicine/my-medicines");
      if (response.data && Array.isArray(response.data)) {
        setMyMedicines(response.data);
      } else if (response.data?.medicines && Array.isArray(response.data.medicines)) {
        setMyMedicines(response.data.medicines);
      }
    } catch (err) {
      // TEMP DEBUG
      console.log('fetchMyMedicines API Error:', err.response?.status, err.response?.data || err.message);
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
  // Endpoint: PUT /medicine/{id}
  // Updates the medicine on the backend, then refreshes both the local
  // medicine lists and the server-driven dashboard cards.
  const handleEditMedicine = async (updatedMedicine) => {
    if (!updatedMedicine?.id) return;

    // Backend expects frequency in backend format (e.g. "ONCE_DAILY").
    // Map display labels back, and pass through already-backend values.
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
      frequency: backendFrequency(updatedMedicine.frequency),
    };

    try {
      const response = await api.put(`/medicine/${updatedMedicine.id}`, payload);
      const saved = response.data || updatedMedicine;

      // Update both medicine lists with the saved/updated item
      setMyMedicines((prev) =>
        prev.map((med) => (med.id === updatedMedicine.id ? { ...med, ...saved } : med))
      );
      setMedicines((prev) =>
        prev.map((med) => (med.id === updatedMedicine.id ? { ...med, ...saved } : med))
      );

      toast.success("Medicine updated successfully!", { duration: 3000 });

      // Refresh server-driven cards (schedule, my-medicines, summary)
      refreshAfterMedicineAdded();
      refreshAfterStockAdded();
    } catch (err) {
      // TEMP DEBUG
      console.log("Edit Medicine API Error:", err.response?.status, err.response?.data || err.message);
      toast.error(
        err.response?.data?.message || "Failed to update medicine. Please try again.",
        { duration: 4000 }
      );
    }
  };

  // ================= MEDICINE DELETE (My Medicine card) =================
  // Endpoint: DELETE /medicine/{id}
  // Deletes the medicine on the backend, removes it from the local lists,
  // and refreshes the server-driven dashboard cards.
  const handleDeleteMedicine = async (id) => {
    if (!id) return;

    try {
      await api.delete(`/medicine/${id}`);

      // Remove from medicine + stock lists
      setMyMedicines((prev) => prev.filter((med) => med.id !== id));
      setMedicines((prev) => prev.filter((med) => med.id !== id));
      setStockItems((prev) => prev.filter((item) => item.id !== id));

      toast.success("Medicine deleted successfully!", { duration: 3000 });

      // Refresh server-driven cards (schedule, my-medicines, inventory, summary)
      refreshAfterMedicineAdded();
      refreshAfterStockAdded();
    } catch (err) {
      // TEMP DEBUG
      console.log("Delete Medicine API Error:", err.response?.status, err.response?.data || err.message);
      toast.error(
        err.response?.data?.message || "Failed to delete medicine. Please try again.",
        { duration: 4000 }
      );
    }
  };
  // ================================================================

  // CRITICAL FIX: Always fetch medicines from backend on mount — never
  // skip based on localStorage. This ensures only real backend data is
  // shown, not stale cached data with old IDs.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMedicines();
  }, []);

  // CRITICAL FIX: Always fetch stock items from backend on mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStockItemsFromServer();
  }, []);

  // Fetch today's schedule from backend
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTodaySchedule();
  }, []);

  // Fetch inventory from backend
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInventory();
  }, []);

  // Fetch dashboard summary from backend
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardSummary();
  }, []);

  // Fetch my medicines from backend
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMyMedicines();
  }, []);

  const handleCloseMedicineModal = (medicineData) => {
    setShowAddMedicineModal(false);

    if (medicineData) {
      // Extract first timing from timings array for display
      const firstTiming = medicineData.timings?.[0]?.time || "";

      const newMedicine = {
        id: Date.now(),
        status: "upcoming",
        ...medicineData,
        timing: firstTiming, // Ensure timing (singular) is set for table display
      };
      setMedicines((prev) => [...prev, newMedicine]);

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

      // The medicine was already saved on the backend by AddMedicineModal
      // (POST /medicine/add). Refresh the server-driven cards so the new
      // medicine shows up in "Today's Schedule", "My Medicine", and the
      // summary counters right away.
      refreshAfterMedicineAdded();
    }
  };

  // Add stock — now expects the SERVER's saved item (with real id) from AddStockModal
  const handleAddStock = (savedStockItem) => {
    if (savedStockItem) {
      setStockItems((prev) => [...prev, savedStockItem]);
      // Refresh the Inventory Overview card + summary counters.
      refreshAfterStockAdded();
    }
    setShowAddStockModal(false);
  };

  // Update stock — called by UserInvent after a successful PUT /medicine/{id}/stock
  const handleUpdateStock = (id, updatedData) => {
    setStockItems((prev) =>
      prev.map((item) =>
        String(item.id) === String(id) ? { ...item, ...updatedData } : item
      )
    );
    refreshAfterStockAdded();
  };

  // Delete stock — called by UserInvent after a successful DELETE /medicine/{id}
  const handleDeleteStock = (id) => {
    setStockItems((prev) => prev.filter((item) => String(item.id) !== String(id)));
    refreshAfterStockAdded();
  };

  // Snooze reminder — add 10 minutes to the medicine timing
  const handleSnoozeReminder = (medicineId) => {
    setMedicines((prev) =>
      prev.map((med) => {
        if (med.id !== medicineId) return med;

        // Calculate new time by adding 10 minutes
        const [hours, minutes] = med.timing.split(":").map(Number);
        const totalMinutes = hours * 60 + minutes + 10;
        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMinutes = totalMinutes % 60;
        const newTiming = `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;

        return {
          ...med,
          timing: newTiming,
          status: "snoozed",
        };
      })
    );
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
            {isMobile && (
              <button
                type="button"
                className="mobile-sidebar-toggle"
                aria-label="Open menu"
                onClick={handleSidebarToggle}
              >
                <Menu size={22} />
              </button>
            )}
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
              <button
                className="sidebar-toggle-btn"
                onClick={handleSidebarToggle}
              >
                <Menu size={24} />
              </button>
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
                onSnoozeReminder={handleSnoozeReminder}
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
                  <div className="dashboard-card">
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
                            Add Your First Medicine
                          </button>
                        </div>
                      ) : (
                        <div className="medicine-list medicine-list--today">
                          <div className="medicine-table-header">
                            <span className="medicine-col medicine-name-col">Medicine</span>
                            <span className="medicine-col medicine-dosage-col">Dosage</span>
                            <span className="medicine-col medicine-time-col">Timing</span>
                            <span className="medicine-col medicine-frequency-col">Frequency</span>
                            <span className="medicine-col medicine-status-col">Status</span>
                          </div>
                          {schedulePageItems.map((medicine, index) => (
                            <div key={medicine.id || index} className="medicine-item">
                              <div className="medicine-info">
                                <h5>{medicine.medicineName}</h5>
                              </div>
                              <div className="medicine-dosage-value">{medicine.dosage}</div>
                              <div className="medicine-time-value">
                                <Clock size={14} />
                                {medicine.timing || medicine.time}
                              </div>
                              <div className="medicine-frequency-value">{medicine.frequency}</div>
                              <div className="medicine-status">
                                <span className={`status-badge ${medicine.status || "upcoming"}`}>
                                  {medicine.status ? medicine.status.charAt(0).toUpperCase() + medicine.status.slice(1) : "Upcoming"}
                                </span>
                              </div>
                            </div>
                          ))}

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

                  <div className="dashboard-card">
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
                          Add Medicine Stock
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

import { useEffect, useState, useMemo, useRef } from "react";

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
    localStorage.getItem("profileCompleted") !== "true"
  );
  const [activeItem, setActiveItem] = useState("Home");
  const [showViewReport, setShowViewReport] = useState(false);

  const myMedicineRef = useRef(null);

  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  const monthLabel = today.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(todayYear, todayMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(todayYear, todayMonth, 1).getDay();

  const calendarDays = [
    ...Array(firstDayOfMonth).fill(""),
    ...Array.from({ length: daysInMonth }, (_, index) => String(index + 1)),
  ];

  while (calendarDays.length % 7 !== 0) {
    calendarDays.push("");
  }
  const [medicines, setMedicines] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
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

  const handleCloseMedicineModal = (medicineData) => {
    setShowAddMedicineModal(false);

    if (medicineData) {
      const newMedicine = {
        id: Date.now(),
        ...medicineData,
      };
      setMedicines((prev) => [...prev, newMedicine]);
    }
  };

  const handleAddStock = (stockData) => {
    if (stockData) {
      const newStock = {
        id: Date.now(),
        ...stockData,
      };
      setStockItems((prev) => [...prev, newStock]);
    }
    setShowAddStockModal(false);
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
            <button type="button" className="notification-btn" aria-label="Notifications">
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
            {showViewReport ? (
              <UserViewRep onBack={() => setShowViewReport(false)} />
            ) : activeItem === "Medicine Inventory" ? (
              <UserInvent />
            ) : activeItem === "Reports" ? (
              <UserReport onViewReport={() => setShowViewReport(true)} />
            ) : activeItem === "Alerts" ? (
              <UserAlert
                onAddMedicine={handleAddMedicine}
                medicines={medicines}
                stockItems={stockItems}
              />
            ) : activeItem === "Reminders" ? (
              <UserRem medicines={medicines} onAddMedicine={handleAddMedicine} />
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
                      <h1>0</h1>
                      <p>Today's Medicines</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <CircleCheck />
                    <div>
                      <h1>0</h1>
                      <p>Taken</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <CircleX />
                    <div>
                      <h1>0</h1>
                      <p>Missed</p>
                    </div>
                  </div>

                  <div className="stat-card">
                    <ArrowDownCircle />
                    <div>
                      <h1>0</h1>
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
                      {medicines.length === 0 ? (
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
                          {medicines.map((medicine) => (
                            <div key={medicine.id} className="medicine-item">
                              <div className="medicine-info">
                                <h5>{medicine.medicineName}</h5>
                              </div>
                              <div className="medicine-dosage-value">{medicine.dosage}</div>
                              <div className="medicine-time-value">
                                <Clock size={14} />
                                {medicine.timing}
                              </div>
                              <div className="medicine-frequency-value">{medicine.frequency}</div>
<div className="medicine-status">
                                <span className="status-badge upcoming">Upcoming</span>
                              </div>
                            </div>
                          ))}
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

                    {stockItems.length === 0 ? (
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
                        {stockItems.map((item) => (
                          <div key={item.id} className="stock-table-row">
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
                  <UserManage medicines={medicines} onAddMedicine={handleCloseMedicineModal} />

                  <div className="dashboard-card calendar-card">
                    <div className="card-header">
                      <CalendarDays />
                      Calendar
                    </div>

                    <div className="calendar-container">
                      <div className="calendar-header">
                        <button className="calendar-nav-btn">
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
                        <button className="calendar-nav-btn">
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

                      <div className="calendar-grid">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="calendar-day-header">
                            {day}
                          </div>
                        ))}
                        {calendarDays.map((d, i) => {
                          const dateValue = Number(d);
                          const isToday = d && dateValue === todayDate;

                          return (
                            <div
                              key={i}
                              className={`calendar-date${isToday ? " today" : ""}`}
                            >
                              {d}
                            </div>
                          );
                        })}
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
                          <button className="calendar-action-btn alert-btn">
                            Alert
                          </button>
                          <button className="calendar-action-btn reminder-btn">
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
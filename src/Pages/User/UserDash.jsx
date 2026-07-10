
import { useState } from "react";

import "./UserDash.css";


import CompleteProfileModal from "../../Component/ComProfile";

import AddMedicineModal from "../../Component/UserAddMed";

import {
  Home,
  User,
  Pill,
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
  BellRing,
  Menu,
  Clock,
  Repeat
} from "lucide-react";

const UserDash = () => {
  const [sidebarOpen, setSidebarOpen] = useState(
    localStorage.getItem("sidebarOpen") === "true"
  );
  const [profileCompleted, setProfileCompleted] = useState(
    localStorage.getItem("profileCompleted") !== "true"
  );
  const [activeItem, setActiveItem] = useState("Home");
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [medicines, setMedicines] = useState([]);

  const handleProfileComplete = () => {
    localStorage.setItem("profileCompleted", "true");
    setProfileCompleted(true);
  };

  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem("sidebarOpen", newState);
  };

  const handleMenuItemClick = (itemName) => {
    setActiveItem(itemName);
  };

  const handleAddMedicine = () => {
    setShowAddMedicineModal(true);
  };

  const handleCloseMedicineModal = (medicineData) => {
    setShowAddMedicineModal(false);
    
    if (medicineData) {
      const newMedicine = {
        id: Date.now(),
        ...medicineData
      };
      setMedicines((prev) => [...prev, newMedicine]);
    }
  };

  return (
    <>
      {/* Profile Modal */}
      {!profileCompleted && (
        <CompleteProfileModal
          onComplete={handleProfileComplete}
        />
      )}

      {/* Add Medicine Modal */}
      {showAddMedicineModal && (
        <div>
          <AddMedicineModal
            onClose={handleCloseMedicineModal}
          />
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
              src= "ChatGPT Image Jun 22, 2026, 07_52_50 PM.png"
              alt="logo"
              className="logo"
            />

            <div>

              <h2>
                Healthcare Monitoring <span>System</span>
              </h2>

              <p>
                Secure • Reliable • Care Focused
              </p>

            </div>

          </div>

          <div className="top-right">

            <BellRing className="top-icon" />

            <div className="profile-box">

              <div className="avatar">
                <User size={24} />
              </div>

              <span>Jhon Deo</span>

            </div>

          </div>

        </header>

        {/* ================= BODY ================= */}

        <div className="dashboard-body">

          {/* ================= SIDEBAR ================= */}

          <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>

            {/* Toggle Button */}
            <div className="sidebar-header">
              <button className="sidebar-toggle-btn" onClick={handleSidebarToggle}>
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
                className={`sidebar-item ${activeItem === "My Profile" ? "active" : ""}`}
                onClick={() => handleMenuItemClick("My Profile")}
              >
                <User size={22} />
                {sidebarOpen && <span>My Profile</span>}
              </li>

              <li 
                className={`sidebar-item ${activeItem === "Medicine Management" ? "active" : ""}`}
                onClick={() => handleMenuItemClick("Medicine Management")}
              >
                <ClipboardPlus size={22} />
                {sidebarOpen && <span>Medicine Management</span>}
              </li>

              <li 
                className={`sidebar-item ${activeItem === "Medicine Inventory" ? "active" : ""}`}
                onClick={() => handleMenuItemClick("Medicine Inventory")}
              >
                <Package size={22} />
                {sidebarOpen && <span>Medicine Inventory</span>}
              </li>

              <li 
                className={`sidebar-item ${activeItem === "Reminders" ? "active" : ""}`}
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
                className={`sidebar-item sidebar-logout ${activeItem === "Logout" ? "active" : ""}`}
                onClick={() => handleMenuItemClick("Logout")}
              >
                <LogOut size={22} />
                {sidebarOpen && <span>Logout</span>}
              </li>

            </ul>

          </aside>

          {/* ================= MAIN ================= */}

          <main className="main-content">

            <h2 className="page-title">
              Dashboard
            </h2>

            {/* ================= TOP CARDS ================= */}

            <div className="stats-grid">

              <div className="stat-card">

                <CalendarDays />

                <div>

                  <h1>0</h1>

                  <p>
                    Today's Medicines
                  </p>

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

                      <h4>
                        No medicine scheduled for today
                      </h4>

                      <p>
                        Add medicine and set reminder to see your schedule
                      </p>

                      <button className="add-first-medicine-btn" onClick={handleAddMedicine}>

                        <Plus size={18} />

                        Add Your First Medicine

                      </button>
                    </div>
                  ) : (
                    <div className="medicine-list">
                      {medicines.map((medicine) => (
                        <div key={medicine.id} className="medicine-item">
                          <div className="medicine-info">
                            <h5>{medicine.medicineName}</h5>
                            <p className="medicine-dosage">{medicine.dosage}</p>
                            <div className="medicine-details">
                              <span className="medicine-timing">
                                <Clock size={14} />
                                {medicine.timing}
                              </span>
                              <span className="medicine-frequency">
                                <Repeat size={14} />
                                {medicine.frequency}
                              </span>
                            </div>
                          </div>
                          <div className="medicine-status">
                            <span className="status-badge pending">Pending</span>
                          </div>
                        </div>
                      ))}
                      <button className="add-more-btn" onClick={handleAddMedicine}>
                        <Plus size={16} />
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

                <div className="empty-card">

                  <Package size={60} />

                  <h4>
                    No inventory data available
                  </h4>

                  <p>
                    Add medicine to track stock and get alerts
                  </p>

                  <button>

                    <Plus size={18} />

                    Add Medicine Stock

                  </button>

                </div>

              </div>

            </div>

            {/* ================= ROW 2 ================= */}

            <div className="card-row">

              <div className="dashboard-card">

                <div className="card-header">

                  <Pill />

                  My Medicine

                </div>

                <div className="empty-card">

                  <Pill size={60} />

                  <h4>
                    No medicine added yet
                  </h4>

                  <p>
                    Add your medicine to see your medicine list
                  </p>

                  <button>

                    <Plus size={18} />

                    Add Your First Medicine

                  </button>

                </div>

              </div>

              <div className="dashboard-card calendar-card">

                <div className="card-header">

                  <CalendarDays />

                  Calendar

                </div>

                <div className="calendar-container">

                  <div className="calendar-header">

                    <button className="calendar-nav-btn">

                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">

                        <polyline points="15 18 9 12 15 6"></polyline>

                      </svg>

                    </button>

                    <h3>May 2026</h3>

                    <button className="calendar-nav-btn">

                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">

                        <polyline points="9 18 15 12 9 6"></polyline>

                      </svg>

                    </button>

                  </div>

                  <div className="calendar-grid">

                    <div className="calendar-day-header">Sun</div>

                    <div className="calendar-day-header">Mon</div>

                    <div className="calendar-day-header">Tue</div>

                    <div className="calendar-day-header">Wed</div>

                    <div className="calendar-day-header">Thu</div>

                    <div className="calendar-day-header">Fri</div>

                    <div className="calendar-day-header">Sat</div>

                    <div className="calendar-date"></div>

                    <div className="calendar-date"></div>

                    <div className="calendar-date"></div>

                    <div className="calendar-date"></div>

                    <div className="calendar-date">1</div>

                    <div className="calendar-date">2</div>

                    <div className="calendar-date">3</div>

                    <div className="calendar-date">4</div>

                    <div className="calendar-date">5</div>

                    <div className="calendar-date">6</div>

                    <div className="calendar-date">7</div>

                    <div className="calendar-date">8</div>

                    <div className="calendar-date">9</div>

                    <div className="calendar-date">10</div>

                    <div className="calendar-date">11</div>

                    <div className="calendar-date">12</div>

                    <div className="calendar-date">13</div>

                    <div className="calendar-date">14</div>

                    <div className="calendar-date">15</div>

                    <div className="calendar-date">16</div>

                    <div className="calendar-date">17</div>

                    <div className="calendar-date">18</div>

                    <div className="calendar-date">19</div>

                    <div className="calendar-date">20</div>

                    <div className="calendar-date">21</div>

                    <div className="calendar-date">22</div>

                    <div className="calendar-date">23</div>

                    <div className="calendar-date">24</div>

                    <div className="calendar-date">25</div>

                    <div className="calendar-date">26</div>

                    <div className="calendar-date">27</div>

                    <div className="calendar-date">28</div>

                    <div className="calendar-date">29</div>

                    <div className="calendar-date">30</div>

                    <div className="calendar-date">31</div>

                  </div>

                  <div className="calendar-legend">

                    <div className="legend-item">

                      <div className="legend-dot medicine"></div>

                      <span>Medicine</span>

                    </div>

                    <div className="legend-item">

                      <div className="legend-dot reminder"></div>

                      <span>Reminder</span>

                    </div>

                    <div className="legend-item">

                      <div className="legend-dot taken"></div>

                      <span>Taken</span>

                    </div>

                    <div className="legend-item">

                      <div className="legend-dot missed"></div>

                      <span>Missed</span>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </main>

        </div>

      </div>

    </>

  );

};

export default UserDash;

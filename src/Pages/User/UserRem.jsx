import "./UserRem.css";

import {
  Plus,
  Clock,
  Lightbulb,
  Trash2,
  Pill,
  Calendar,
} from "lucide-react";

const UserRem = ({ medicines = [], onAddMedicine, onDeleteReminder }) => {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="rem-page">
      <div className="rem-header-section">
        <div className="rem-header-top">
          <div className="rem-header-left">
            <h1 className="rem-heading">Medicine Reminders</h1>
            <p className="rem-subtitle">Track your scheduled medications for today</p>
          </div>
          <button className="rem-add-more-btn rem-header-add-btn" type="button" onClick={() => onAddMedicine && onAddMedicine()}>
            <Plus size={18} />
            Add More Medicine
          </button>
        </div>
      </div>

      {medicines.length === 0 ? (
        <div className="rem-card">
          <div className="rem-empty">
            <div className="rem-illustration">
              <svg width="300" height="260" viewBox="0 0 300 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Reminder illustration">
                <rect x="80" y="20" width="140" height="200" rx="16" fill="#DFF6F4" stroke="#0F766E" strokeWidth="3"/>
                <rect x="110" y="8" width="80" height="24" rx="8" fill="#0F766E"/>
                <rect x="120" y="16" width="60" height="8" rx="4" fill="#DFF6F4"/>
                <rect x="130" y="60" width="40" height="55" rx="6" fill="#0F766E" opacity=".85"/>
                <rect x="135" y="52" width="30" height="14" rx="4" fill="#115E59"/>
                <circle cx="150" cy="80" r="5" fill="#DFF6F4"/>
                <circle cx="150" cy="95" r="5" fill="#DFF6F4"/>
                <ellipse cx="185" cy="120" rx="18" ry="10" fill="#0F766E" transform="rotate(-30 185 120)"/>
                <ellipse cx="115" cy="130" rx="14" ry="8" fill="#DFF6F4" stroke="#0F766E" strokeWidth="1.5"/>
                <rect x="100" y="150" width="100" height="55" rx="8" fill="#fff" stroke="#0F766E" strokeWidth="1.5" strokeDasharray="4 3"/>
                <line x1="115" y1="165" x2="170" y2="165" stroke="#0F766E" strokeWidth="2" strokeLinecap="round"/>
                <line x1="115" y1="178" x2="155" y2="178" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" opacity=".6"/>
                <line x1="115" y1="191" x2="140" y2="191" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" opacity=".4"/>
                <circle cx="220" cy="170" r="20" fill="#DFF6F4"/>
                <path d="M212 170 L218 177 L228 164" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="60" cy="50" r="4" fill="#DFF6F4"/>
                <circle cx="240" cy="40" r="3" fill="#DFF6F4"/>
                <circle cx="55" cy="190" r="3" fill="#DFF6F4"/>
                <circle cx="245" cy="200" r="4" fill="#DFF6F4"/>
              </svg>
            </div>
            <h2 className="rem-empty-heading">No Reminders Scheduled Yet</h2>
            <p className="rem-empty-desc">
              You haven't added any medicines or set any reminder times.
              <br />
              Add your medicines and schedule times to stay on track and never miss a dose.
            </p>
            <button className="rem-add-btn" onClick={() => onAddMedicine && onAddMedicine()}>
              <Plus size={24} />
              Add Medicine
            </button>
            <div className="rem-banner">
              <div className="rem-banner-icon"><Lightbulb size={24} /></div>
              <div className="rem-banner-text">
                <h3>Stay on track, every day!</h3>
                <p>Set your reminders and we'll help you never miss a dose.</p>
              </div>
              <div className="rem-banner-decoration">
                <svg width="80" height="60" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 40 Q30 10 60 30 Q75 40 70 55" stroke="#0F766E" strokeWidth="2" strokeDasharray="4 3" opacity=".25" fill="none"/>
                  <g transform="translate(65,50) rotate(30)"><path d="M0 0 L12-4 L10 4 Z" fill="#0F766E" opacity=".25"/></g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rem-content">
          <div className="rem-section-header">
            <span className="rem-section-title">UPCOMING TODAY</span>
          </div>

          <div className="rem-cards-grid">
            {medicines.map((med) => (
              <div key={med.id} className="rem-card-item">
                <div className="rem-card-top-row">
                  <div className="rem-time-badge">
                    <Clock size={16} />
                    <span>{med.timing}</span>
                  </div>
                  <span className="rem-next-dose-label">NEXT DOSE</span>
                </div>
                <div className="rem-card-middle">
                  <div className="rem-pill-icon-wrap">
                    <Pill size={28} />
                  </div>
                  <div className="rem-card-info">
                    <div className="rem-card-name">{med.medicineName}</div>
                    <div className="rem-card-dose">{med.dosage}</div>
                  </div>
                </div>
                <div className="rem-card-date-row">
                  <Calendar size={16} />
                  <span>{dateStr}</span>
                </div>
                <div className="rem-card-actions-bar">
                  <button className="rem-snooze-btn" type="button">
                    <Clock size={16} />
                    Snooze
                  </button>
                  <button className="rem-taken-btn" type="button">
                    ✓ Taken
                  </button>
                </div>
              </div>
            ))}
          </div>


          <div className="rem-history-card">
            <div className="rem-history-header">
              <h3>Reminder History</h3>
            </div>

            <div className="rem-history-list">
              {/* Header Row */}
              <div className="rem-hl-header">
                <div className="rem-hl-col rem-hl-col-name">Medicine Name</div>
                <div className="rem-hl-col rem-hl-col-dose">Dosage</div>
                <div className="rem-hl-col rem-hl-col-date">Date</div>
                <div className="rem-hl-col rem-hl-col-time">Time</div>
                <div className="rem-hl-col rem-hl-col-status">Status</div>
                <div className="rem-hl-col rem-hl-col-action">Action</div>
              </div>

              {/* Data Rows */}
              {medicines.map((med) => (
                <div key={med.id} className="rem-hl-row">
                  <div className="rem-hl-col rem-hl-col-name">
                    <span className="rem-hl-label">Medicine Name</span>
                    <span className="rem-hl-value rem-hl-value-name">{med.medicineName}</span>
                  </div>
                  <div className="rem-hl-col rem-hl-col-dose">
                    <span className="rem-hl-label">Dosage</span>
                    <span className="rem-hl-value">{med.dosage}</span>
                  </div>
                  <div className="rem-hl-col rem-hl-col-date">
                    <span className="rem-hl-label">Date</span>
                    <span className="rem-hl-value">{formatDate(med.date) || dateStr}</span>
                  </div>
                  <div className="rem-hl-col rem-hl-col-time">
                    <span className="rem-hl-label">Time</span>
                    <span className="rem-hl-value">{med.timing}</span>
                  </div>
                  <div className="rem-hl-col rem-hl-col-status">
                    <span className="rem-hl-label">Status</span>
                    <span className="rem-status-badge rem-status-taken">Taken</span>
                  </div>
                  <div className="rem-hl-col rem-hl-col-action">
                    <button
                      className="rem-delete-btn"
                      type="button"
                      aria-label="Delete reminder"
                      onClick={() => onDeleteReminder && onDeleteReminder(med.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rem-history-empty">
              <div className="rem-history-empty-illustration">
                <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="All caught up illustration">
                  <circle cx="75" cy="75" r="60" fill="#E6FAF8" />
                  <rect x="45" y="30" width="60" height="80" rx="8" fill="white" stroke="#0F766E" strokeWidth="2.5" />
                  <rect x="55" y="38" width="40" height="6" rx="3" fill="#0F766E" opacity=".3" />
                  <rect x="55" y="50" width="30" height="4" rx="2" fill="#0F766E" opacity=".5" />
                  <rect x="55" y="60" width="35" height="4" rx="2" fill="#0F766E" opacity=".5" />
                  <rect x="55" y="70" width="25" height="4" rx="2" fill="#0F766E" opacity=".5" />
                  <rect x="55" y="80" width="32" height="4" rx="2" fill="#0F766E" opacity=".5" />
                  <path d="M52 42 L56 46 L62 38" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="95" cy="45" r="15" fill="#0F766E" opacity=".15" />
                  <rect x="90" y="30" width="10" height="12" rx="5" fill="#0F766E" />
                  <circle cx="95" cy="30" r="4" fill="#0F766E" />
                  <line x1="86" y1="40" x2="104" y2="40" stroke="#0F766E" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="95" cy="48" r="3" fill="#0F766E" />
                </svg>
              </div>
              <h3 className="rem-history-empty-heading">That's it for now!</h3>
              <p className="rem-history-empty-desc">Keep taking your medicines on time and stay healthy.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRem;
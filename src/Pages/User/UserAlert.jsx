import "./UserAlert.css";

import { Plus, Lightbulb } from "lucide-react";

const UserAlert = ({ onAddMedicine }) => {
  return (
    <div className="alert-page">
      <div className="alert-header-section">
        <div className="alert-header-top">
          <div className="alert-header-left">
            <h1 className="alert-heading">Alert</h1>
            <p className="alert-subtitle">Stay informed about important updates</p>
          </div>
        </div>
      </div>

      <div className="alert-card">
        <div className="alert-empty">
          <div className="alert-illustration">
            <svg width="300" height="260" viewBox="0 0 300 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="No alerts illustration">
              {/* Triangle warning sign */}
              <polygon points="150,20 270,230 30,230" fill="#FEE2E2" stroke="#EF4444" strokeWidth="3"/>
              <line x1="150" y1="90" x2="150" y2="170" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="150" cy="200" r="6" fill="#EF4444"/>
              {/* Exclamation mark inside triangle */}
              <rect x="144" y="85" width="12" height="80" rx="6" fill="#EF4444"/>
              <circle cx="150" cy="195" r="8" fill="#EF4444"/>
              {/* Decorative rings */}
              <circle cx="150" cy="125" r="70" fill="none" stroke="#FCA5A5" strokeWidth="1.5" opacity="0.4" strokeDasharray="4 4"/>
              <circle cx="150" cy="125" r="90" fill="none" stroke="#FCA5A5" strokeWidth="1" opacity="0.25" strokeDasharray="5 5"/>
              {/* Cross marks */}
              <line x1="50" y1="70" x2="80" y2="100" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
              <line x1="80" y1="70" x2="50" y2="100" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
              <line x1="220" y1="70" x2="250" y2="100" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
              <line x1="250" y1="70" x2="220" y2="100" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
              {/* Pills */}
              <ellipse cx="65" cy="150" rx="14" ry="7" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.5" transform="rotate(-20 65 150)"/>
              <ellipse cx="240" cy="160" rx="12" ry="6" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.5" transform="rotate(15 240 160)"/>
              {/* Medicine bottle */}
              <rect x="225" y="180" width="30" height="42" rx="6" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.5"/>
              <rect x="229" y="174" width="22" height="12" rx="3" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.5"/>
              <rect x="235" y="190" width="10" height="14" rx="2" fill="#EF4444" opacity="0.6"/>
              {/* Warning badge */}
              <circle cx="100" cy="200" r="18" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2.5"/>
              <text x="100" y="206" textAnchor="middle" fill="#EF4444" fontSize="20" fontWeight="700">!</text>
              {/* Floating dots */}
              <circle cx="50" cy="45" r="4" fill="#FECACA" opacity="0.6"/>
              <circle cx="250" cy="40" r="3.5" fill="#FECACA" opacity="0.5"/>
              <circle cx="45" cy="230" r="3.5" fill="#FECACA" opacity="0.5"/>
              <circle cx="260" cy="230" r="4" fill="#FECACA" opacity="0.6"/>
            </svg>
          </div>
          <h2 className="alert-empty-heading">No Alerts & Notifications</h2>
          <p className="alert-empty-desc">
            You're all caught up! There are no medication reminders, stock alerts,
            <br />
            or notifications to show at the moment.
          </p>
          <button className="alert-add-medicine-btn" onClick={() => onAddMedicine && onAddMedicine()}>
            <Plus size={24} />
            Add Medicine
          </button>
          <div className="alert-banner">
            <div className="alert-banner-icon"><Lightbulb size={24} /></div>
            <div className="alert-banner-text">
              <h3>Stay worry-free!</h3>
              <p>We'll notify you when there's something that needs your attention.</p>
            </div>
            <div className="alert-banner-decoration">
              <svg width="80" height="60" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 40 Q30 10 60 30 Q75 40 70 55" stroke="#0F766E" strokeWidth="2" strokeDasharray="4 3" opacity=".25" fill="none"/>
                <g transform="translate(65,50) rotate(30)"><path d="M0 0 L12-4 L10 4 Z" fill="#0F766E" opacity=".25"/></g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAlert;
import { useState } from 'react';
import './UserRem.css';

const UserRem = () => {
  const [reminders] = useState([]);

  return (
    <div className="reminder-container">
      <div className="reminder-header">
        <h1 className="reminder-title">Medicine Reminders</h1>
        <p className="reminder-subtitle">Stay on track with your medication schedule</p>
      </div>

      {reminders.length === 0 ? (
        <div className="no-reminders-section">
          <div className="no-reminders-card">
            <div className="no-reminders-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="no-reminders-title">No Medicine Reminders Yet!</h2>
            <p className="no-reminders-text">
              You haven't set any medicine reminders.<br/>
              Add your medicines and schedule times to stay on track and never miss a dose.
            </p>
            <button className="add-medicine-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Add Medicine</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="reminder-history-section">
          <h2 className="reminder-history-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Reminder History
          </h2>
          
          <div className="reminder-table-wrapper">
            <table className="reminder-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Dosage</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map((reminder) => (
                  <tr key={reminder.id}>
                    <td>{reminder.medicineName}</td>
                    <td>{reminder.dosage}</td>
                    <td>{reminder.date}</td>
                    <td>{reminder.time}</td>
                    <td>
                      <span className={`status-badge ${reminder.statusClass}`}>
                        {reminder.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.4142 19.7893 21.0391 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRem;
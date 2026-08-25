import "./UserLogout.css";

const UserLogout = ({ onCancel, onLogout }) => {
  return (
    <div className="logout-modal-overlay">
      <div className="logout-modal-container">
        <div className="logout-modal-top">
          <div className="logout-modal-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 3H8C5.79086 3 4 4.79086 4 7V17C4 19.2091 5.79086 21 8 21H16C18.2091 21 20 19.2091 20 17V7C20 4.79086 18.2091 3 16 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 9L15 12L12 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>Logout Confirmation</h2>
          <p>Are you sure you want to Logout ?</p>
          <span>You will need to login</span>
        </div>

        <div className="logout-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-logout" onClick={onLogout}>
            Yes, Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserLogout;


import './UserViewRep.css';

const UserViewRep = ({ onBack }) => {
  // Sample data for medicine-wise report
  const medicineData = [
    {
      name: 'Paracetamol 500mg',
      totalScheduled: 30,
      taken: 29,
      missed: 1,
      compliance: 97
    },
    {
      name: 'Vitamin D3',
      totalScheduled: 30,
      taken: 28,
      missed: 2,
      compliance: 93
    },
    {
      name: 'Calcium Tablet',
      totalScheduled: 30,
      taken: 30,
      missed: 0,
      compliance: 100
    },
    {
      name: 'Zincovit',
      totalScheduled: 30,
      taken: 27,
      missed: 3,
      compliance: 90
    }
  ];

  // Sample data for inventory status
  const inventoryData = [
    {
      name: 'Paracetamol 500mg',
      currentStock: 20,
      minimumStock: 10,
      status: 'In Stock'
    },
    {
      name: 'Vitamin D3',
      currentStock: 8,
      minimumStock: 10,
      status: 'Low Stock'
    },
    {
      name: 'Calcium Tablet',
      currentStock: 18,
      minimumStock: 10,
      status: 'In Stock'
    },
    {
      name: 'Zincovit',
      currentStock: 2,
      minimumStock: 10,
      status: 'Low Stock'
    }
  ];

  return (
    <div className="view-report-container">
      {/* Header Section */}
      <div className="report-header-section">
        <div className="report-title-box">
          <div className="report-icon-large">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 17H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="report-main-title">Compliance Report</h1>
            <p className="report-period">Report Period: 01 June 2026 - 30 June 2026</p>
          </div>
        </div>
        <div className="generated-info">
          <div className="generated-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="generated-label">Generated On</p>
            <p className="generated-date">20 June 2026, 01:10 PM</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card compliance-card">
          <div className="summary-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="summary-content">
            <p className="summary-label">Compliance Percentage</p>
            <h2 className="summary-value">90%</h2>
          </div>
        </div>

        <div className="summary-card taken-card">
          <div className="summary-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="summary-content">
            <p className="summary-label">Medicines Taken</p>
            <h2 className="summary-value">45</h2>
          </div>
        </div>

        <div className="summary-card missed-card">
          <div className="summary-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="summary-content">
            <p className="summary-label">Missed Medicines</p>
            <h2 className="summary-value">5</h2>
          </div>
        </div>

        <div className="summary-card stock-card">
          <div className="summary-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.29 3.86L1.82 18C1.64537 18.3024 1.55296 18.6453 1.55199 18.9945C1.55101 19.3437 1.64151 19.6871 1.81445 19.9905C1.98738 20.2939 2.23675 20.5467 2.53773 20.7239C2.83871 20.9011 3.18082 20.9962 3.53 21H20.47C20.8192 20.9962 21.1613 20.9011 21.4623 20.7239C21.7632 20.5467 22.0126 20.2939 22.1855 19.9905C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15048C12.6817 2.97785 12.3437 2.88025 12 2.88025C11.6563 2.88025 11.3183 2.97785 11.0188 3.15048C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="summary-content">
            <p className="summary-label">Low Stock Alerts</p>
            <h2 className="summary-value">2</h2>
          </div>
        </div>
      </div>

      {/* Medicine-wise Report */}
      <div className="report-section">
        <div className="section-header">
          <div className="section-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 17H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="section-title">Medicine-wise Report</h2>
        </div>
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Total Scheduled</th>
                <th>Taken</th>
                <th>Missed</th>
                <th>Compliance</th>
              </tr>
            </thead>
            <tbody>
              {medicineData.map((medicine, index) => (
                <tr key={index}>
                  <td className="medicine-name-cell">{medicine.name}</td>
                  <td>{medicine.totalScheduled}</td>
                  <td>{medicine.taken}</td>
                  <td>{medicine.missed}</td>
                  <td>
                    <div className="compliance-cell">
                      <span className="compliance-text">{medicine.compliance}%</span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${medicine.compliance}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Section - Inventory and Report Info */}
      <div className="bottom-section">
        {/* Inventory Status */}
        <div className="report-section inventory-section">
          <div className="section-header">
            <div className="section-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 16V8C20.9996 7.6493 20.9071 7.3048 20.7315 7.00017C20.556 6.69555 20.3037 6.44177 20 6.26L13 2.26C12.696 2.07839 12.3511 1.98052 12 1.98052C11.6489 1.98052 11.304 2.07839 11 2.26L4 6.26C3.69626 6.44177 3.44398 6.69555 3.26846 7.00017C3.09294 7.3048 3.00036 7.6493 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9998C3.44398 17.3045 3.69626 17.5582 4 17.74L11 21.74C11.304 21.9216 11.6489 22.0195 12 22.0195C12.3511 22.0195 12.696 21.9216 13 21.74L20 17.74C20.3037 17.5582 20.556 17.3045 20.7315 16.9998C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.27002 6.96L12 12.01L20.73 6.96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="section-title">Inventory Status</h2>
          </div>
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Current Stock</th>
                  <th>Minimum Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((item, index) => (
                  <tr key={index}>
                    <td className="medicine-name-cell">{item.name}</td>
                    <td>{item.currentStock}</td>
                    <td>{item.minimumStock}</td>
                    <td>
                      <span className={`status-badge ${item.status === 'In Stock' ? 'in-stock' : 'low-stock'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Information */}
        <div className="report-section info-section">
          <div className="section-header">
            <div className="section-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="section-title">Report Information</h2>
          </div>
          <div className="info-list">
            <div className="info-item">
              <span className="info-label">Report Type</span>
              <span className="info-value">Compliance Report</span>
            </div>
            <div className="info-item">
              <span className="info-label">Report Period</span>
              <span className="info-value">01 June 2026 - 30 June 2026</span>
            </div>
            <div className="info-item">
              <span className="info-label">Generated On</span>
              <span className="info-value">20 June 2026, 01:10 PM</span>
            </div>
            <div className="info-item">
              <span className="info-label">Generated By</span>
              <span className="info-value">System</span>
            </div>
            <div className="info-item">
              <span className="info-label">Status</span>
              <span className="info-value">
                <span className="status-badge completed">Completed</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="back-button-section">
        <button className="back-button" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Back to Reports</span>
        </button>
      </div>
    </div>
  );
};

export default UserViewRep;
import { useState, useMemo } from "react";
import { Pill, Plus, Search, Clock, CheckCircle2, XCircle, CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import AddMedicineModal from "../../Component/UserAddMed";

import "./UserManage.css";

const ITEMS_PER_PAGE = 3;

const UserManage = ({ medicines, onAddMedicine }) => {
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMedicines = useMemo(() => {
    if (!medicines) return [];
    if (!searchTerm.trim()) return medicines;
    const term = searchTerm.toLowerCase();
    return medicines.filter(
      (med) =>
        med.medicineName.toLowerCase().includes(term) ||
        med.dosage.toLowerCase().includes(term) ||
        med.frequency.toLowerCase().includes(term)
    );
  }, [medicines, searchTerm]);

  const totalPages = useMemo(() => {
    if (!filteredMedicines) return 0;
    return Math.max(1, Math.ceil(filteredMedicines.length / ITEMS_PER_PAGE));
  }, [filteredMedicines]);

  const paginatedMedicines = useMemo(() => {
    if (!filteredMedicines) return [];
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMedicines.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMedicines, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleAddMedicine = () => {
    setShowAddMedicineModal(true);
  };

  const handleCloseMedicineModal = (medicineData) => {
    setShowAddMedicineModal(false);

    if (medicineData && onAddMedicine) {
      onAddMedicine(medicineData);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 3;
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const getStatusBadgeClass = (status) => {
    if (status === "missed") return "missed";
    if (status === "upcoming") return "upcoming";
    return "taken";
  };

  const getStatusIcon = (status) => {
    if (status === "missed") return <><XCircle size={14} /> Missed</>;
    if (status === "upcoming") return <><CalendarClock size={14} /> Upcoming</>;
    return <><CheckCircle2 size={14} /> Taken</>;
  };

  return (
    <>
      {showAddMedicineModal && (
        <AddMedicineModal onClose={handleCloseMedicineModal} />
      )}

      <div className="dashboard-card active-card user-manage-card">
        <div className="card-header user-manage-header">
          <div className="header-title">
            <Pill />
            My Medicine
          </div>

          <div className="medicine-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search medicine..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {medicines && medicines.length === 0 ? (
          <div className="empty-card">
            <Pill size={60} />
            <h4>No medicine added yet</h4>
            <p>Add your medicine to see your medicine list</p>
            <button onClick={handleAddMedicine}>
              <Plus size={24} />
              Add Your First Medicine
            </button>
          </div>
        ) : (
          <div className="medicine-list medicine-list--my-medicine">
            <div className="medicine-table-header">
              <span className="medicine-col medicine-name-col">Medicine</span>
              <span className="medicine-col medicine-dosage-col">Dosage</span>
              <span className="medicine-col medicine-time-col">Timing</span>
              <span className="medicine-col medicine-frequency-col">Frequency</span>
              <span className="medicine-col medicine-status-col">Status</span>
            </div>

            <div className="medicine-count-info">
              Showing {paginatedMedicines.length} of {filteredMedicines.length} medicines
            </div>

            <div className="medicine-items-wrapper">
              {paginatedMedicines.length > 0 ? (
                paginatedMedicines.map((medicine) => (
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
                      <span className={`status-badge ${getStatusBadgeClass(medicine.status)}`}>
                        {getStatusIcon(medicine.status)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results-found">
                  <Search size={28} />
                  <p>No medicine found matching "{searchTerm}"</p>
                </div>
              )}
            </div>

            <div className="user-manage-footer">
              <button className="add-more-btn" onClick={handleAddMedicine}>
                <Plus size={24} />
                Add More Medicine
              </button>

              {totalPages > 1 && (
                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      className={`pagination-btn ${page === currentPage ? "active" : ""}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserManage;


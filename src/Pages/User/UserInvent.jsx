import { useMemo, useState } from "react";
import { Package, Plus, Edit2, Save, X, ChevronLeft, ChevronRight, Search, ArrowUp, ArrowDown } from "lucide-react";
import "./UserInvent.css";

const StatusBadge = ({ status }) => {
  const className =
    status === "In Stock"
      ? "status-badge in-stock"
      : status === "Low Stock"
      ? "status-badge low-stock"
      : "status-badge out-of-stock";

  return <span className={className}>{status}</span>;
};

const UserInvent = () => {
  const [rows, setRows] = useState([
    { id: 1, medicineName: "Paracetamol", currentStock: 120, minimumStock: 50, expiryDate: "2027-03-10" },
    { id: 2, medicineName: "Amoxicillin", currentStock: 18, minimumStock: 30, expiryDate: "2026-10-22" },
    { id: 3, medicineName: "Cetrizine", currentStock: 0, minimumStock: 10, expiryDate: "2026-08-01" },
    { id: 4, medicineName: "Ibuprofen", currentStock: 200, minimumStock: 40, expiryDate: "2027-06-15" },
    { id: 5, medicineName: "Omeprazole", currentStock: 5, minimumStock: 20, expiryDate: "2026-12-01" },
    { id: 6, medicineName: "Loratadine", currentStock: 60, minimumStock: 15, expiryDate: "2027-01-20" },
    { id: 7, medicineName: "Metformin", currentStock: 90, minimumStock: 25, expiryDate: "2026-09-30" },
    { id: 8, medicineName: "Aspirin", currentStock: 0, minimumStock: 10, expiryDate: "2026-11-05" }
  ]);

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({
    medicineName: "", currentStock: "", minimumStock: "", expiryDate: ""
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const getStatus = (r) => {
    if (Number(r.currentStock) <= 0) return "Out of Stock";
    if (Number(r.currentStock) < Number(r.minimumStock)) return "Low Stock";
    return "In Stock";
  };

  const statusOrder = { "In Stock": 1, "Low Stock": 2, "Out of Stock": 3 };

  const derived = useMemo(() => rows.map((r) => ({ ...r, status: getStatus(r) })), [rows]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return derived;
    const query = searchQuery.toLowerCase().trim();
    return derived.filter((r) =>
      r.medicineName.toLowerCase().includes(query)
    );
  }, [derived, searchQuery]);

  const sortedRows = useMemo(() => {
    if (!sortConfig.key) return filteredRows;
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case "medicineName":
          aVal = a.medicineName.toLowerCase();
          bVal = b.medicineName.toLowerCase();
          break;
        case "currentStock":
          aVal = Number(a.currentStock);
          bVal = Number(b.currentStock);
          break;
        case "minimumStock":
          aVal = Number(a.minimumStock);
          bVal = Number(b.minimumStock);
          break;
        case "expiryDate":
          aVal = a.expiryDate;
          bVal = b.expiryDate;
          break;
        case "status":
          aVal = statusOrder[a.status] || 99;
          bVal = statusOrder[b.status] || 99;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredRows, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sortedRows.length);
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (newValue) => {
    setItemsPerPage(newValue);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 2) end = Math.min(4, totalPages - 1);
      if (currentPage >= totalPages - 1) start = Math.max(totalPages - 3, 2);
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const chartCounts = useMemo(() => {
    let inStockCount = 0, lowStockCount = 0, outStockCount = 0;
    for (const r of derived) {
      if (r.status === "In Stock") inStockCount++;
      else if (r.status === "Low Stock") lowStockCount++;
      else outStockCount++;
    }
    const maxCount = Math.max(inStockCount, lowStockCount, outStockCount, 1);
    const clampHeight = (count) => {
      const min = 18, max = 240;
      return maxCount <= 0 ? min : Math.max(min, (count / maxCount) * max);
    };
    return { inStockCount, lowStockCount, outStockCount, maxCount,
      inStockH: clampHeight(inStockCount), lowStockH: clampHeight(lowStockCount), outStockH: clampHeight(outStockCount) };
  }, [derived]);

  const startEdit = (r) => {
    setEditingId(r.id);
    setEditDraft({ medicineName: r.medicineName, currentStock: r.currentStock, minimumStock: r.minimumStock, expiryDate: r.expiryDate });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ medicineName: "", currentStock: "", minimumStock: "", expiryDate: "" });
  };

  const saveEdit = () => {
    if (editingId == null) return;
    setRows((prev) => prev.map((r) => r.id === editingId ? { ...r, ...editDraft } : r));
    cancelEdit();
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <div className="header-left">
          <Package size={24} />
          <h1>Inventory Management</h1>
        </div>
        <div className="header-right">
          <button className="add-medicine-btn">
            <Plus size={20} />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      <div className="inventory-table-wrapper">
        <div className="inventory-table-header">
          <div className="sort-controls-container">
            <div className="sort-dropdown-wrapper">
              <label className="sort-label">Sort by:</label>
              <select
                className="sort-select"
                value={sortConfig.key || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    handleSort(val);
                  } else {
                    setSortConfig({ key: null, direction: "asc" });
                    setCurrentPage(1);
                  }
                }}
              >
                <option value="">None</option>
                <option value="medicineName">Medicine Name</option>
                <option value="currentStock">Current Stock</option>
                <option value="minimumStock">Minimum Stock</option>
                <option value="expiryDate">Expiry Date</option>
                <option value="status">Status</option>
              </select>
            </div>
            {sortConfig.key && (
              <button
                className="sort-direction-btn"
                onClick={() => {
                  setSortConfig((prev) => ({
                    ...prev,
                    direction: prev.direction === "asc" ? "desc" : "asc"
                  }));
                  setCurrentPage(1);
                }}
                aria-label={`Sort ${sortConfig.direction === "asc" ? "descending" : "ascending"}`}
              >
                {sortConfig.direction === "asc" ? (
                  <ArrowUp size={18} />
                ) : (
                  <ArrowDown size={18} />
                )}
                <span>{sortConfig.direction === "asc" ? "Asc" : "Desc"}</span>
              </button>
            )}
          </div>
          <div className="search-bar-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by medicine name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => { setSearchQuery(""); setCurrentPage(1); }} aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Current Stock</th>
              <th>Minimum Stock</th>
              <th>Expiry</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((r) => {
              const isEditing = editingId === r.id;
              return (
                <tr key={r.id} className={isEditing ? "editing-row" : ""}>
                  <td data-label="Medicine">
                    <div className="medicine-name">
                      <div className="medicine-icon" aria-hidden><span className="medicine-emoji">{String.fromCodePoint(0x1F48A)}</span></div>
                      {isEditing ? (
                        <input className="edit-input" value={editDraft.medicineName} onChange={(e) => setEditDraft((p) => ({ ...p, medicineName: e.target.value }))} />
                      ) : <span>{r.medicineName}</span>}
                    </div>
                  </td>
                  <td data-label="Current Stock">
                    {isEditing ? (
                      <input className="edit-input" type="number" value={editDraft.currentStock} onChange={(e) => setEditDraft((p) => ({ ...p, currentStock: e.target.value }))} />
                    ) : r.currentStock}
                  </td>
                  <td data-label="Minimum Stock">
                    {isEditing ? (
                      <input className="edit-input" type="number" value={editDraft.minimumStock} onChange={(e) => setEditDraft((p) => ({ ...p, minimumStock: e.target.value }))} />
                    ) : r.minimumStock}
                  </td>
                  <td data-label="Expiry">
                    {isEditing ? (
                      <input className="edit-input" type="date" value={editDraft.expiryDate} onChange={(e) => setEditDraft((p) => ({ ...p, expiryDate: e.target.value }))} />
                    ) : r.expiryDate}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={getStatus({ currentStock: isEditing ? editDraft.currentStock : r.currentStock, minimumStock: isEditing ? editDraft.minimumStock : r.minimumStock })} />
                  </td>
                  <td data-label="Action">
                    {isEditing ? (
                      <div className="edit-actions">
                        <button type="button" className="save-btn" onClick={saveEdit} aria-label="Save"><Save size={18} /></button>
                        <button type="button" className="cancel-btn" onClick={cancelEdit} aria-label="Cancel"><X size={18} /></button>
                      </div>
                    ) : <button type="button" className="edit-btn" onClick={() => startEdit(r)} aria-label="Edit"><Edit2 size={20} /></button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredRows.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              <span className="pagination-showing">Showing {startIndex + 1} to {endIndex} of {sortedRows.length} {sortedRows.length !== derived.length ? `(filtered from ${derived.length} total)` : ""} entries</span>
              <div className="pagination-per-page">
                <label htmlFor="itemsPerPage">Per page:</label>
                <select id="itemsPerPage" className="pagination-select" value={itemsPerPage} onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>
            <div className="pagination-controls">
              <button className="page-nav-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Previous page">
                <ChevronLeft size={18} />
              </button>
              {getPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span key={'ellipsis-' + idx} className="page-ellipsis">...</span>
                ) : (
                  <button key={page} className={'page-btn ' + (currentPage === page ? "active" : "")} onClick={() => setCurrentPage(page)}>{page}</button>
                )
              )}
              <button className="page-nav-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} aria-label="Next page">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="stock-status-section">
        <h2 className="stock-status-title">Stock Status Overview</h2>
        <div className="title-underline-small" />
        <div className="chart-container">
          <div className="chart-legend" aria-label="Stock status legend">
            <div className="legend-item"><span className="legend-color in-stock" aria-hidden /><span>In Stock</span></div>
            <div className="legend-item"><span className="legend-color low-stock" aria-hidden /><span>Low Stock</span></div>
            <div className="legend-item"><span className="legend-color out-of-stock" aria-hidden /><span>Out of Stock</span></div>
          </div>
          <div className="bar-chart" aria-label="Stock status chart">
            <div className="y-axis" aria-hidden>
              <span>{Math.ceil(chartCounts.maxCount / 3)}</span>
              <span>{Math.ceil((chartCounts.maxCount * 2) / 3)}</span>
              <span>{chartCounts.maxCount}</span>
            </div>
            <div className="chart-bars">
              <div className="bar-group">
                <div className="bar" style={{ height: chartCounts.inStockH + 'px', background: "linear-gradient(180deg, #7ec8c8 0%, #14a098 100%)" }} />
                <div className="bar-label">In Stock ({chartCounts.inStockCount})</div>
              </div>
              <div className="bar-group">
                <div className="bar" style={{ height: chartCounts.lowStockH + 'px', background: "linear-gradient(180deg, #f4e7a6 0%, #f4d58d 100%)" }} />
                <div className="bar-label">Low Stock ({chartCounts.lowStockCount})</div>
              </div>
              <div className="bar-group">
                <div className="bar" style={{ height: chartCounts.outStockH + 'px', background: "linear-gradient(180deg, #f9c2ba 0%, #f5b7b1 100%)" }} />
                <div className="bar-label">Out of Stock ({chartCounts.outStockCount})</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInvent;

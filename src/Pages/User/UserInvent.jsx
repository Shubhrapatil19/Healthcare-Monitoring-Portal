import { useEffect, useMemo, useState } from "react";
import { Package, Plus, Edit2, Save, X, ChevronLeft, ChevronRight, Search, ArrowUp, ArrowDown, Trash2, Loader2 } from "lucide-react";
import { getInventory, updateStock, deleteStock } from "../../api/MockApi";
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

const normalizeInventoryItem = (item) => {
  if (!item || typeof item !== "object") return null;

  const id = item.id ?? item._id ?? item.medicineId ?? item.medicine_id ?? item.stockId ?? item.stock_id ?? item.inventoryId ?? item.inventory_id;
  const medicineName = item.medicineName ?? item.name ?? item.medicine?.name ?? "";
  const currentStock = item.currentStock ?? item.stock ?? item.current_stock ?? 0;
  const minimumStock = item.minimumStock ?? item.minStock ?? item.minimum_stock ?? 0;
  const expiryDate = item.expiryDate ?? item.expiry ?? item.expiry_date ?? "";

  return {
    ...item,
    id,
    medicineName,
    currentStock,
    minimumStock,
    expiryDate,
  };
};

const extractInventoryList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.stockItems)) return payload.stockItems;
  if (Array.isArray(payload?.inventory)) return payload.inventory;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;

  if (payload?.stockItem) return [payload.stockItem];
  if (payload?.data && typeof payload.data === "object") {
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data.stockItem) return [payload.data.stockItem];
    if (Array.isArray(payload.data.inventory)) return payload.data.inventory;
    if (Array.isArray(payload.data.items)) return payload.data.items;
  }

  return [];
};

const UserInvent = ({ stockItems = [], onAddStock, onUpdateStock, onDeleteStock }) => {
  const [inventoryRows, setInventoryRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const normalizedPropRows = useMemo(() => {
    return (Array.isArray(stockItems) ? stockItems : [])
      .map(normalizeInventoryItem)
      .filter(Boolean);
  }, [stockItems]);

  const rows = useMemo(() => {
    const hasFetchedRows = inventoryRows.length > 0;
    const sourceRows = hasFetchedRows ? inventoryRows : normalizedPropRows;

    const shouldUsePropRows = normalizedPropRows.length > 0 && (
      !hasFetchedRows ||
      normalizedPropRows.length !== sourceRows.length ||
      normalizedPropRows.some((row, index) => {
        const current = sourceRows[index];
        return !current ||
          String(current.id ?? "") !== String(row.id ?? "") ||
          String(current.medicineName ?? "") !== String(row.medicineName ?? "") ||
          Number(current.currentStock ?? 0) !== Number(row.currentStock ?? 0) ||
          Number(current.minimumStock ?? 0) !== Number(row.minimumStock ?? 0) ||
          String(current.expiryDate ?? "") !== String(row.expiryDate ?? "");
      })
    );

    const finalRows = shouldUsePropRows ? normalizedPropRows : sourceRows;
    return finalRows.filter((r) => r && typeof r.medicineName === "string");
  }, [inventoryRows, normalizedPropRows]);

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({
    medicineName: "", currentStock: "", minimumStock: "", expiryDate: ""
  });
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [rowError, setRowError] = useState({ id: null, message: "" });

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const response = await getInventory();
        const normalized = extractInventoryList(response.data)
          .map(normalizeInventoryItem)
          .filter(Boolean);

        setInventoryRows(normalized);
      } catch (err) {
        console.error("Inventory fetch failed:", err);
        setLoadError(err.response?.data?.message || "Failed to load inventory.");
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const getStatus = (r) => {
    if (Number(r.currentStock) <= 0) return "Out of Stock";
    if (Number(r.currentStock) < Number(r.minimumStock)) return "Low Stock";
    return "In Stock";
  };

  const derived = useMemo(() => rows.map((r) => ({ ...r, status: getStatus(r) })), [rows]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return derived;
    const query = searchQuery.toLowerCase().trim();
    return derived.filter((r) =>
      r.medicineName.toLowerCase().includes(query)
    );
  }, [derived, searchQuery]);

  const sortedRows = useMemo(() => {
    const statusOrder = { "In Stock": 1, "Low Stock": 2, "Out of Stock": 3 };
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

  const chartTicks = useMemo(() => {
    const max = chartCounts.maxCount;
    const middle = Math.floor(max / 2);
    return Array.from(new Set([max, middle, 0]));
  }, [chartCounts.maxCount]);

  const startEdit = (r) => {
    setRowError({ id: null, message: "" });
    setEditingId(r.id);
    setEditDraft({ medicineName: r.medicineName, currentStock: r.currentStock, minimumStock: r.minimumStock, expiryDate: r.expiryDate });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setRowError({ id: null, message: "" });
    setEditDraft({ medicineName: "", currentStock: "", minimumStock: "", expiryDate: "" });
  };

  const saveEdit = async () => {
    if (editingId == null) return;
    setSavingId(editingId);
    setRowError({ id: null, message: "" });
    try {
      const payload = {
        medicineName: editDraft.medicineName,
        currentStock: Number(editDraft.currentStock),
        minimumStock: Number(editDraft.minimumStock),
        expiryDate: editDraft.expiryDate,
      };

      const response = await updateStock(editingId, payload);
      const savedItem = normalizeInventoryItem(
        response.data?.stockItem || response.data || {
          ...rows.find((item) => String(item.id) === String(editingId)),
          ...payload,
        }
      );

      const updatedItem = {
        ...(rows.find((item) => String(item.id) === String(editingId)) || {}),
        ...(savedItem || {}),
        id: editingId,
        medicineName: String(payload.medicineName || savedItem?.medicineName || ""),
        currentStock: Number(payload.currentStock),
        minimumStock: Number(payload.minimumStock),
        expiryDate: payload.expiryDate,
      };

      setInventoryRows((prev) =>
        prev.map((item) => (String(item.id) === String(editingId) ? updatedItem : item))
      );
      onUpdateStock && onUpdateStock(editingId, updatedItem);
      cancelEdit();
    } catch (err) {
      setRowError({ id: editingId, message: err.response?.data?.message || "Failed to save changes" });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setRowError({ id: null, message: "" });
    try {
      await deleteStock(id);
      setInventoryRows((prev) => prev.filter((item) => String(item.id) !== String(id)));
      onDeleteStock && onDeleteStock(id);
    } catch (err) {
      setRowError({ id, message: err.response?.data?.message || "Failed to delete item" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <div className="header-left">
          <Package size={24} />
          <h1>Inventory Management</h1>
        </div>
        <div className="header-right">
          <button className="add-medicine-btn" onClick={onAddStock}>
            <Plus size={20} />
            <span>Add Stock</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="row-error-text" style={{ marginBottom: "1rem" }}>{loadError}</div>
      )}

      {rows.length === 0 && !loading ? (
        <div className="inventory-empty">
          <div className="empty-icon-wrapper">
            <Package size={60} />
          </div>
          <h3>No stock items added yet</h3>
          <p>Click "Add Medicine" button to add your first stock item.</p>
          <div className="corner-deco tl" />
          <div className="corner-deco br" />
        </div>
      ) : loading && rows.length === 0 ? (
        <div className="inventory-empty">
          <div className="empty-icon-wrapper">
            <Loader2 size={60} className="spin" />
          </div>
          <h3>Loading inventory…</h3>
          <p>Please wait while we fetch your stock items.</p>
        </div>
      ) : (
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
                const isSaving = savingId === r.id;
                const isDeleting = deletingId === r.id;
                const hasError = rowError.id === r.id;
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
                          <button type="button" className="save-btn" onClick={saveEdit} disabled={isSaving} aria-label="Save">
                            {isSaving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                          </button>
                          <button type="button" className="cancel-btn" onClick={cancelEdit} disabled={isSaving} aria-label="Cancel"><X size={18} /></button>
                        </div>
                      ) : (
                        <div className="edit-actions">
                          <button type="button" className="edit-btn" onClick={() => startEdit(r)} aria-label="Edit"><Edit2 size={20} /></button>
                          <button type="button" className="delete-btn" onClick={() => handleDelete(r.id)} disabled={isDeleting} aria-label="Delete">
                            {isDeleting ? <Loader2 size={18} className="spin" /> : <Trash2 size={18} />}
                          </button>
                        </div>
                      )}
                      {hasError && <div className="row-error-text">{rowError.message}</div>}
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
      )}

      {rows.length > 0 && (
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
                {chartTicks.map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
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
      )}
    </div>
  );
};

export default UserInvent;

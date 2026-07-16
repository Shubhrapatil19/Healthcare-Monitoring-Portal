import { useMemo, useState } from "react";
import { Package, Plus, Edit2, Save, X } from "lucide-react";
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
    {
      id: 1,
      medicineName: "Paracetamol",
      currentStock: 120,
      minimumStock: 50,
      expiryDate: "2027-03-10"
    },
    {
      id: 2,
      medicineName: "Amoxicillin",
      currentStock: 18,
      minimumStock: 30,
      expiryDate: "2026-10-22"
    },
    {
      id: 3,
      medicineName: "Cetrizine",
      currentStock: 0,
      minimumStock: 10,
      expiryDate: "2026-08-01"
    }
  ]);

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({
    medicineName: "",
    currentStock: "",
    minimumStock: "",
    expiryDate: ""
  });

  const getStatus = (r) => {
    if (Number(r.currentStock) <= 0) return "Out of Stock";
    if (Number(r.currentStock) < Number(r.minimumStock)) return "Low Stock";
    return "In Stock";
  };

  const derived = useMemo(() => rows.map((r) => ({ ...r, status: getStatus(r) })), [rows]);

  const chartCounts = useMemo(() => {
    let inStockCount = 0;
    let lowStockCount = 0;
    let outStockCount = 0;

    for (const r of derived) {
      if (r.status === "In Stock") inStockCount += 1;
      else if (r.status === "Low Stock") lowStockCount += 1;
      else outStockCount += 1;
    }

    const maxCount = Math.max(inStockCount, lowStockCount, outStockCount, 1);

    const clampHeight = (count) => {
      const min = 18;
      const max = 240;
      if (maxCount <= 0) return min;
      const h = (count / maxCount) * max;
      return Math.max(min, h);
    };

    return {
      inStockCount,
      lowStockCount,
      outStockCount,
      maxCount,
      inStockH: clampHeight(inStockCount),
      lowStockH: clampHeight(lowStockCount),
      outStockH: clampHeight(outStockCount)
    };
  }, [derived]);

  const startEdit = (r) => {
    setEditingId(r.id);
    setEditDraft({
      medicineName: r.medicineName,
      currentStock: r.currentStock,
      minimumStock: r.minimumStock,
      expiryDate: r.expiryDate
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({
      medicineName: "",
      currentStock: "",
      minimumStock: "",
      expiryDate: ""
    });
  };

  const saveEdit = () => {
    if (editingId == null) return;

    setRows((prev) =>
      prev.map((r) =>
        r.id === editingId
          ? {
              ...r,
              medicineName: editDraft.medicineName,
              currentStock: editDraft.currentStock,
              minimumStock: editDraft.minimumStock,
              expiryDate: editDraft.expiryDate
            }
          : r
      )
    );

    cancelEdit();
  };

  const stockChart = (
    <div className="stock-status-section">
      <h2 className="stock-status-title">Stock Status Overview</h2>
      <div className="title-underline-small" />

      <div className="chart-container">
        <div className="chart-legend" aria-label="Stock status legend">
          <div className="legend-item">
            <span className="legend-color in-stock" aria-hidden />
            <span>In Stock</span>
          </div>
          <div className="legend-item">
            <span className="legend-color low-stock" aria-hidden />
            <span>Low Stock</span>
          </div>
          <div className="legend-item">
            <span className="legend-color out-of-stock" aria-hidden />
            <span>Out of Stock</span>
          </div>
        </div>

        <div className="bar-chart" aria-label="Stock status chart">
          <div className="y-axis" aria-hidden>
            <span>{Math.ceil(chartCounts.maxCount / 3)}</span>
            <span>{Math.ceil((chartCounts.maxCount * 2) / 3)}</span>
            <span>{chartCounts.maxCount}</span>
          </div>

          <div className="chart-bars">
            <div className="bar-group">
              <div
                className="bar"
                style={{ height: `${chartCounts.inStockH}px`, background: "linear-gradient(180deg, #7ec8c8 0%, #14a098 100%)" }}
              />
              <div className="bar-label">In Stock ({chartCounts.inStockCount})</div>
            </div>

            <div className="bar-group">
              <div
                className="bar"
                style={{ height: `${chartCounts.lowStockH}px`, background: "linear-gradient(180deg, #f4e7a6 0%, #f4d58d 100%)" }}
              />
              <div className="bar-label">Low Stock ({chartCounts.lowStockCount})</div>
            </div>

            <div className="bar-group">
              <div
                className="bar"
                style={{ height: `${chartCounts.outStockH}px`, background: "linear-gradient(180deg, #f9c2ba 0%, #f5b7b1 100%)" }}
              />
              <div className="bar-label">Out of Stock ({chartCounts.outStockCount})</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <div className="header-left">
          <div className="logo-icon" aria-hidden>
            <Package />
          </div>
          <div>
            <h1 className="inventory-title">Medicine Inventory</h1>
          </div>
        </div>

        <button
          className="add-stock-btn"
          type="button"
          onClick={() => alert("Add Stock UI not implemented yet.")}
        >
          <Plus size={18} /> Add Stock
        </button>
      </div>

      <div className="inventory-table-wrapper">
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
            {derived.map((r) => {
              const isEditing = editingId === r.id;

              return (
                <tr key={r.id} className={isEditing ? "editing-row" : ""}>
                  <td data-label="Medicine">
                    <div className="medicine-name">
                      <div className="medicine-icon" aria-hidden>
                        <span className="medicine-emoji">💊</span>
                      </div>

                      {isEditing ? (
                        <input
                          className="edit-input"
                          value={editDraft.medicineName}
                          onChange={(e) =>
                            setEditDraft((p) => ({ ...p, medicineName: e.target.value }))
                          }
                        />
                      ) : (
                        <span>{r.medicineName}</span>
                      )}
                    </div>
                  </td>

                  <td data-label="Current Stock">
                    {isEditing ? (
                      <input
                        className="edit-input"
                        type="number"
                        value={editDraft.currentStock}
                        onChange={(e) =>
                          setEditDraft((p) => ({ ...p, currentStock: e.target.value }))
                        }
                      />
                    ) : (
                      r.currentStock
                    )}
                  </td>

                  <td data-label="Minimum Stock">
                    {isEditing ? (
                      <input
                        className="edit-input"
                        type="number"
                        value={editDraft.minimumStock}
                        onChange={(e) =>
                          setEditDraft((p) => ({ ...p, minimumStock: e.target.value }))
                        }
                      />
                    ) : (
                      r.minimumStock
                    )}
                  </td>

                  <td data-label="Expiry">
                    {isEditing ? (
                      <input
                        className="edit-input"
                        type="date"
                        value={editDraft.expiryDate}
                        onChange={(e) =>
                          setEditDraft((p) => ({ ...p, expiryDate: e.target.value }))
                        }
                      />
                    ) : (
                      r.expiryDate
                    )}
                  </td>

                  <td data-label="Status">
                    <StatusBadge
                      status={getStatus({
                        currentStock: isEditing ? editDraft.currentStock : r.currentStock,
                        minimumStock: isEditing ? editDraft.minimumStock : r.minimumStock
                      })}
                    />
                  </td>

                  <td data-label="Action">
                    {isEditing ? (
                      <div className="edit-actions">
                        <button type="button" className="save-btn" onClick={saveEdit} aria-label="Save">
                          <Save size={18} />
                        </button>
                        <button type="button" className="cancel-btn" onClick={cancelEdit} aria-label="Cancel">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button type="button" className="edit-btn" onClick={() => startEdit(r)} aria-label="Edit">
                        <Edit2 size={20} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {stockChart}
    </div>
  );
};

export default UserInvent;


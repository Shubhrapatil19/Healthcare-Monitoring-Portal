import {
  useEffect,
  useMemo,
  useState,
} from "react";

import toast from "react-hot-toast";

import {
  Package,
  Plus,
  Edit2,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUp,
  ArrowDown,
  Trash2,
  Loader2,
} from "lucide-react";

import api from "../../api/axiosInstance";

import "./UserInvent.css";

// =========================================================
// STATUS BADGE
// =========================================================

const StatusBadge = ({ status }) => {
  const className =
    status === "In Stock"
      ? "status-badge in-stock"
      : status === "Low Stock"
        ? "status-badge low-stock"
        : "status-badge out-of-stock";

  return (
    <span className={className}>
      {status}
    </span>
  );
};

// =========================================================
// NORMALIZE INVENTORY ITEM
// =========================================================

const normalizeInventoryItem = (item) => {
  if (
    !item ||
    typeof item !== "object"
  ) {
    return null;
  }

  const id =
    item.id ??
    item._id ??
    item.inventoryId ??
    item.inventory_id;

  const medicineId =
    item.medicineId ??
    item.medicine_id;

  const medicineName =
    item.medicineName ??
    item.name ??
    item.medicine?.medicineName ??
    item.medicine?.name ??
    "";

  const currentStock =
    item.currentStock ??
    item.stock ??
    item.current_stock ??
    0;

  const minimumStock =
    item.minimumStock ??
    item.minStock ??
    item.minimum_stock ??
    0;

  const expiryDate =
    item.expiryDate ??
    item.expiry ??
    item.expiry_date ??
    "";

  const stockStatus =
    item.stockStatus ??
    item.status ??
    "";

  return {
    ...item,

    id,
    medicineId,
    medicineName,

    currentStock:
      Number(currentStock),

    minimumStock:
      Number(minimumStock),

    expiryDate,
    stockStatus,
  };
};

// =========================================================
// EXTRACT INVENTORY LIST
// =========================================================

const extractInventoryList = (
  payload
) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    Array.isArray(
      payload?.inventory
    )
  ) {
    return payload.inventory;
  }

  if (
    Array.isArray(
      payload?.stockItems
    )
  ) {
    return payload.stockItems;
  }

  if (
    Array.isArray(
      payload?.items
    )
  ) {
    return payload.items;
  }

  if (
    Array.isArray(
      payload?.data
    )
  ) {
    return payload.data;
  }

  if (
    Array.isArray(
      payload?.content
    )
  ) {
    return payload.content;
  }

  return [];
};

// =========================================================
// NORMALIZE STATUS OVERVIEW
//
// Swagger shows a Map-like object for:
// GET /api/inventory/status-overview
//
// Expected backend keys can be:
// IN_STOCK / LOW_STOCK / OUT_OF_STOCK
// or readable variants.
//
// If backend returns different/unknown keys, UI safely
// falls back to counts calculated from inventory rows.
// =========================================================

const normalizeStatusOverview = (payload) => {
  const source =
    payload?.data &&
    !Array.isArray(payload.data) &&
    typeof payload.data === "object"
      ? payload.data
      : payload;

  if (
    !source ||
    Array.isArray(source) ||
    typeof source !== "object"
  ) {
    return null;
  }

  const readCount = (...keys) => {
    for (const key of keys) {
      if (
        Object.prototype.hasOwnProperty.call(
          source,
          key
        )
      ) {
        const value = Number(source[key]);

        if (!Number.isNaN(value)) {
          return value;
        }
      }
    }

    return null;
  };

  const inStock = readCount(
    "IN_STOCK",
    "inStock",
    "in_stock",
    "In Stock"
  );

  const lowStock = readCount(
    "LOW_STOCK",
    "lowStock",
    "low_stock",
    "Low Stock"
  );

  const outOfStock = readCount(
    "OUT_OF_STOCK",
    "outOfStock",
    "out_of_stock",
    "Out of Stock"
  );

  if (
    inStock == null &&
    lowStock == null &&
    outOfStock == null
  ) {
    return null;
  }

  return {
    inStockCount: inStock ?? 0,
    lowStockCount: lowStock ?? 0,
    outStockCount: outOfStock ?? 0,
  };
};

// =========================================================
// COMPONENT
// =========================================================

const UserInvent = ({
  onAddStock,
}) => {
  // =======================================================
  // INVENTORY
  // =======================================================

  const [
    inventoryRows,
    setInventoryRows,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  // =======================================================
  // STATUS OVERVIEW
  //
  // GET /api/inventory/status-overview
  // =======================================================

  const [
    statusOverview,
    setStatusOverview,
  ] = useState(null);

  // =======================================================
  // EDIT
  // =======================================================

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    editDraft,
    setEditDraft,
  ] = useState({
    currentStock: "",
    minimumStock: "",
    expiryDate: "",
  });

  const [
    savingId,
    setSavingId,
  ] = useState(null);

  // =======================================================
  // DELETE
  // =======================================================

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  // =======================================================
  // ROW ERROR
  // =======================================================

  const [
    rowError,
    setRowError,
  ] = useState({
    id: null,
    message: "",
  });

  // =======================================================
  // SEARCH
  // =======================================================

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  // =======================================================
  // PAGINATION
  // =======================================================

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    itemsPerPage,
    setItemsPerPage,
  ] = useState(5);

  // =======================================================
  // SORT
  // =======================================================

  const [
    sortConfig,
    setSortConfig,
  ] = useState({
    key: null,
    direction: "asc",
  });

  // =======================================================
  // GET INVENTORY + STATUS OVERVIEW
  //
  // GET /api/inventory
  // GET /api/inventory/status-overview
  // =======================================================

  useEffect(() => {
    let cancelled = false;

    const loadInventory = async () => {
      try {
        const [
          inventoryResponse,
          overviewResponse,
        ] = await Promise.all([
          api.get("/api/inventory"),

          api.get(
            "/api/inventory/status-overview"
          ),
        ]);

        const normalized =
          extractInventoryList(
            inventoryResponse.data
          )
            .map(
              normalizeInventoryItem
            )
            .filter(Boolean);

        const overview =
          normalizeStatusOverview(
            overviewResponse.data
          );

        if (!cancelled) {
          setInventoryRows(
            normalized
          );

          setStatusOverview(
            overview
          );

          setLoadError("");
        }
      } catch (error) {
        console.error(
          "Inventory fetch failed:",
          error?.response?.data ||
            error.message
        );

        if (!cancelled) {
          const message =
            error?.response?.data
              ?.message ||
            "Failed to load inventory.";

          setLoadError(
            message
          );

          toast.error(
            message
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInventory();

    return () => {
      cancelled = true;
    };
  }, []);

  // =======================================================
  // REFRESH STATUS OVERVIEW
  //
  // Called after PUT / DELETE so chart stays in sync.
  // =======================================================

  const refreshStatusOverview =
    async () => {
      try {
        const response =
          await api.get(
            "/api/inventory/status-overview"
          );

        setStatusOverview(
          normalizeStatusOverview(
            response.data
          )
        );
      } catch (error) {
        console.error(
          "Status overview fetch failed:",
          error?.response?.data ||
            error.message
        );

        // Do not break inventory page.
        // Chart will use fallback counts from rows.
        setStatusOverview(
          null
        );
      }
    };

  // =======================================================
  // ROWS
  // =======================================================

  const rows = useMemo(
    () =>
      inventoryRows.filter(
        (item) =>
          item &&
          typeof item.medicineName ===
            "string"
      ),
    [inventoryRows]
  );

  // =======================================================
  // STOCK STATUS
  //
  // Backend:
  // IN_STOCK
  // LOW_STOCK
  // OUT_OF_STOCK
  //
  // Fallback:
  // calculate from currentStock/minimumStock
  // =======================================================

  const getStatus = (row) => {
    switch (
      row?.stockStatus
    ) {
      case "IN_STOCK":
        return "In Stock";

      case "LOW_STOCK":
        return "Low Stock";

      case "OUT_OF_STOCK":
        return "Out of Stock";

      default:
        break;
    }

    const currentStock =
      Number(
        row?.currentStock ?? 0
      );

    const minimumStock =
      Number(
        row?.minimumStock ?? 0
      );

    if (
      currentStock <= 0
    ) {
      return "Out of Stock";
    }

    if (
      currentStock <=
      minimumStock
    ) {
      return "Low Stock";
    }

    return "In Stock";
  };

  // =======================================================
  // DERIVED ROWS
  // =======================================================

  const derived =
    useMemo(
      () =>
        rows.map(
          (row) => ({
            ...row,

            status:
              getStatus(
                row
              ),
          })
        ),
      [rows]
    );

  // =======================================================
  // SEARCH
  // =======================================================

  const filteredRows =
    useMemo(() => {
      if (
        !searchQuery.trim()
      ) {
        return derived;
      }

      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return derived.filter(
        (row) =>
          row.medicineName
            .toLowerCase()
            .includes(query)
      );
    }, [
      derived,
      searchQuery,
    ]);

  // =======================================================
  // SORT
  // =======================================================

  const sortedRows =
    useMemo(() => {
      const statusOrder = {
        "In Stock": 1,
        "Low Stock": 2,
        "Out of Stock": 3,
      };

      if (
        !sortConfig.key
      ) {
        return filteredRows;
      }

      const sorted = [
        ...filteredRows,
      ];

      sorted.sort(
        (a, b) => {
          let aVal;
          let bVal;

          switch (
            sortConfig.key
          ) {
            case "medicineName":
              aVal =
                a.medicineName.toLowerCase();

              bVal =
                b.medicineName.toLowerCase();
              break;

            case "currentStock":
              aVal =
                Number(
                  a.currentStock
                );

              bVal =
                Number(
                  b.currentStock
                );
              break;

            case "minimumStock":
              aVal =
                Number(
                  a.minimumStock
                );

              bVal =
                Number(
                  b.minimumStock
                );
              break;

            case "expiryDate":
              aVal =
                a.expiryDate;

              bVal =
                b.expiryDate;
              break;

            case "status":
              aVal =
                statusOrder[
                  a.status
                ] ?? 99;

              bVal =
                statusOrder[
                  b.status
                ] ?? 99;
              break;

            default:
              return 0;
          }

          if (aVal < bVal) {
            return sortConfig.direction ===
              "asc"
              ? -1
              : 1;
          }

          if (aVal > bVal) {
            return sortConfig.direction ===
              "asc"
              ? 1
              : -1;
          }

          return 0;
        }
      );

      return sorted;
    }, [
      filteredRows,
      sortConfig,
    ]);

  // =======================================================
  // PAGINATION
  // =======================================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        sortedRows.length /
          itemsPerPage
      )
    );

  const startIndex =
    (currentPage - 1) *
    itemsPerPage;

  const endIndex =
    Math.min(
      startIndex +
        itemsPerPage,
      sortedRows.length
    );

  const paginatedRows =
    sortedRows.slice(
      startIndex,
      endIndex
    );

  // =======================================================
  // SORT HANDLER
  // =======================================================

  const handleSort = (
    key
  ) => {
    setSortConfig(
      (prev) => ({
        key,

        direction:
          prev.key === key &&
          prev.direction ===
            "asc"
            ? "desc"
            : "asc",
      })
    );

    setCurrentPage(1);
  };

  // =======================================================
  // PER PAGE
  // =======================================================

  const handleItemsPerPageChange =
    (value) => {
      setItemsPerPage(
        value
      );

      setCurrentPage(1);
    };

  // =======================================================
  // PAGE NUMBERS
  // =======================================================

  const getPageNumbers =
    () => {
      const pages = [];

      const maxVisible =
        5;

      if (
        totalPages <=
        maxVisible
      ) {
        for (
          let i = 1;
          i <= totalPages;
          i++
        ) {
          pages.push(i);
        }

        return pages;
      }

      pages.push(1);

      let start =
        Math.max(
          2,
          currentPage - 1
        );

      let end =
        Math.min(
          totalPages - 1,
          currentPage + 1
        );

      if (
        currentPage <= 2
      ) {
        end =
          Math.min(
            4,
            totalPages - 1
          );
      }

      if (
        currentPage >=
        totalPages - 1
      ) {
        start =
          Math.max(
            totalPages - 3,
            2
          );
      }

      if (start > 2) {
        pages.push(
          "..."
        );
      }

      for (
        let i = start;
        i <= end;
        i++
      ) {
        pages.push(i);
      }

      if (
        end <
        totalPages - 1
      ) {
        pages.push(
          "..."
        );
      }

      pages.push(
        totalPages
      );

      return pages;
    };

  // =======================================================
  // CHART COUNTS
  //
  // Primary source:
  // GET /api/inventory/status-overview
  //
  // Fallback:
  // derive counts from GET /api/inventory rows.
  // =======================================================

  const chartCounts =
    useMemo(() => {
      let fallbackInStock =
        0;

      let fallbackLowStock =
        0;

      let fallbackOutStock =
        0;

      for (
        const row of derived
      ) {
        if (
          row.status ===
          "In Stock"
        ) {
          fallbackInStock++;
        } else if (
          row.status ===
          "Low Stock"
        ) {
          fallbackLowStock++;
        } else {
          fallbackOutStock++;
        }
      }

      const inStockCount =
        statusOverview
          ?.inStockCount ??
        fallbackInStock;

      const lowStockCount =
        statusOverview
          ?.lowStockCount ??
        fallbackLowStock;

      const outStockCount =
        statusOverview
          ?.outStockCount ??
        fallbackOutStock;

      const maxCount =
        Math.max(
          inStockCount,
          lowStockCount,
          outStockCount,
          1
        );

      const clampHeight =
        (count) => {
          const min = 18;
          const max = 240;

          return Math.max(
            min,
            (count /
              maxCount) *
              max
          );
        };

      return {
        inStockCount,
        lowStockCount,
        outStockCount,
        maxCount,

        inStockH:
          clampHeight(
            inStockCount
          ),

        lowStockH:
          clampHeight(
            lowStockCount
          ),

        outStockH:
          clampHeight(
            outStockCount
          ),
      };
    }, [
      derived,
      statusOverview,
    ]);

  // =======================================================
  // CHART TICKS
  // =======================================================

  const chartTicks =
    useMemo(() => {
      const max =
        chartCounts.maxCount;

      const middle =
        Math.floor(
          max / 2
        );

      return Array.from(
        new Set([
          max,
          middle,
          0,
        ])
      );
    }, [
      chartCounts.maxCount,
    ]);

  // =======================================================
  // START EDIT
  // =======================================================

  const startEdit = (
    row
  ) => {
    setRowError({
      id: null,
      message: "",
    });

    setEditingId(
      row.id
    );

    setEditDraft({
      currentStock:
        row.currentStock,

      minimumStock:
        row.minimumStock,

      expiryDate:
        row.expiryDate,
    });
  };

  // =======================================================
  // CANCEL EDIT
  // =======================================================

  const cancelEdit =
    () => {
      setEditingId(
        null
      );

      setRowError({
        id: null,
        message: "",
      });

      setEditDraft({
        currentStock: "",
        minimumStock: "",
        expiryDate: "",
      });
    };

  // =======================================================
  // SAVE EDIT
  //
  // PUT /api/inventory/{inventoryId}
  //
  // Swagger Body:
  // currentStock
  // minimumStock
  // expiryDate
  // =======================================================

  const saveEdit =
    async () => {
      if (
        editingId == null
      ) {
        return;
      }

      if (
        editDraft.currentStock ===
        ""
      ) {
        setRowError({
          id: editingId,
          message:
            "Current stock is required",
        });

        return;
      }

      if (
        Number(
          editDraft.currentStock
        ) < 0
      ) {
        setRowError({
          id: editingId,
          message:
            "Current stock cannot be negative",
        });

        return;
      }

      if (
        editDraft.minimumStock ===
        ""
      ) {
        setRowError({
          id: editingId,
          message:
            "Minimum stock is required",
        });

        return;
      }

      if (
        Number(
          editDraft.minimumStock
        ) < 0
      ) {
        setRowError({
          id: editingId,
          message:
            "Minimum stock cannot be negative",
        });

        return;
      }

      if (
        !editDraft.expiryDate
      ) {
        setRowError({
          id: editingId,
          message:
            "Expiry date is required",
        });

        return;
      }

      setSavingId(
        editingId
      );

      setRowError({
        id: null,
        message: "",
      });

      try {
        const payload = {
          currentStock:
            Number(
              editDraft.currentStock
            ),

          minimumStock:
            Number(
              editDraft.minimumStock
            ),

          expiryDate:
            editDraft.expiryDate,
        };

        console.log(
          "UPDATE INVENTORY PAYLOAD:",
          payload
        );

        const response =
          await api.put(
            `/api/inventory/${editingId}`,
            payload
          );

        console.log(
          "UPDATE INVENTORY RESPONSE:",
          response.data
        );

        const responseItem =
          normalizeInventoryItem(
            response?.data
              ?.data ||
              response?.data
          );

        setInventoryRows(
          (prev) =>
            prev.map(
              (item) =>
                String(
                  item.id
                ) ===
                String(
                  editingId
                )
                  ? {
                      ...item,

                      ...(responseItem ||
                        {}),

                      ...payload,

                      id:
                        item.id,
                    }
                  : item
            )
        );

        await refreshStatusOverview();

        toast.success(
          response?.data
            ?.message ||
            "Stock updated successfully!"
        );

        cancelEdit();
      } catch (error) {
        console.error(
          "Update inventory error:",
          error?.response
            ?.data ||
            error.message
        );

        setRowError({
          id: editingId,

          message:
            error?.response
              ?.data
              ?.message ||
            error?.response
              ?.data
              ?.error ||
            "Failed to save changes",
        });
      } finally {
        setSavingId(
          null
        );
      }
    };

  // =======================================================
  // DELETE INVENTORY
  //
  // DELETE /api/inventory/{inventoryId}
  // =======================================================

  const handleDelete =
    async (id) => {
      if (
        id == null
      ) {
        toast.error(
          "Inventory ID not found."
        );

        return;
      }

      setDeletingId(
        id
      );

      setRowError({
        id: null,
        message: "",
      });

      try {
        const response =
          await api.delete(
            `/api/inventory/${id}`
          );

        setInventoryRows(
          (prev) =>
            prev.filter(
              (item) =>
                String(
                  item.id
                ) !==
                String(id)
            )
        );

        await refreshStatusOverview();

        toast.success(
          response?.data
            ?.message ||
            "Stock deleted successfully!"
        );
      } catch (error) {
        console.error(
          "Delete inventory error:",
          error?.response
            ?.data ||
            error.message
        );

        setRowError({
          id,

          message:
            error?.response
              ?.data
              ?.message ||
            error?.response
              ?.data
              ?.error ||
            "Failed to delete item",
        });
      } finally {
        setDeletingId(
          null
        );
      }
    };

  // =======================================================
  // UI
  // =======================================================

  return (
    <div className="inventory-container">
      {/* ===============================================
          HEADER
      =============================================== */}

      <div className="inventory-header">
        <div className="header-left">
          <Package
            size={24}
          />

          <h1>
            Inventory Management
          </h1>
        </div>

        <div className="header-right">
          <button
            type="button"
            className="add-medicine-btn"
            onClick={
              onAddStock
            }
          >
            <Plus
              size={20}
            />

            <span>
              Add Stock
            </span>
          </button>
        </div>
      </div>

      {/* ===============================================
          LOAD ERROR
      =============================================== */}

      {loadError && (
        <div
          className="row-error-text"
          style={{
            marginBottom:
              "1rem",
          }}
        >
          {loadError}
        </div>
      )}

      {/* ===============================================
          EMPTY STATE
      =============================================== */}

      {rows.length ===
        0 &&
      !loading ? (
        <div className="inventory-empty">
          <div className="empty-icon-wrapper">
            <Package
              size={60}
            />
          </div>

          <h3>
            No stock items
            added yet
          </h3>

          <p>
            Click "Add Stock"
            button to add your
            first stock item.
          </p>

          <div className="corner-deco tl" />

          <div className="corner-deco br" />
        </div>
      ) : loading &&
        rows.length ===
          0 ? (
        /* =============================================
            LOADING
        ============================================= */

        <div className="inventory-empty">
          <div className="empty-icon-wrapper">
            <Loader2
              size={60}
              className="spin"
            />
          </div>

          <h3>
            Loading inventory…
          </h3>

          <p>
            Please wait while
            we fetch your stock
            items.
          </p>
        </div>
      ) : (
        /* =============================================
            TABLE WRAPPER
        ============================================= */

        <div className="inventory-table-wrapper">
          {/* ===========================================
              SORT + SEARCH
          =========================================== */}

          <div className="inventory-table-header">
            <div className="sort-controls-container">
              <div className="sort-dropdown-wrapper">
                <label className="sort-label">
                  Sort by:
                </label>

                <select
                  className="sort-select"
                  value={
                    sortConfig.key ||
                    ""
                  }
                  onChange={(
                    e
                  ) => {
                    const value =
                      e.target
                        .value;

                    if (value) {
                      handleSort(
                        value
                      );
                    } else {
                      setSortConfig(
                        {
                          key: null,
                          direction:
                            "asc",
                        }
                      );

                      setCurrentPage(
                        1
                      );
                    }
                  }}
                >
                  <option value="">
                    None
                  </option>

                  <option value="medicineName">
                    Medicine Name
                  </option>

                  <option value="currentStock">
                    Current Stock
                  </option>

                  <option value="minimumStock">
                    Minimum Stock
                  </option>

                  <option value="expiryDate">
                    Expiry Date
                  </option>

                  <option value="status">
                    Status
                  </option>
                </select>
              </div>

              {sortConfig.key && (
                <button
                  type="button"
                  className="sort-direction-btn"
                  onClick={() => {
                    setSortConfig(
                      (prev) => ({
                        ...prev,

                        direction:
                          prev.direction ===
                          "asc"
                            ? "desc"
                            : "asc",
                      })
                    );

                    setCurrentPage(
                      1
                    );
                  }}
                  aria-label={`Sort ${
                    sortConfig.direction ===
                    "asc"
                      ? "descending"
                      : "ascending"
                  }`}
                >
                  {sortConfig.direction ===
                  "asc" ? (
                    <ArrowUp
                      size={18}
                    />
                  ) : (
                    <ArrowDown
                      size={18}
                    />
                  )}

                  <span>
                    {sortConfig.direction ===
                    "asc"
                      ? "Asc"
                      : "Desc"}
                  </span>
                </button>
              )}
            </div>

            <div className="search-bar-container">
              <Search
                size={18}
                className="search-icon"
              />

              <input
                type="text"
                className="search-input"
                placeholder="Search by medicine name..."
                value={
                  searchQuery
                }
                onChange={(
                  e
                ) => {
                  setSearchQuery(
                    e.target
                      .value
                  );

                  setCurrentPage(
                    1
                  );
                }}
              />

              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchQuery(
                      ""
                    );

                    setCurrentPage(
                      1
                    );
                  }}
                  aria-label="Clear search"
                >
                  <X
                    size={16}
                  />
                </button>
              )}
            </div>
          </div>

          {/* ===========================================
              TABLE
          =========================================== */}

          <table className="inventory-table">
            <thead>
              <tr>
                <th>
                  Medicine
                </th>

                <th>
                  Current Stock
                </th>

                <th>
                  Minimum Stock
                </th>

                <th>
                  Expiry
                </th>

                <th>
                  Status
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedRows.map(
                (row) => {
                  const isEditing =
                    editingId ===
                    row.id;

                  const isSaving =
                    savingId ===
                    row.id;

                  const isDeleting =
                    deletingId ===
                    row.id;

                  const hasError =
                    rowError.id ===
                    row.id;

                  return (
                    <tr
                      key={
                        row.id
                      }
                      className={
                        isEditing
                          ? "editing-row"
                          : ""
                      }
                    >
                      {/* MEDICINE */}

                      <td data-label="Medicine">
                        <div className="medicine-name">
                          <div
                            className="medicine-icon"
                            aria-hidden
                          >
                            <span className="medicine-emoji">
                              💊
                            </span>
                          </div>

                          <span>
                            {
                              row.medicineName
                            }
                          </span>
                        </div>
                      </td>

                      {/* CURRENT STOCK */}

                      <td data-label="Current Stock">
                        {isEditing ? (
                          <input
                            className="edit-input"
                            type="number"
                            min="0"
                            value={
                              editDraft.currentStock
                            }
                            onChange={(
                              e
                            ) => {
                              const value =
                                e
                                  .target
                                  .value;

                              if (
                                value.includes(
                                  "-"
                                ) ||
                                Number(
                                  value
                                ) <
                                  0
                              ) {
                                return;
                              }

                              setEditDraft(
                                (
                                  prev
                                ) => ({
                                  ...prev,

                                  currentStock:
                                    value,
                                })
                              );
                            }}
                          />
                        ) : (
                          row.currentStock
                        )}
                      </td>

                      {/* MINIMUM STOCK */}

                      <td data-label="Minimum Stock">
                        {isEditing ? (
                          <input
                            className="edit-input"
                            type="number"
                            min="0"
                            value={
                              editDraft.minimumStock
                            }
                            onChange={(
                              e
                            ) => {
                              const value =
                                e
                                  .target
                                  .value;

                              if (
                                value.includes(
                                  "-"
                                ) ||
                                Number(
                                  value
                                ) <
                                  0
                              ) {
                                return;
                              }

                              setEditDraft(
                                (
                                  prev
                                ) => ({
                                  ...prev,

                                  minimumStock:
                                    value,
                                })
                              );
                            }}
                          />
                        ) : (
                          row.minimumStock
                        )}
                      </td>

                      {/* EXPIRY */}

                      <td data-label="Expiry">
                        {isEditing ? (
                          <input
                            className="edit-input"
                            type="date"
                            value={
                              editDraft.expiryDate
                            }
                            onChange={(
                              e
                            ) =>
                              setEditDraft(
                                (
                                  prev
                                ) => ({
                                  ...prev,

                                  expiryDate:
                                    e
                                      .target
                                      .value,
                                })
                              )
                            }
                          />
                        ) : (
                          row.expiryDate
                        )}
                      </td>

                      {/* STATUS */}

                      <td data-label="Status">
                        <StatusBadge
                          status={getStatus(
                            isEditing
                              ? {
                                  ...row,

                                  currentStock:
                                    editDraft.currentStock,

                                  minimumStock:
                                    editDraft.minimumStock,

                                  // Editing time par
                                  // local values se fallback
                                  // calculate hona chahiye.
                                  stockStatus:
                                    "",
                                }
                              : row
                          )}
                        />
                      </td>

                      {/* ACTION */}

                      <td data-label="Action">
                        {isEditing ? (
                          <div className="edit-actions">
                            <button
                              type="button"
                              className="save-btn"
                              onClick={
                                saveEdit
                              }
                              disabled={
                                isSaving
                              }
                              aria-label="Save"
                            >
                              {isSaving ? (
                                <Loader2
                                  size={
                                    18
                                  }
                                  className="spin"
                                />
                              ) : (
                                <Save
                                  size={
                                    18
                                  }
                                />
                              )}
                            </button>

                            <button
                              type="button"
                              className="cancel-btn"
                              onClick={
                                cancelEdit
                              }
                              disabled={
                                isSaving
                              }
                              aria-label="Cancel"
                            >
                              <X
                                size={
                                  18
                                }
                              />
                            </button>
                          </div>
                        ) : (
                          <div className="edit-actions">
                            <button
                              type="button"
                              className="edit-btn"
                              onClick={() =>
                                startEdit(
                                  row
                                )
                              }
                              aria-label="Edit"
                            >
                              <Edit2
                                size={
                                  20
                                }
                              />
                            </button>

                            <button
                              type="button"
                              className="delete-btn"
                              onClick={() =>
                                handleDelete(
                                  row.id
                                )
                              }
                              disabled={
                                isDeleting
                              }
                              aria-label="Delete"
                            >
                              {isDeleting ? (
                                <Loader2
                                  size={
                                    18
                                  }
                                  className="spin"
                                />
                              ) : (
                                <Trash2
                                  size={
                                    18
                                  }
                                />
                              )}
                            </button>
                          </div>
                        )}

                        {hasError && (
                          <div className="row-error-text">
                            {
                              rowError.message
                            }
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>

          {/* ===========================================
              PAGINATION
          =========================================== */}

          {filteredRows.length >
            0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                <span className="pagination-showing">
                  Showing{" "}
                  {startIndex +
                    1}{" "}
                  to{" "}
                  {endIndex}{" "}
                  of{" "}
                  {
                    sortedRows.length
                  }{" "}
                  {sortedRows.length !==
                    derived.length &&
                    `(filtered from ${derived.length} total)`}{" "}
                  entries
                </span>

                <div className="pagination-per-page">
                  <label htmlFor="itemsPerPage">
                    Per page:
                  </label>

                  <select
                    id="itemsPerPage"
                    className="pagination-select"
                    value={
                      itemsPerPage
                    }
                    onChange={(
                      e
                    ) =>
                      handleItemsPerPageChange(
                        Number(
                          e
                            .target
                            .value
                        )
                      )
                    }
                  >
                    <option value={5}>
                      5
                    </option>

                    <option value={10}>
                      10
                    </option>

                    <option value={15}>
                      15
                    </option>

                    <option value={20}>
                      20
                    </option>
                  </select>
                </div>
              </div>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="page-nav-btn"
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(
                          1,
                          page - 1
                        )
                    )
                  }
                  disabled={
                    currentPage ===
                    1
                  }
                  aria-label="Previous page"
                >
                  <ChevronLeft
                    size={18}
                  />
                </button>

                {getPageNumbers().map(
                  (
                    page,
                    index
                  ) =>
                    page ===
                    "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="page-ellipsis"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        type="button"
                        key={
                          page
                        }
                        className={`page-btn ${
                          currentPage ===
                          page
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setCurrentPage(
                            page
                          )
                        }
                      >
                        {page}
                      </button>
                    )
                )}

                <button
                  type="button"
                  className="page-nav-btn"
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                    )
                  }
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  aria-label="Next page"
                >
                  <ChevronRight
                    size={18}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===============================================
          STOCK STATUS OVERVIEW
      =============================================== */}

      {rows.length > 0 && (
        <div className="stock-status-section">
          <h2 className="stock-status-title">
            Stock Status Overview
          </h2>

          <div className="title-underline-small" />

          <div className="chart-container">
            <div
              className="chart-legend"
              aria-label="Stock status legend"
            >
              <div className="legend-item">
                <span
                  className="legend-color in-stock"
                  aria-hidden
                />

                <span>
                  In Stock
                </span>
              </div>

              <div className="legend-item">
                <span
                  className="legend-color low-stock"
                  aria-hidden
                />

                <span>
                  Low Stock
                </span>
              </div>

              <div className="legend-item">
                <span
                  className="legend-color out-of-stock"
                  aria-hidden
                />

                <span>
                  Out of Stock
                </span>
              </div>
            </div>

            <div
              className="bar-chart"
              aria-label="Stock status chart"
            >
              <div
                className="y-axis"
                aria-hidden
              >
                {chartTicks.map(
                  (tick) => (
                    <span
                      key={
                        tick
                      }
                    >
                      {tick}
                    </span>
                  )
                )}
              </div>

              <div className="chart-bars">
                <div className="bar-group">
                  <div
                    className="bar"
                    style={{
                      height:
                        chartCounts.inStockH +
                        "px",
                    }}
                  />

                  <div className="bar-label">
                    In Stock (
                    {
                      chartCounts.inStockCount
                    }
                    )
                  </div>
                </div>

                <div className="bar-group">
                  <div
                    className="bar"
                    style={{
                      height:
                        chartCounts.lowStockH +
                        "px",
                    }}
                  />

                  <div className="bar-label">
                    Low Stock (
                    {
                      chartCounts.lowStockCount
                    }
                    )
                  </div>
                </div>

                <div className="bar-group">
                  <div
                    className="bar"
                    style={{
                      height:
                        chartCounts.outStockH +
                        "px",
                    }}
                  />

                  <div className="bar-label">
                    Out of Stock (
                    {
                      chartCounts.outStockCount
                    }
                    )
                  </div>
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
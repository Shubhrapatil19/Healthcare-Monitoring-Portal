const fs = require("fs");
const path = "c:/HMS Web App/Healthcare-Monitoring-Portal/src/Pages/User/UserInvent.jsx";

const parts = [];

// Import block
parts.push('import { useMemo, useState } from "react";');
parts.push('import { Package, Plus, Edit2, Save, X, ChevronLeft, ChevronRight, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";');
parts.push('import "./UserInvent.css";');
parts.push("");

// StatusBadge component
parts.push("const StatusBadge = ({ status }) => {");
parts.push("  const className =");
parts.push('    status === "In Stock"');
parts.push('      ? "status-badge in-stock"');
parts.push('      : status === "Low Stock"');
parts.push('      ? "status-badge low-stock"');
parts.push('      : "status-badge out-of-stock";');
parts.push("  return <span className={className}>{status}</span>;");
parts.push("};");
parts.push("");

// SortIndicator component
parts.push("const SortIndicator = ({ columnKey, sortConfig }) => {");
parts.push('  if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="sort-icon sort-icon-inactive" />;');
parts.push('  return sortConfig.direction === "asc" ? <ArrowUp size={14} className="sort-icon sort-icon-active" /> : <ArrowDown size={14} className="sort-icon sort-icon-active" />;');
parts.push("};");
parts.push("");

// UserInvent component start
parts.push("const UserInvent = () => {");

// State
parts.push("  const [rows, setRows] = useState([");
parts.push('    { id: 1, medicineName: "Paracetamol", currentStock: 120, minimumStock: 50, expiryDate: "2027-03-10" },');
parts.push('    { id: 2, medicineName: "Amoxicillin", currentStock: 18, minimumStock: 30, expiryDate: "2026-10-22" },');
parts.push('    { id: 3, medicineName: "Cetrizine", currentStock: 0, minimumStock: 10, expiryDate: "2026-08-01" },');
parts.push('    { id: 4, medicineName: "Ibuprofen", currentStock: 200, minimumStock: 40, expiryDate: "2027-06-15" },');
parts.push('    { id: 5, medicineName: "Omeprazole", currentStock: 5, minimumStock: 20, expiryDate: "2026-12-01" },');
parts.push('    { id: 6, medicineName: "Loratadine", currentStock: 60, minimumStock: 15, expiryDate: "2027-01-20" },');
parts.push('    { id: 7, medicineName: "Metformin", currentStock: 90, minimumStock: 25, expiryDate: "2026-09-30" },');
parts.push('    { id: 8, medicineName: "Aspirin", currentStock: 0, minimumStock: 10, expiryDate: "2026-11-05" }');
parts.push("  ]);");

parts.push("  const [editingId, setEditingId] = useState(null);");
parts.push('  const [editDraft, setEditDraft] = useState({ medicineName: "", currentStock: "", minimumStock: "", expiryDate: "" });');
parts.push('  const [searchQuery, setSearchQuery] = useState("");');
parts.push("  const [currentPage, setCurrentPage] = useState(1);");
parts.push("  const [itemsPerPage, setItemsPerPage] = useState(5);");
parts.push('  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });');
parts.push("");

// Functions
parts.push("  const getStatus = (r) => {");
parts.push('    if (Number(r.currentStock) <= 0) return "Out of Stock";');
parts.push('    if (Number(r.currentStock) < Number(r.minimumStock)) return "Low Stock";');
parts.push('    return "In Stock";');
parts.push("  };");
parts.push("");

parts.push('  const statusOrder = { "In Stock": 1, "Low Stock": 2, "Out of Stock": 3 };');
parts.push("  const derived = useMemo(() => rows.map((r) => ({ ...r, status: getStatus(r) })), [rows]);");
parts.push("");

parts.push("  const filteredRows = useMemo(() => {");
parts.push("    if (!searchQuery.trim()) return derived;");
parts.push("    return derived.filter((r) => r.medicineName.toLowerCase().includes(searchQuery.toLowerCase().trim()));");
parts.push("  }, [derived, searchQuery]);");
parts.push("");

parts.push("  const sortedRows = useMemo(() => {");
parts.push("    if (!sortConfig.key) return filteredRows;");
parts.push("    return [...filteredRows].sort((a, b) => {");
parts.push("      let aVal, bVal;");
parts.push("      switch (sortConfig.key) {");
parts.push('        case "medicineName": aVal = a.medicineName.toLowerCase(); bVal = b.medicineName.toLowerCase(); break;');
parts.push('        case "currentStock": aVal = Number(a.currentStock); bVal = Number(b.currentStock); break;');
parts.push('        case "minimumStock": aVal = Number(a.minimumStock); bVal = Number(b.minimumStock); break;');
parts.push('        case "expiryDate": aVal = a.expiryDate; bVal = b.expiryDate; break;');
parts.push('        case "status": aVal = statusOrder[a.status] || 99; bVal = statusOrder[b.status] || 99; break;');
parts.push("        default: return 0;");
parts.push("      }");
parts.push('      return aVal < bVal ? (sortConfig.direction === "asc" ? -1 : 1) : aVal > bVal ? (sortConfig.direction === "asc" ? 1 : -1) : 0;');
parts.push("    });");
parts.push("  }, [filteredRows, sortConfig]);");
parts.push("");

parts.push("  const totalPages = Math.max(1, Math.ceil(sortedRows.length / itemsPerPage));");
parts.push("  const startIndex = (currentPage - 1) * itemsPerPage;");
parts.push("  const paginatedRows = sortedRows.slice(startIndex, startIndex + itemsPerPage);");
parts.push("");

parts.push("  const handleSort = (key) => {");
parts.push('    setSortConfig((prev) => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));');
parts.push("    setCurrentPage(1);");
parts.push("  };");
parts.push("");

parts.push("  const chartCounts = useMemo(() => {");
parts.push("    let inStockCount = 0, lowStockCount = 0, outStockCount = 0;");
parts.push("    for (const r of derived) {");
parts.push('      if (r.status === "In Stock") inStockCount++;');
parts.push('      else if (r.status === "Low Stock") lowStockCount++;');
parts.push("      else outStockCount++;");
parts.push("    }");
parts.push("    const maxCount = Math.max(inStockCount, lowStockCount, outStockCount, 1);");
parts.push("    const clamp = (count) => Math.max(18, (count / maxCount) * 240);");
parts.push("    return { inStockCount, lowStockCount, outStockCount, inStockH: clamp(inStockCount), lowStockH: clamp(lowStockCount), outStockH: clamp(outStockCount) };");
parts.push("  }, [derived]);");
parts.push("");

parts.push("  const startEdit = (r) => { setEditingId(r.id); setEditDraft({ medicineName: r.medicineName, currentStock: r.currentStock, minimumStock: r.minimumStock, expiryDate: r.expiryDate }); };");
parts.push('  const cancelEdit = () => { setEditingId(null); setEditDraft({ medicineName: "", currentStock: "", minimumStock: "", expiryDate: "" }); };');
parts.push

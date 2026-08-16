import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import gsap from "gsap";

import {
  FileText,
  FileSpreadsheet,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
} from "react-icons/fi";

import {
  getAdminReportPatients,
  getAdminPatientReport,
} from "../../api/AdminMockApi";

import "./AdminReport.css";

// ================================================================
// CONSTANTS
// ================================================================

const WEEKDAYS = [
  "Su",
  "Mo",
  "Tu",
  "We",
  "Th",
  "Fr",
  "Sa",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const REPORT_TYPES = [
  {
    value: "daily",
    label: "Daily",
  },
  {
    value: "weekly",
    label: "Weekly",
  },
  {
    value: "monthly",
    label: "Monthly",
  },
  {
    value: "custom",
    label: "Custom",
  },
];

const ROWS_PER_PAGE = 6;

// ================================================================
// DATE HELPERS
// ================================================================

const toDate = (value) => {
  if (!value) {
    return new Date();
  }

  const [year, month, day] =
    value.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
};

const toISO = (date) => {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value) => {
  if (!value) {
    return "Select date";
  }

  return toDate(
    value
  ).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const formatReportDate = (value) => {
  if (!value) {
    return "";
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

// ================================================================
// CALENDAR PICKER
// ================================================================

function AdminReportCalendarPicker({
  value,
  onChange,
  min,
  max,
}) {
  const [open, setOpen] =
    useState(false);

  const [viewYear, setViewYear] =
    useState(() =>
      toDate(value).getFullYear()
    );

  const [viewMonth, setViewMonth] =
    useState(() =>
      toDate(value).getMonth()
    );

  const wrapRef =
    useRef(null);

  useEffect(() => {
    const handleClickOutside = (
      event
    ) => {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const openCalendar = () => {
    const current =
      toDate(value);

    setViewYear(
      current.getFullYear()
    );

    setViewMonth(
      current.getMonth()
    );

    setOpen(true);
  };

  const previousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);

      setViewYear(
        (prev) =>
          prev - 1
      );
    } else {
      setViewMonth(
        (prev) =>
          prev - 1
      );
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);

      setViewYear(
        (prev) =>
          prev + 1
      );
    } else {
      setViewMonth(
        (prev) =>
          prev + 1
      );
    }
  };

  const firstDay =
    new Date(
      viewYear,
      viewMonth,
      1
    ).getDay();

  const totalDays =
    new Date(
      viewYear,
      viewMonth + 1,
      0
    ).getDate();

  const cells = [];

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    cells.push(null);
  }

  for (
    let day = 1;
    day <= totalDays;
    day++
  ) {
    cells.push(day);
  }

  const createISO = (day) =>
    `${viewYear}-${String(
      viewMonth + 1
    ).padStart(
      2,
      "0"
    )}-${String(
      day
    ).padStart(
      2,
      "0"
    )}`;

  const isDisabled = (day) => {
    const iso =
      createISO(day);

    if (
      min &&
      iso < min
    ) {
      return true;
    }

    if (
      max &&
      iso > max
    ) {
      return true;
    }

    return false;
  };

  const isToday = (day) => {
    const today =
      new Date();

    return (
      viewYear ===
        today.getFullYear() &&
      viewMonth ===
        today.getMonth() &&
      day ===
        today.getDate()
    );
  };

  const isSelected = (day) =>
    createISO(day) === value;

  const selectDate = (day) => {
    if (
      isDisabled(day)
    ) {
      return;
    }

    onChange(
      createISO(day)
    );

    setOpen(false);
  };

  return (
    <div
      className="admin-report-calendar-wrap"
      ref={wrapRef}
    >
      <button
        type="button"
        className="admin-report-date-input"
        onClick={openCalendar}
      >
        <FiCalendar className="admin-report-calendar-icon" />

        <span className="admin-report-date-text">
          {
            formatDisplayDate(
              value
            )
          }
        </span>
      </button>

      {open && (
        <div className="admin-report-calendar-popup">

          <div className="admin-report-calendar-header">

            <button
              type="button"
              className="admin-report-cal-nav"
              onClick={previousMonth}
            >
              <FiChevronLeft />
            </button>

            <div className="admin-report-cal-title">
              {
                MONTHS[
                  viewMonth
                ]
              }{" "}
              {
                viewYear
              }
            </div>

            <button
              type="button"
              className="admin-report-cal-nav"
              onClick={nextMonth}
            >
              <FiChevronRight />
            </button>

          </div>

          <div className="admin-report-cal-weekdays">
            {WEEKDAYS.map(
              (weekday) => (
                <div
                  key={weekday}
                  className="admin-report-cal-weekday"
                >
                  {
                    weekday
                  }
                </div>
              )
            )}
          </div>

          <div className="admin-report-cal-grid">

            {cells.map(
              (
                day,
                index
              ) =>
                day === null ? (
                  <div
                    key={`empty-${index}`}
                    className="admin-report-cal-cell empty"
                  />
                ) : (
                  <button
                    key={`${viewYear}-${viewMonth}-${day}`}
                    type="button"
                    className={
                      "admin-report-cal-day" +
                      (
                        isSelected(day)
                          ? " selected"
                          : ""
                      ) +
                      (
                        isToday(day)
                          ? " today"
                          : ""
                      ) +
                      (
                        isDisabled(day)
                          ? " disabled"
                          : ""
                      )
                    }
                    disabled={
                      isDisabled(day)
                    }
                    onClick={() =>
                      selectDate(day)
                    }
                  >
                    {
                      day
                    }
                  </button>
                )
            )}

          </div>

          <div className="admin-report-cal-footer">

            <button
              type="button"
              className="admin-report-cal-today"
              onClick={() => {
                onChange(
                  toISO(
                    new Date()
                  )
                );

                setOpen(false);
              }}
            >
              Today
            </button>

            <button
              type="button"
              className="admin-report-cal-close"
              onClick={() =>
                setOpen(false)
              }
            >
              Close
            </button>

          </div>

        </div>
      )}
    </div>
  );
}

// ================================================================
// ADMIN REPORT PAGE
// ================================================================

export default function AdminReport() {
  // =========================================================
  // FILTERS
  // =========================================================

  const [
    patientName,
    setPatientName,
  ] =
    useState("");

  const [
    reportType,
    setReportType,
  ] =
    useState("monthly");

  const [
    reportFormat,
    setReportFormat,
  ] =
    useState("PDF");

  const [
    fromDate,
    setFromDate,
  ] =
    useState("2026-07-01");

  const [
    toDate,
    setToDate,
  ] =
    useState("2026-07-31");

  // =========================================================
  // DATA
  // =========================================================

  const [
    patients,
    setPatients,
  ] =
    useState([]);

  const [
    reportData,
    setReportData,
  ] =
    useState([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  // =========================================================
  // PAGINATION
  // =========================================================

  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(1);

  const pageRef =
    useRef(null);

  // =========================================================
  // LOAD PATIENTS
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const fetchPatients =
      async () => {
        try {
          const response =
            await getAdminReportPatients();

          if (mounted) {
            setPatients(
              response
                ?.data
                ?.patients ||
                []
            );
          }
        } catch (error) {
          console.error(
            "Unable to load admin report patients:",
            error
          );
        }
      };

    fetchPatients();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // FETCH REPORT
  // =========================================================

  const fetchReport =
    async (
      override = {}
    ) => {
      setLoading(true);

      try {
        const response =
          await getAdminPatientReport({
            patientName:
              override.patientName ??
              patientName.trim(),

            fromDate:
              override.fromDate ??
              fromDate,

            toDate:
              override.toDate ??
              toDate,

            reportType:
              override.reportType ??
              reportType,
          });

        setReportData(
          response
            ?.data
            ?.reports ||
            []
        );

        setCurrentPage(1);
      } catch (error) {
        console.error(
          "Unable to load admin report:",
          error
        );

        setReportData([]);
      } finally {
        setLoading(false);
      }
    };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const initialLoad =
      async () => {
        setLoading(true);

        try {
          const response =
            await getAdminPatientReport({
              patientName: "",
              fromDate:
                "2026-07-01",
              toDate:
                "2026-07-31",
              reportType:
                "monthly",
            });

          if (mounted) {
            setReportData(
              response
                ?.data
                ?.reports ||
                []
            );
          }
        } catch (error) {
          console.error(
            "Initial report load error:",
            error
          );
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    initialLoad();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // ANIMATION
  // =========================================================

  useEffect(() => {
    if (loading) {
      return;
    }

    try {
      const ctx =
        gsap.context(
          () => {
            gsap.from(
              ".admin-report-header",
              {
                opacity: 0,
                y: -20,
                duration: 0.5,
                ease: "power2.out",
                clearProps:
                  "all",
              }
            );

            gsap.from(
              ".admin-report-filter-card",
              {
                opacity: 0,
                x: -30,
                duration: 0.5,
                ease: "power2.out",
                delay: 0.15,
                clearProps:
                  "all",
              }
            );

            gsap.from(
              ".admin-report-info-card",
              {
                opacity: 0,
                scale: 0.9,
                duration: 0.45,
                ease:
                  "back.out(1.5)",
                delay: 0.25,
                clearProps:
                  "all",
              }
            );

            gsap.from(
              ".admin-report-table-card",
              {
                opacity: 0,
                x: 30,
                duration: 0.5,
                ease: "power2.out",
                delay: 0.35,
                clearProps:
                  "all",
              }
            );
          },

          pageRef
        );

      return () => {
        ctx.revert();
      };
    } catch {
      return undefined;
    }
  }, [loading]);

  // =========================================================
  // SELECTED PATIENT
  // =========================================================

  const selectedPatient =
    useMemo(() => {
      const search =
        patientName
          .trim()
          .toLowerCase();

      if (!search) {
        return null;
      }

      return (
        patients.find(
          (patient) =>
            patient.name
              .toLowerCase() ===
            search
        ) ||
        null
      );
    }, [
      patientName,
      patients,
    ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalItems =
    reportData.length;

  const totalPages =
    Math.ceil(
      totalItems /
        ROWS_PER_PAGE
    );

  const startIndex =
    (currentPage - 1) *
    ROWS_PER_PAGE;

  const paginatedData =
    reportData.slice(
      startIndex,
      startIndex +
        ROWS_PER_PAGE
    );

  const pages =
    Array.from(
      {
        length:
          totalPages,
      },
      (_, index) =>
        index + 1
    );

  const handlePageChange =
    (page) => {
      if (
        page < 1 ||
        page > totalPages
      ) {
        return;
      }

      setCurrentPage(page);
    };

  // =========================================================
  // RESET
  // =========================================================

  const handleReset =
    async () => {
      const defaultFrom =
        "2026-07-01";

      const defaultTo =
        "2026-07-31";

      setPatientName("");
      setReportType("monthly");
      setReportFormat("PDF");
      setFromDate(defaultFrom);
      setToDate(defaultTo);
      setCurrentPage(1);

      await fetchReport({
        patientName: "",
        fromDate:
          defaultFrom,
        toDate:
          defaultTo,
        reportType:
          "monthly",
      });
    };

  // =========================================================
  // GENERATE
  // =========================================================

  const handleGenerateReport =
    async () => {
      await fetchReport();
    };

  // =========================================================
  // REPORT TITLE
  // =========================================================

  const getReportTitle =
    () => {
      const patient =
        selectedPatient
          ? `${selectedPatient.name} (${selectedPatient.id})`
          : "All Patients";

      const type =
        reportType
          .charAt(0)
          .toUpperCase() +
        reportType.slice(1);

      return `${patient} - ${type} Report`;
    };

  // =========================================================
  // PDF DOWNLOAD
  // =========================================================

  const escapePdfText =
    (value) =>
      String(
        value ?? ""
      )
        .replace(
          /\\/g,
          "\\\\"
        )
        .replace(
          /\(/g,
          "\\("
        )
        .replace(
          /\)/g,
          "\\)"
        );

  const handleDownloadPDF =
    () => {
      if (
        reportData.length ===
        0
      ) {
        return;
      }

      const lines = [
        "BT",
        "/F1 16 Tf",
        "45 780 Td",
        `(${escapePdfText(
          getReportTitle()
        )}) Tj`,
        "0 -25 Td",
        "/F1 9 Tf",
      ];

      const headers = [
        "Date",
        "Medicine",
        "Scheduled",
        "Taken",
        "Status",
        "Remarks",
      ];

      lines.push(
        `(${headers
          .map(
            escapePdfText
          )
          .join(
            " | "
          )}) Tj`
      );

      reportData.forEach(
        (row) => {
          lines.push(
            "0 -16 Td"
          );

          const text =
            [
              row.date,
              row.medicine,
              row.scheduledTime,
              row.takenTime ||
                "---",
              row.status,
              row.remarks,
            ]
              .map(
                escapePdfText
              )
              .join(
                " | "
              );

          lines.push(
            `(${text}) Tj`
          );
        }
      );

      lines.push("ET");

      const stream =
        lines.join("\n");

      const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",

        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",

        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",

        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",

        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      ];

      let pdf =
        "%PDF-1.4\n";

      const offsets = [];

      objects.forEach(
        (
          object,
          index
        ) => {
          offsets.push(
            pdf.length
          );

          pdf += `${
            index + 1
          } 0 obj\n${object}\nendobj\n`;
        }
      );

      const xref =
        pdf.length;

      pdf += `xref\n0 ${
        objects.length +
        1
      }\n`;

      pdf +=
        "0000000000 65535 f \n";

      offsets.forEach(
        (offset) => {
          pdf += `${String(
            offset
          ).padStart(
            10,
            "0"
          )} 00000 n \n`;
        }
      );

      pdf += `trailer\n<< /Size ${
        objects.length +
        1
      } /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

      const blob =
        new Blob(
          [pdf],
          {
            type:
              "application/pdf",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      const safeName =
        selectedPatient
          ? selectedPatient.name.replace(
              /\s+/g,
              "_"
            )
          : "All_Patients";

      anchor.href =
        url;

      anchor.download =
        `${safeName}_Report_${fromDate}_to_${toDate}.pdf`;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      document.body.removeChild(
        anchor
      );

      URL.revokeObjectURL(
        url
      );
    };

  // =========================================================
  // EXCEL / CSV DOWNLOAD
  // =========================================================

  const handleDownloadExcel =
    () => {
      if (
        reportData.length ===
        0
      ) {
        return;
      }

      const headers = [
        "Date",
        "Medicine",
        "Scheduled Time",
        "Taken Time",
        "Status",
        "Remarks",
      ];

      const escapeCSV =
        (value) => {
          const text =
            String(
              value ?? ""
            );

          if (
            /[",\n]/.test(
              text
            )
          ) {
            return `"${text.replace(
              /"/g,
              '""'
            )}"`;
          }

          return text;
        };

      const rows = [
        headers.join(","),

        ...reportData.map(
          (row) =>
            [
              row.date,
              row.medicine,
              row.scheduledTime,
              row.takenTime ||
                "---",
              row.status,
              row.remarks,
            ]
              .map(
                escapeCSV
              )
              .join(",")
        ),
      ];

      const blob =
        new Blob(
          [
            `\ufeff${rows.join(
              "\n"
            )}`,
          ],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      const safeName =
        selectedPatient
          ? selectedPatient.name.replace(
              /\s+/g,
              "_"
            )
          : "All_Patients";

      anchor.href =
        url;

      anchor.download =
        `${safeName}_Report_${fromDate}_to_${toDate}.csv`;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      document.body.removeChild(
        anchor
      );

      URL.revokeObjectURL(
        url
      );
    };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      className="admin-report-page"
      ref={pageRef}
    >

      {/* HEADER */}

      <div className="admin-report-header">

        <div className="admin-report-header-left">
          <h1>
            Reports
          </h1>

          <p>
            Generate daily, weekly,
            monthly and custom patient
            reports.
          </p>
        </div>

        <div className="admin-report-header-right">

          <button
            type="button"
            className="admin-report-btn-outline"
            onClick={
              handleDownloadPDF
            }
            disabled={
              reportData.length ===
              0
            }
          >
            <FileText
              size={16}
            />

            Download PDF
          </button>

          <button
            type="button"
            className="admin-report-btn-outline"
            onClick={
              handleDownloadExcel
            }
            disabled={
              reportData.length ===
              0
            }
          >
            <FileSpreadsheet
              size={16}
            />

            Download Excel
          </button>

        </div>

      </div>

      {/* FILTER CARD */}

      <div className="admin-report-filter-card">

        <div className="admin-report-filter-grid">

            {/* PATIENT */}

            <div className="admin-report-filter-field admin-report-patient-field">

              <label>
                Patient Name
              </label>

              <input
                type="text"
                className="admin-report-search-input"
                placeholder="Search and select patient"
                value={
                  patientName
                }
                onChange={(event) => {
                  setPatientName(
                    event.target
                      .value
                  );

                  setCurrentPage(1);
                }}
                list="admin-report-patients"
              />

              <datalist id="admin-report-patients">

                {patients.map(
                  (patient) => (
                    <option
                      key={
                        patient.id
                      }
                      value={
                        patient.name
                      }
                    />
                  )
                )}

              </datalist>

            </div>

            {/* TYPE */}

            <div className="admin-report-filter-field admin-report-type-field">

              <label>
                Report Type
              </label>

              <div className="admin-report-radio-group">

                {REPORT_TYPES.map(
                  (type) => (
                    <label
                      key={
                        type.value
                      }
                      className="admin-report-radio-label"
                    >
                      <input
                        type="radio"
                        name="admin-report-type"
                        value={
                          type.value
                        }
                        checked={
                          reportType ===
                          type.value
                        }
                        onChange={(event) =>
                          setReportType(
                            event.target
                              .value
                          )
                        }
                      />

                      {
                        type.label
                      }
                    </label>
                  )
                )}

              </div>

            </div>

            {/* FORMAT */}

            <div className="admin-report-filter-field admin-report-format-field">

              <label>
                Report Format
              </label>

              <select
                className="admin-report-select"
                value={
                  reportFormat
                }
                onChange={(event) =>
                  setReportFormat(
                    event.target
                      .value
                  )
                }
              >
                <option value="PDF">
                  PDF
                </option>

                <option value="Excel">
                  Excel
                </option>
              </select>

            </div>

          {/* DATES */}

            <div className="admin-report-filter-field admin-report-from-field">
              <label>
                From Date
              </label>

              <AdminReportCalendarPicker
                value={
                  fromDate
                }
                onChange={
                  setFromDate
                }
                max={
                  toDate
                }
              />
            </div>

            <div className="admin-report-filter-field admin-report-to-field">
              <label>
                To Date
              </label>

              <AdminReportCalendarPicker
                value={
                  toDate
                }
                onChange={
                  setToDate
                }
                min={
                  fromDate
                }
              />
            </div>

          {/* ACTIONS */}

          <div className="admin-report-filter-actions">

          <button
            type="button"
            className="admin-report-btn-reset"
            onClick={
              handleReset
            }
            disabled={
              loading
            }
          >
            <RotateCcw
              size={16}
            />

            Reset
          </button>

          <button
            type="button"
            className="admin-report-btn-generate"
            onClick={
              handleGenerateReport
            }
            disabled={
              loading
            }
          >
            <FileText
              size={16}
            />

            {loading
              ? "Generating..."
              : "Generate Report"}
          </button>

          </div>

        </div>

      </div>

      {/* REPORT INFORMATION */}

      <div className="admin-report-info-card">

        <div className="admin-report-info-icon">
          <FileText
            size={24}
          />
        </div>

        <div className="admin-report-info-content">

          <span className="admin-report-info-patient">
            Report for{" "}
            {selectedPatient
              ? `${selectedPatient.name} (${selectedPatient.id})`
              : "All Patients"}
          </span>

          <span className="admin-report-info-type">
            {reportType
              .charAt(0)
              .toUpperCase() +
              reportType.slice(
                1
              )}{" "}
            Report
          </span>

          <span className="admin-report-info-dates">
            {
              formatReportDate(
                fromDate
              )
            }{" "}
            -{" "}
            {
              formatReportDate(
                toDate
              )
            }
          </span>

        </div>

      </div>

      {/* TABLE */}

      <div className="admin-report-table-card">

        <div className="admin-report-table-wrap">

          <table className="admin-report-table">

            <colgroup>
              <col className="admin-report-col-date" />
              <col className="admin-report-col-medicine" />
              <col className="admin-report-col-scheduled" />
              <col className="admin-report-col-taken" />
              <col className="admin-report-col-status" />
              <col className="admin-report-col-remarks" />
            </colgroup>

            <thead>
              <tr>
                <th>
                  Date
                </th>

                <th>
                  Medicine
                </th>

                <th>
                  Scheduled Time
                </th>

                <th>
                  Taken Time
                </th>

                <th>
                  Status
                </th>

                <th>
                  Remarks
                </th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="admin-report-empty"
                  >
                    Loading report...
                  </td>
                </tr>

              ) : paginatedData.length ===
                0 ? (

                <tr>
                  <td
                    colSpan="6"
                    className="admin-report-empty"
                  >
                    No report data available
                    for the selected filters.
                  </td>
                </tr>

              ) : (

                paginatedData.map(
                  (row) => (
                    <tr
                      key={
                        row.id
                      }
                    >

                      <td>
                        {
                          formatReportDate(
                            row.date
                          )
                        }
                      </td>

                      <td>
                        {
                          row.medicine
                        }
                      </td>

                      <td>
                        {
                          row.scheduledTime
                        }
                      </td>

                      <td>
                        {
                          row.takenTime ||
                          "---"
                        }
                      </td>

                      <td>
                        <span
                          className={
                            `admin-report-status ${
                              String(
                                row.status ||
                                  ""
                              )
                                .toLowerCase()
                                .replace(
                                  /\s+/g,
                                  "-"
                                )
                            }`
                          }
                        >
                          {
                            row.status
                          }
                        </span>
                      </td>

                      <td>
                        {
                          row.remarks
                        }
                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* PAGINATION */}

      {!loading &&
        totalItems >
          0 && (

        <div className="admin-report-pagination">

          <div className="admin-report-pagination-info">
            Showing{" "}
            {startIndex + 1}
            {" "}to{" "}
            {Math.min(
              startIndex +
                ROWS_PER_PAGE,

              totalItems
            )}
            {" "}of{" "}
            {totalItems}
            {" "}entries
          </div>

          <div className="admin-report-pagination-controls">

            <button
              type="button"
              className="admin-report-page-btn"
              disabled={
                currentPage ===
                1
              }
              onClick={() =>
                handlePageChange(
                  currentPage -
                    1
                )
              }
            >
              <ChevronLeft
                size={16}
              />
            </button>

            {pages.map(
              (page) => (
                <button
                  type="button"
                  key={
                    page
                  }
                  className={
                    `admin-report-page-btn ${
                      currentPage ===
                      page
                        ? "active"
                        : ""
                    }`
                  }
                  onClick={() =>
                    handlePageChange(
                      page
                    )
                  }
                >
                  {
                    page
                  }
                </button>
              )
            )}

            <button
              type="button"
              className="admin-report-page-btn"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                handlePageChange(
                  currentPage +
                    1
                )
              }
            >
              <ChevronRight
                size={16}
              />
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");

const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "output", "pdf");
const outputFile = path.join(outputDir, "Healthcare_Monitoring_System_User_Documentation.pdf");

const doc = new jsPDF({ unit: "pt", format: "a4" });
const page = { width: 595.28, height: 841.89 };
const margin = 46;
const contentWidth = page.width - margin * 2;
let y = margin;
let currentPage = 1;

const c = {
  ink: [36, 48, 68], muted: [102, 112, 133], green: [46, 139, 87],
  blue: [31, 111, 139], dark: [18, 59, 70], line: [208, 213, 221],
  soft: [248, 251, 252], mint: [232, 247, 240], sky: [232, 245, 250],
  white: [255, 255, 255], warn: [245, 158, 11], red: [220, 38, 38]
};

function txt(rgb) { doc.setTextColor(...rgb); }
function fill(rgb) { doc.setFillColor(...rgb); }
function stroke(rgb) { doc.setDrawColor(...rgb); }

function footer() {
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); txt(c.muted);
  doc.text("Healthcare Monitoring System - User and System Documentation", margin, page.height - 25);
  doc.text(`Page ${currentPage}`, page.width - margin, page.height - 25, { align: "right" });
}
function addPage() { footer(); doc.addPage(); currentPage += 1; y = margin; }
function ensure(h) { if (y + h > page.height - 58) addPage(); }

function para(text, opt = {}) {
  const size = opt.size || 9.5, leading = opt.leading || 14, width = opt.width || contentWidth;
  doc.setFont("helvetica", opt.font || "normal"); doc.setFontSize(size); txt(opt.color || c.ink);
  const lines = doc.splitTextToSize(String(text), width);
  ensure(lines.length * leading + (opt.after ?? 8));
  doc.text(lines, opt.align === "center" ? page.width / 2 : margin, y, { align: opt.align || "left", lineHeightFactor: leading / size });
  y += lines.length * leading + (opt.after ?? 8);
}
function h1(text) { ensure(36); doc.setFont("helvetica", "bold"); doc.setFontSize(18); txt(c.dark); doc.text(text, margin, y); y += 25; }
function h2(text) { ensure(24); doc.setFont("helvetica", "bold"); doc.setFontSize(12.5); txt(c.blue); doc.text(text, margin, y); y += 18; }
function bullet(items) {
  for (const item of items) {
    const lines = doc.splitTextToSize(item, contentWidth - 18); ensure(lines.length * 13 + 7);
    fill(c.green); doc.circle(margin + 3, y - 3, 2, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.2); txt(c.ink); doc.text(lines, margin + 17, y, { lineHeightFactor: 1.38 });
    y += lines.length * 13 + 5;
  }
  y += 3;
}
function box(x, yy, w, h, title, body, opt = {}) {
  fill(opt.fill || c.white); stroke(opt.stroke || c.line); doc.setLineWidth(0.8); doc.roundedRect(x, yy, w, h, 8, 8, "FD");
  doc.setFont("helvetica", "bold"); doc.setFontSize(opt.titleSize || 10); txt(opt.titleColor || c.dark);
  doc.text(doc.splitTextToSize(title, w - 18), x + 9, yy + 17);
  if (body) { doc.setFont("helvetica", "normal"); doc.setFontSize(opt.bodySize || 8.2); txt(c.muted); doc.text(doc.splitTextToSize(body, w - 18), x + 9, yy + 34, { lineHeightFactor: 1.25 }); }
}
function arrow(x1, y1, x2, y2, color = c.blue) {
  stroke(color); doc.setLineWidth(1.2); doc.line(x1, y1, x2, y2);
  const a = Math.atan2(y2 - y1, x2 - x1), len = 7;
  doc.line(x2, y2, x2 - len * Math.cos(a - 0.45), y2 - len * Math.sin(a - 0.45));
  doc.line(x2, y2, x2 - len * Math.cos(a + 0.45), y2 - len * Math.sin(a + 0.45));
}
function table(headers, rows, widths) {
  const pad = 6, all = [headers, ...rows], total = widths.reduce((a, b) => a + b, 0);
  for (let r = 0; r < all.length; r++) {
    const head = r === 0, row = all[r];
    const wrapped = row.map((cell, i) => { doc.setFont("helvetica", head ? "bold" : "normal"); doc.setFontSize(head ? 8.2 : 8); return doc.splitTextToSize(String(cell), widths[i] - pad * 2); });
    const h = Math.max(25, ...wrapped.map(lines => lines.length * 10 + pad * 2)); ensure(h + 4);
    fill(head ? c.dark : r % 2 === 0 ? c.soft : c.white); doc.rect(margin, y, total, h, "F"); stroke(c.line);
    let x = margin;
    row.forEach((_, i) => { doc.rect(x, y, widths[i], h, "S"); doc.setFont("helvetica", head ? "bold" : "normal"); doc.setFontSize(head ? 8.2 : 8); txt(head ? c.white : c.ink); doc.text(wrapped[i], x + pad, y + pad + 8, { lineHeightFactor: 1.25 }); x += widths[i]; });
    y += h;
  }
  y += 12;
}

function cover() {
  y = 86;
  fill(c.mint); stroke(c.green); doc.roundedRect(68, 72, page.width - 136, 600, 18, 18, "FD");
  stroke(c.green); doc.setLineWidth(2); doc.roundedRect(page.width / 2 - 38, y, 76, 76, 12, 12); doc.setFont("helvetica", "bold"); doc.setFontSize(29); txt(c.green); doc.text("+", page.width / 2, y + 50, { align: "center" });
  y += 128; doc.setFont("helvetica", "bold"); doc.setFontSize(28); txt(c.dark); doc.text("Healthcare Monitoring", page.width / 2, y, { align: "center" }); y += 34; doc.text("System", page.width / 2, y, { align: "center" });
  y += 34; para("Project Documentation", { size: 13, color: c.muted, align: "center", after: 4 }); para("Stakeholders: User and System", { size: 12, color: c.blue, align: "center", font: "bold", after: 26 });
  para("A user-focused web portal for medicine schedules, reminders, inventory, alerts, notifications, profile management, and compliance reporting.", { width: 390, align: "center", size: 10.2, leading: 15, after: 30 });
  const sx = 115, sy = y + 10; box(sx, sy, 105, 74, "User", "Tracks health routine", { fill: c.white, stroke: c.green }); box(sx + 145, sy, 105, 74, "System", "Processes data and alerts", { fill: c.white, stroke: c.blue }); box(sx + 290, sy, 105, 74, "Outcome", "Better medication adherence", { fill: c.white, stroke: c.green }); arrow(sx + 105, sy + 37, sx + 145, sy + 37); arrow(sx + 250, sy + 37, sx + 290, sy + 37);
  y = 704; para("Prepared for project submission and review", { align: "center", color: c.muted, size: 9 }); addPage();
}

function stakeholderDiagram() {
  h1("2. Stakeholder Diagram");
  const top = y + 8, cx = page.width / 2;
  box(cx - 70, top, 140, 58, "Healthcare Monitoring System", "Central portal", { fill: c.sky, stroke: c.blue, titleSize: 9.5 });
  box(margin, top + 104, 170, 80, "User", "Registers, logs in, completes profile, adds medicines, manages reminders, checks stock, views alerts and reports.", { fill: c.white, stroke: c.green });
  box(page.width - margin - 170, top + 104, 170, 80, "System", "Validates forms, authenticates requests, stores session state, calls APIs, updates dashboard data, and displays reports.", { fill: c.white, stroke: c.blue });
  arrow(margin + 170, top + 145, cx - 70, top + 40, c.green); arrow(cx + 70, top + 40, page.width - margin - 170, top + 145, c.blue);
  y = top + 215;
}

function userJourney() {
  h1("5. User Journey Flow");
  const x = margin, w = 92, h = 54, gap = 10, top = y + 4;
  const steps = [["Register", "Create account"], ["Verify/Login", "Access portal"], ["Profile", "Add health details"], ["Medicines", "Set dose plan"], ["Reminders", "Take or snooze"], ["Reports", "Review progress"]];
  steps.forEach((s, i) => { box(x + i * (w + gap), top, w, h, s[0], s[1], { fill: i % 2 ? c.sky : c.mint, stroke: i % 2 ? c.blue : c.green, bodySize: 7.4 }); if (i < steps.length - 1) arrow(x + i * (w + gap) + w, top + 27, x + (i + 1) * (w + gap), top + 27); });
  y = top + 88;
}

function moduleMap() {
  h1("4. User Module Map");
  const modules = ["Authentication", "Dashboard", "Profile", "Medicine Management", "Reminders", "Inventory", "Alerts", "Notifications", "Reports"];
  const cols = 3, w = 155, h = 50, gapX = 19, gapY = 14, top = y;
  modules.forEach((m, i) => { const col = i % cols, row = Math.floor(i / cols); box(margin + col * (w + gapX), top + row * (h + gapY), w, h, m, moduleDesc(m), { fill: i % 2 ? c.sky : c.mint, stroke: i % 2 ? c.blue : c.green, bodySize: 7.4 }); });
  y = top + 3 * (h + gapY) + 12;
}
function moduleDesc(m) {
  return ({ Authentication: "Account access", Dashboard: "Daily overview", Profile: "Health details", "Medicine Management": "Dose setup", Reminders: "Taken/snooze/history", Inventory: "Stock tracking", Alerts: "Important warnings", Notifications: "User messages", Reports: "Compliance stats" })[m];
}

function architectureDiagram() {
  h1("8. System Architecture Diagram");
  const top = y + 6;
  box(margin, top, 130, 72, "React UI", "Screens and reusable components", { fill: c.mint, stroke: c.green });
  box(margin + 185, top, 130, 72, "Axios Layer", "Base URL, public routes, Bearer token", { fill: c.sky, stroke: c.blue });
  box(margin + 370, top, 130, 72, "Backend APIs", "Auth, profile, medicine, reminders, stock, reports", { fill: c.white, stroke: c.dark });
  arrow(margin + 130, top + 36, margin + 185, top + 36); arrow(margin + 315, top + 36, margin + 370, top + 36);
  box(margin + 95, top + 124, 130, 58, "Browser Session", "Token and UI state", { fill: c.white, stroke: c.line });
  box(margin + 280, top + 124, 130, 58, "Dashboard State", "Summary, calendar, lists", { fill: c.white, stroke: c.line });
  arrow(margin + 82, top + 72, margin + 145, top + 124, c.green); arrow(margin + 250, top + 72, margin + 330, top + 124, c.blue);
  y = top + 216;
}

function dataFlowDiagram() {
  h1("10. Data Flow Diagram");
  const top = y + 4;
  box(margin, top, 120, 56, "User Action", "Login, add medicine, mark dose", { fill: c.mint, stroke: c.green });
  box(margin + 160, top, 120, 56, "Validation", "Forms and required data", { fill: c.white, stroke: c.line });
  box(margin + 320, top, 120, 56, "API Request", "Authorized backend call", { fill: c.sky, stroke: c.blue });
  box(margin + 190, top + 98, 120, 56, "UI Update", "Dashboard, alerts, reports", { fill: c.white, stroke: c.green });
  arrow(margin + 120, top + 28, margin + 160, top + 28); arrow(margin + 280, top + 28, margin + 320, top + 28); arrow(margin + 380, top + 56, margin + 310, top + 98); arrow(margin + 190, top + 126, margin + 120, top + 56, c.green);
  y = top + 185;
}

cover();
h1("1. Introduction");
para("Healthcare Monitoring System is a web application designed to help a user manage daily medicines, reminders, medicine stock, alerts, profile details, notifications, and health compliance reports from a single portal. The system focuses on making routine health tracking simple, timely, and organized.");
h2("Purpose");
para("This documentation explains the project from the User and System perspective only. It is suitable for project submission, review, and future maintenance.");
h2("Scope");
bullet(["User registration, email verification, login, forgot password, reset password, and logout.", "Profile completion and health detail management.", "Medicine scheduling with dosage, frequency, timing, start date, and notes.", "Reminder tracking with taken, snooze, history, and delete actions.", "Inventory tracking with low-stock and out-of-stock status.", "Alerts, notifications, and compliance reports."]);
stakeholderDiagram();
h1("3. Project Objectives");
bullet(["Provide a simple responsive portal for personal healthcare and medicine tracking.", "Reduce missed doses through reminder visibility and alerts.", "Help the user maintain medicine availability through stock status.", "Show health compliance through taken and missed dose reports.", "Keep protected requests secured through token-based API access."]);
moduleMap();
userJourney();

h1("6. Functional Requirements");
table(["ID", "Requirement"], [["FR-01", "User can register with full name, email, mobile number, password, and confirm password."], ["FR-02", "System validates email, mobile number, password strength, and password match."], ["FR-03", "User can login and the system stores authenticated session details."], ["FR-04", "User can complete and update profile details."], ["FR-05", "User can add, edit, search, and delete medicines."], ["FR-06", "System displays today's schedule, reminders, and calendar status."], ["FR-07", "User can mark reminders as taken, snooze reminders, or delete them."], ["FR-08", "User can add, edit, delete, search, sort, and paginate inventory records."], ["FR-09", "User can read alerts and manage notifications."], ["FR-10", "System displays compliance and inventory report statistics."]], [55, contentWidth - 55]);
h1("7. Technology Stack");
bullet(["React 19 is used for component-based frontend development.", "Vite is used for development server and production build.", "Axios handles API communication and authorization headers.", "Lucide React and React Icons provide UI icon support.", "CSS files define responsive screens, forms, cards, tables, modals, and charts.", "localStorage is used only for browser session state and user interface cache."]);
architectureDiagram();
h1("9. API Endpoints Used By User Features");
table(["Method", "Endpoint", "Purpose"], [["POST", "/api/auth/register", "Create user account."], ["GET", "/api/auth/verify-email", "Verify registered email."], ["POST", "/api/auth/login", "Authenticate user and return token."], ["POST", "/api/auth/forgot-password", "Send reset password link."], ["POST", "/api/auth/reset-password", "Reset password using token."], ["PUT", "/api/profile", "Complete or update user profile."], ["GET/POST/PUT/DELETE", "/api/medicines", "Manage medicine records."], ["GET/PATCH/DELETE", "/api/reminders", "Read, mark, snooze, and delete reminders."], ["GET/POST/PUT/DELETE", "/api/inventory", "Manage stock records."], ["GET/PATCH", "/api/alerts", "Read alerts and mark as read."], ["GET/PATCH/DELETE", "/api/notifications", "Manage notifications."], ["GET", "/api/reports/compliance", "Get compliance and stock report data."]], [75, 190, contentWidth - 265]);
dataFlowDiagram();

h1("11. Data Design");
para("The user-facing system works with user, profile, medicine, reminder, inventory, alert, notification, and report data. The frontend communicates with backend API endpoints through a centralized Axios integration layer.");
table(["Entity", "Important Fields"], [["User", "fullName, email, mobile, token"], ["Profile", "age, gender, disease, emergency contacts, completion status"], ["Medicine", "medicineName, dosage, frequency, timings, startDate, notes"], ["Reminder", "medicineId, medicineName, dosage, date, time, status"], ["Inventory", "medicineName, currentStock, minimumStock, expiryDate, stockStatus"], ["Alert", "medicine, type, date/time, status, message"], ["Notification", "type, title, message, status, createdAt"], ["Report", "compliancePercentage, takenCount, missedCount, lowStockCount, outOfStockCount"]], [115, contentWidth - 115]);
h1("12. Validation Rules");
bullet(["Full name is required during registration.", "Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9.", "Email must follow valid email format.", "Password must contain at least 8 characters, one uppercase letter, one number, and one special character.", "Password cannot contain spaces and confirm password must match.", "Medicine and stock forms validate required fields before saving."]);
h1("13. User Interface Design");
bullet(["Healthcare-oriented green and blue visual identity.", "Dashboard provides summary cards, daily schedule, inventory overview, medicine list, and calendar.", "Sidebar navigation opens Home, Profile, Medicines, Reminders, Alerts, Reports, Inventory, and Logout.", "Modal forms are used for adding medicines, adding stock, completing profile, and confirming logout.", "Toast messages provide success and error feedback.", "Responsive layout supports desktop and mobile screens."]);
h1("14. Testing Scope");
bullet(["Authentication: registration validation, login, forgot password, reset password, logout, and session clearing.", "Profile: required fields, contact validation, save, and update.", "Medicines: add, edit, search, notes, frequency, timing, pagination, and delete.", "Reminders: display window, taken, snooze, history, and delete.", "Inventory: add stock, edit stock, delete stock, sorting, search, status chart, and low-stock calculation.", "Alerts and notifications: load, filter, search, mark read, dismiss, and clear.", "Reports: compliance percentage, taken/missed count, low-stock count, and out-of-stock count."]);
h1("15. Limitations");
bullet(["Actual email verification and password reset require backend and email service integration.", "Real-time alerts depend on backend availability and refresh behavior.", "The system supports tracking and reminders only; it does not provide medical advice."]);
h1("16. Future Enhancements");
bullet(["Add real-time push notifications for medicine reminders.", "Add downloadable reports in PDF or CSV format.", "Add wearable device integration for vitals tracking.", "Add caregiver sharing with explicit user consent.", "Add refill prediction based on stock and daily dosage.", "Add multilingual support for wider accessibility."]);
h1("17. Conclusion");
para("Healthcare Monitoring System provides a focused user portal for medicine management, reminders, inventory tracking, alerts, notifications, and compliance reporting. With User and System as the only documented stakeholders, the project remains centered on personal healthcare tracking and operational system support.");

footer(); fs.mkdirSync(outputDir, { recursive: true }); fs.writeFileSync(outputFile, Buffer.from(doc.output("arraybuffer"))); console.log(outputFile);

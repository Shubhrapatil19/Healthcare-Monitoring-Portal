## Plan: Sidebar smoothly open/close

### Information gathered
- `src/Pages/User/UserDash.jsx` uses `sidebarOpen` state toggled by Menu icon.
- Sidebar markup: `<aside className={
  `sidebar ${sidebarOpen ? "sidebar-open" : ""}`
} > ...`.
- `src/Pages/User/UserDash.css` already has:
  - `.sidebar` with `transition: width 0.4s ...`
  - collapsed styles via `.sidebar:not(.sidebar-open) { width: 80px; }`
  - main-content shift via selector `.sidebar:not(.sidebar-open) ~ .main-content { margin-left:80px; width:calc(100% - 80px); }`

### Likely root cause
- CSS rule `.sidebar:not(.sidebar-open) ~ .main-content` is fragile because `.main-content` is inside the same `.dashboard-body` container but the sibling combinator depends on exact DOM order.
- Also `.sidebar` is `position: fixed`, while `.main-content` is not; main-content transition may not align with sidebar width transition (perceived jump).

### Plan (file-level)
1. Update `src/Pages/User/UserDash.css`:
   - Add explicit transition for `margin-left`, `width`, and (optionally) `transform` for smoother layout shift.
   - Replace fragile sibling selector with a class-based approach:
     - Add/remove a class on the parent container (e.g., `.dashboard-body`) based on sidebarOpen.
     - Or adjust selector to correctly target `.main-content` relative to `.dashboard-body`.
   - Ensure `.sidebar` uses consistent width values for open/collapsed states:
     - open: 270px
     - closed: 80px
2. Update `src/Pages/User/UserDash.jsx`:
   - Apply a wrapper class such as `dashboard-body sidebar-open` or `dashboard-body sidebar-closed`.
3. Test:
   - Run `npm run dev` (or existing command) and verify toggle animates smoothly.

### Dependent files to edit
- `src/Pages/User/UserDash.jsx`
- `src/Pages/User/UserDash.css`

### Followup steps
- Open app, click sidebar toggle repeatedly; confirm no jump.
- If still not smooth: add `will-change` and consider using `transform: translateX()` for sidebar instead of width.

<ask_followup_question>
Proceed to implement class-based CSS + adjust transitions? (Yes/No)
</ask_followup_question>


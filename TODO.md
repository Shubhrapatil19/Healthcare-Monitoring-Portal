# Tasks

## Task 1: Show stock data in table format in Inventory Overview card
- [x] Add `stockItems` state variable in UserDash.jsx
- [x] Create `handleAddStock` function to capture stock data from AddStockModal
- [x] Update AddStockModal's onClose to use `handleAddStock`
- [x] Replace empty state in Inventory Overview with stock data table (using existing `.stock-table` CSS classes)
- [x] Keep "Add Medicine Stock" button at bottom when items exist

## Task 2: Wire View Report button to open UserViewRep page
- [x] Add `showViewReport` state in UserDash.jsx
- [x] Import `UserViewRep` component
- [x] Pass `onViewReport` prop to `UserReport` that sets `showViewReport` to true
- [x] When `showViewReport` is true, render `UserViewRep` component with `onBack` prop to go back

## Task 3: Modernize UserViewRep page design
- [x] Modern cards with gradient accents and hover effects
- [x] Improved heading fonts with decorative underline
- [x] Teal gradient header top border on report-header-section
- [x] Soft shadow system with hover elevation
- [x] Summary cards with left accent bar and icon rotation on hover
- [x] Section headers with gradient bottom border
- [x] Enhanced table styling with teal header row
- [x] Status badges with gradient backgrounds
- [x] Modern back button with gradient hover effect
- [x] Consistent responsive design across all breakpoints


Build error fix

Symptom (from `npm run build`):
[UNRESOLVED_IMPORT] Could not resolve '../assets/react.svg' in src/Pages/User/UserDash.jsx

Cause:
UserDash.jsx imports logo from "../assets/react.svg", but src/assets/ contains react.svg (not located at src/Pages/assets).

Fix options:
1) Change import path in UserDash.jsx to "../assets/react.svg" -> "../../assets/react.svg" (since UserDash.jsx is in src/Pages/User).
2) Or move/duplicate react.svg into the expected folder.

Recommended:
Option (1): update the import path to correctly reference src/assets/react.svg.


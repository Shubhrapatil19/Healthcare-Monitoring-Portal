const fs = require("fs");
const path = "src/Pages/User/UserDash.css";
const css = fs.readFileSync(path, "utf8");
console.log("File length:", css.length);
console.log("First 100 chars:", css.substring(0, 100));
// Find old stats section
const marker = "STATS";
const idx = css.indexOf(marker);
console.log("STATS at index:", idx);
if (idx > 0) {
  console.log("Context:", css.substring(idx - 10, idx + 40));
}

const fs = require("fs");
const path = "src/Pages/User/UserDash.css";
let css = fs.readFileSync(path, "utf8");

// Find old and new stats sections
const marker = "/* ================= STATS ================= */";
const rowMarker = "/* ================= ROW ================= */";

let firstStat = css.indexOf(marker);
let secondStat = css.indexOf(marker, firstStat + 10);
let rowIdx = css.indexOf(rowMarker);

console.log("First STATS:", firstStat);
console.log("Second STATS:", secondStat);
console.log("ROW:", rowIdx);

if (secondStat > 0 && rowIdx > secondStat) {
  // Keep everything before first STATS, then the new section (from second STATS), then after ROW
  let result = css.substring(0, firstStat) + css.substring(secondStat, rowIdx) + css.substring(rowIdx);
  fs.writeFileSync(path, result, "utf8");
  console.log("Fixed! New length:", result.length);
} else {
  console.log("Could not find duplicates properly");
  if (rowIdx > firstStat) {
    // Only one section, just remove what's between first STATS and ROW
    // (keeping the good section that was inserted after)
  }
}

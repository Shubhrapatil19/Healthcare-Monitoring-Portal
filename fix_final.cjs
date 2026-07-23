const fs = require("fs");
const path = "c:/HMS Web App/Healthcare-Monitoring-Portal/src/Pages/User/UserInvent.jsx";

// Check current content
let c = fs.readFileSync(path, "utf8");
const open = (c.match(/<div[^>]>/g) || []).length + (c.match(/<div\s/g) || []).length;
const close = (c.match(/<\/div>/g) || []).length;
console.log("Current state - open divs:", open, "closed divs:", close, "diff:", open - close);

// Show all lines with content
const lines = c.split("\n");
lines.forEach((line, i) => {
  if (line.includes("div")) {
    console.log((i+1) + ": " + line.trim());
  }
});

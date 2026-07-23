const fs = require("fs");
const path = "c:/HMS Web App/Healthcare-Monitoring-Portal/src/Pages/User/UserInvent.jsx";
let c = fs.readFileSync(path, "utf8");

// Remove stray closing div inside chart-bars
c = c.replace(
  '<div className="chart-bars">\n              </div>',
  '<div className="chart-bars">'
);

// Add missing </div> after In Stock bar-group
c = c.replace(
  '({chartCounts.inStockCount})</div>\n              <div className="bar-group">',
  '({chartCounts.inStockCount})</div>\n              </div>\n              <div className="bar-group">'
);

// Add missing </div> after Low Stock bar-group  
c = c.replace(
  '({chartCounts.lowStockCount})</div>\n              <div className="bar-group">',
  '({chartCounts.lowStockCount})</div>\n              </div>\n              <div className="bar-group">'
);

// Fix the bar-chart/legend structure - add missing closing for chart-legend and opening bar-chart
c = c.replace(
  '</div>\n          <div className="y-axis"',
  '</div>\n          <div className="bar-chart" aria-label="Stock status chart">\n            <div className="y-axis"'
);

fs.writeFileSync(path, c, "utf8");
const open = (c.match(/<div[^>]/g) || []).length;
const close = (c.match(/<\/div>/g) || []).length;
console.log("open=" + open + " closed=" + close + " diff=" + (open - close));

const fs = require('fs');
const path = 'c:/HMS Web App/Healthcare-Monitoring-Portal/src/Pages/User/UserInvent.jsx';

let c = fs.readFileSync(path, 'utf8');

// Fix 1: Add missing closing </div> for bar-group before Low Stock bar-group
c = c.replace(
  '<div className="bar-label">Low Stock ({chartCounts.lowStockCount})</div>\n              <div className="bar-group">',
  '<div className="bar-label">Low Stock ({chartCounts.lowStockCount})</div>\n              </div>\n              <div className="bar-group">'
);

// Fix 2: Add missing closing </div> tags for last bar-group, chart-bars, bar-chart, chart-container, stock-status-section
c = c.replace(
  '<div className="bar-label">Out of Stock ({chartCounts.outStockCount})</div>\n            </div>\n        </div>',
  '<div className="bar-label">Out of Stock ({chartCounts.outStockCount})</div>\n              </div>\n            </div>\n          </div>'
);

// Fix 3: Add bar-chart wrapper and missing </div> for chart-legend
c = c.replace(
  '<div className="chart-legend" aria-label="Stock status legend">\n            <div className="legend-item"><span className="legend-color in-stock" aria-hidden /><span>In Stock</span></div>\n            <div className="legend-item"><span className="legend-color low-stock" aria-hidden /><span>Low Stock</span></div>\n            <div className="legend-item"><span className="legend-color out-of-stock" aria-hidden /><span>Out of Stock</span></div>\n\n            <div className="y-axis"',
  '<div className="chart-legend" aria-label="Stock status legend">\n            <div className="legend-item"><span className="legend-color in-stock" aria-hidden /><span>In Stock</span></div>\n            <div className="legend-item"><span className="legend-color low-stock" aria-hidden /><span>Low Stock</span></div>\n            <div className="legend-item"><span className="legend-color out-of-stock" aria-hidden /><span>Out of Stock</span></div>\n          </div>\n          <div className="bar-chart" aria-label="Stock status chart">\n            <div className="y-axis"'
);

fs.writeFileSync(path, c, 'utf8');
const lines = c.split('\n').length;
const openDivs = (c.match(/<div/g) || []).length;
const closeDivs = (c.match(/<\/div>/g) || []).length;
console.log('OK: lines=' + lines + ' openDivs=' + openDivs + ' closeDivs=' + closeDivs);
if (openDivs === closeDivs) console.log('SUCCESS: All divs properly closed!');
else console.log('WARNING: Mismatch - need to fix ' + (openDivs - closeDivs) + ' divs');

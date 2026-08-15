const fs = require('fs');
const path = require('path');

// Read the PNG file
const faviconPath = path.join(__dirname, 'public', 'favicon.png');
const data = fs.readFileSync(faviconPath);

// Parse PNG header to get dimensions
// PNG format: 8-byte signature, then IHDR chunk (4-byte length, 4-byte type, then width/height)
const width = data.readUInt32BE(16);
const height = data.readUInt32BE(20);

console.log(`Current favicon dimensions: ${width}x${height}`);
console.log(`Current favicon file size: ${data.length} bytes`);
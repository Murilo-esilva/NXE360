const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT_DIR = __dirname; // Serve entire workspace

const server = http.createServer((req, res) => {
  // Parse URL and remove query strings
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/src/index.html';
  
  let filePath = path.join(ROOT_DIR, urlPath);
  
  // Normalize path and prevent directory traversal attacks
  filePath = path.normalize(filePath);
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found: ' + req.url);
    return;
  }

  // If it's a directory, try to serve index.html
  if (fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
  }

  // Determine content type
  const ext = path.extname(filePath).toLowerCase();
  const contentTypeMap = {
    '.html': 'text/html;charset=utf-8',
    '.js': 'application/javascript;charset=utf-8',
    '.css': 'text/css;charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.mjs': 'application/javascript;charset=utf-8'
  };

  const contentType = contentTypeMap[ext] || 'application/octet-stream';

  // Set CORS and caching headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache');

  // Serve the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server Error: ' + err.message);
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║         NXE Dashboard Test Server Started                  ║
╚════════════════════════════════════════════════════════════╝

🎮 Open your browser and navigate to:

   http://localhost:${PORT}

⌨️  Controls:
   - Left/Right Arrow Keys: Navigate cards
   - Space/Enter: Select card
   - Escape: Back

📊 Features:
   - Three.js 3D scene (1920×1080)
   - Reflective floor (Y = -2.2)
   - 8 interactive cards with "Twist" perspective
   - Bokeh particle background
   - NXE color palette and materials
   - Keyboard navigation + audio

📁 Serving from: ${ROOT_DIR}

Press Ctrl+C to stop the server.
  `);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try another port.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

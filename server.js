const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const HOST = '127.0.0.1';
const ROOT_DIR = __dirname;
const ALLOWED_ROOTS = [
  path.join(ROOT_DIR, 'src'),
  path.join(ROOT_DIR, '_reference_material'),
  path.join(ROOT_DIR, 'pegasus-theme-npe'),
  path.join(ROOT_DIR, 'xbox-360-dash'),
  path.join(ROOT_DIR, 'node_modules', 'three')
].map((dir) => path.resolve(dir));

function isWithin(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

function isAllowedPath(filePath) {
  return ALLOWED_ROOTS.some((allowedRoot) => isWithin(allowedRoot, filePath));
}

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

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, `http://${HOST}:${PORT}`).pathname);
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request');
    return;
  }

  if (urlPath === '/') urlPath = '/src/index.html';

  let filePath = path.resolve(ROOT_DIR, `.${urlPath}`);

  if (!isAllowedPath(filePath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`Not Found: ${req.url}`);
    return;
  }

  if (fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
    if (!isAllowedPath(filePath) || !fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = contentTypeMap[ext] || 'application/octet-stream';

  res.setHeader('Access-Control-Allow-Origin', `http://${HOST}:${PORT}`);
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache');

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Server Error: ${err.message}`);
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(req.method === 'HEAD' ? null : data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`
NXE Dashboard Test Server Started

Open your browser and navigate to:

   http://${HOST}:${PORT}

Controls:
   - Left/Right Arrow Keys: Navigate cards
   - Space/Enter: Select card
   - Escape: Back

Serving allowed app paths from: ${ROOT_DIR}

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

// Serves dist/ under the same /critique-ai/ path GitHub Pages uses, so a local
// check catches base-path mistakes that a root-served preview would hide.

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = '/critique-ai';
const PORT = process.env.PORT || 4173;
const dist = path.join(__dirname, '..', 'dist');

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.ico': 'image/x-icon', '.map': 'application/json',
  '.ttf': 'font/ttf', '.css': 'text/css',
};

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') {
    res.writeHead(302, { Location: BASE + '/' });
    return res.end();
  }
  let rel = url.startsWith(BASE) ? url.slice(BASE.length) : url;
  if (rel === '' || rel === '/') rel = '/index.html';

  const file = path.join(dist, rel);
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    // Single-page export: unknown paths fall back to the app shell.
    const fallback = fs.readFileSync(path.join(dist, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(fallback);
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Pages preview: http://localhost:${PORT}${BASE}/`));

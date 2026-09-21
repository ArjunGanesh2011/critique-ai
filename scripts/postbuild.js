// Turns the plain Expo web export into an installable, Pages-friendly site:
// adds the manifest + iOS home-screen tags, a 404 fallback for deep links,
// and .nojekyll so GitHub serves the _expo/ folder.

const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const indexPath = path.join(dist, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html missing — run the export first.');
  process.exit(1);
}

const head = `
    <link rel="manifest" href="manifest.json" />
    <link rel="apple-touch-icon" href="apple-touch-icon.png" />
    <link rel="icon" href="favicon.png" />
    <meta name="theme-color" content="#0b0f17" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Critique" />
`;

let html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', head + '  </head>');
}

// viewport-fit=cover exposes the real safe-area insets to the app, which the
// tab bar uses to keep clear of the home indicator and rounded corners.
if (!html.includes('viewport-fit=cover')) {
  html = html.replace(
    /(<meta name="viewport" content="[^"]*)"/,
    '$1, viewport-fit=cover"'
  );
}

fs.writeFileSync(indexPath, html);

// Single-page export: any unknown path must fall back to the app shell.
fs.writeFileSync(path.join(dist, '404.html'), html);
fs.writeFileSync(path.join(dist, '.nojekyll'), '');

console.log('postbuild: manifest tags injected, 404.html and .nojekyll written');

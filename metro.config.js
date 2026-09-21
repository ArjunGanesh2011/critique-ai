// Web-only resolver tweak.
// zustand v4 ships an ESM build that reads `import.meta.env`, which a classic
// <script> bundle cannot evaluate — the web app dies with a SyntaxError before
// rendering. Its CommonJS build is identical apart from that guard, so point
// the web platform straight at those files.

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const zustandDir = path.dirname(require.resolve('zustand/package.json'));
const ZUSTAND_CJS = {
  zustand: path.join(zustandDir, 'index.js'),
  'zustand/middleware': path.join(zustandDir, 'middleware.js'),
  'zustand/vanilla': path.join(zustandDir, 'vanilla.js'),
};

const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && ZUSTAND_CJS[moduleName]) {
    return { type: 'sourceFile', filePath: ZUSTAND_CJS[moduleName] };
  }
  return (upstream || context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;

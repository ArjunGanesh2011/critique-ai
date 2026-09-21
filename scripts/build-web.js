// One cross-platform command for the GitHub Pages build.
// EXPO_NO_DOTENV keeps .env out of the bundle: this output is published
// publicly, so no key from the local environment may be inlined into it.

const { spawnSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
// Only npx needs a shell; node is invoked by its absolute path, which on
// Windows contains spaces and would be mangled by shell word-splitting.
const run = (cmd, args, { shell = false, env } = {}) => {
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell,
    env: { ...process.env, ...env },
  });
  if (r.status !== 0) process.exit(r.status || 1);
};

run(process.execPath, ['scripts/make-icons.js']);
run('npx', ['expo', 'export', '--platform', 'web', '--output-dir', 'dist'], {
  shell: process.platform === 'win32',
  env: { EXPO_NO_DOTENV: '1' },
});
run(process.execPath, ['scripts/postbuild.js']);

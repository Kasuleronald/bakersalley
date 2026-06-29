import { watch } from 'node:fs';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const cwd = process.cwd();
const remote = process.env.AUTO_SYNC_REMOTE || 'origin';
const debounceMs = Number(process.env.AUTO_SYNC_DEBOUNCE_MS || 8000);

const runGit = (args, allowFail = false) => {
  const res = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (res.status !== 0 && !allowFail) {
    const err = (res.stderr || res.stdout || '').trim() || `git ${args.join(' ')} failed`;
    throw new Error(err);
  }
  return {
    ok: res.status === 0,
    stdout: (res.stdout || '').trim(),
    stderr: (res.stderr || '').trim(),
  };
};

const getBranch = () => {
  const envBranch = process.env.AUTO_SYNC_BRANCH;
  if (envBranch) return envBranch;
  const res = runGit(['branch', '--show-current']);
  return res.stdout || 'main';
};

const branch = getBranch();

const ignoredPath = (filePath = '') => {
  const p = filePath.replace(/\\/g, '/');
  return (
    p.startsWith('.git/') ||
    p.startsWith('node_modules/') ||
    p.startsWith('dist/') ||
    p.startsWith('.vite/') ||
    p.startsWith('.DS_Store')
  );
};

const nowStamp = () => new Date().toISOString().replace('T', ' ').replace('Z', ' UTC');

let timer = null;
let syncing = false;
let runAgain = false;

const hasChanges = () => {
  const res = runGit(['status', '--porcelain'], true);
  return Boolean(res.stdout);
};

const syncOnce = () => {
  if (syncing) {
    runAgain = true;
    return;
  }

  syncing = true;
  try {
    if (!hasChanges()) return;

    runGit(['add', '-A']);

    const commitMsg = `auto-sync: ${nowStamp()}`;
    const commitRes = runGit(['commit', '-m', commitMsg], true);

    if (!commitRes.ok) {
      const combined = `${commitRes.stdout} ${commitRes.stderr}`.toLowerCase();
      if (combined.includes('nothing to commit')) return;
      throw new Error(commitRes.stderr || commitRes.stdout || 'auto-commit failed');
    }

    runGit(['push', remote, branch]);
    console.log(`[auto-sync] pushed to ${remote}/${branch} at ${nowStamp()}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[auto-sync] ${message}`);
  } finally {
    syncing = false;
    if (runAgain) {
      runAgain = false;
      scheduleSync();
    }
  }
};

const scheduleSync = () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(syncOnce, debounceMs);
};

console.log(`[auto-sync] watching ${cwd}`);
console.log(`[auto-sync] remote=${remote} branch=${branch} debounce=${debounceMs}ms`);

watch(
  cwd,
  { recursive: true },
  (_event, filename) => {
    if (!filename || ignoredPath(filename)) return;
    scheduleSync();
  }
);

process.on('SIGINT', () => {
  console.log('\n[auto-sync] stopped');
  process.exit(0);
});

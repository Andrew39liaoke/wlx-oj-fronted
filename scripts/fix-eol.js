const fs = require('fs').promises;
const path = require('path');

// Extensions to process
const TARGET_EXTS = new Set([
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.vue',
  '.json',
  '.css',
  '.scss',
  '.html',
  '.md',
  '.mdx',
  '.yml',
  '.yaml',
  '.svg',
  '.txt',
]);

// Directories to skip
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build']);

const dryRun = process.argv.includes('--dry-run');
const root = process.cwd();

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const name = ent.name;
    const full = path.join(dir, name);

    if (ent.isDirectory()) {
      if (IGNORE_DIRS.has(name)) continue;
      await walk(full);
      continue;
    }

    if (!ent.isFile()) continue;

    const ext = path.extname(name).toLowerCase();
    if (!TARGET_EXTS.has(ext)) return await; // safeguard (shouldn't happen)
  }
}

async function processFile(file) {
  try {
    const content = await fs.readFile(file, 'utf8');
    const normalized = content.replace(/\r?\n/g, '\r\n');
    if (normalized !== content) {
      if (dryRun) {
        console.log('[dry] would fix EOL:', path.relative(root, file));
      } else {
        await fs.writeFile(file, normalized, 'utf8');
        console.log('fixed EOL:', path.relative(root, file));
      }
    }
  } catch (err) {
    console.error('error processing', file, err.message);
  }
}

async function walkAndFix(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const name = ent.name;
    const full = path.join(dir, name);

    if (ent.isDirectory()) {
      if (IGNORE_DIRS.has(name)) continue;
      await walkAndFix(full);
      continue;
    }

    if (!ent.isFile()) continue;

    const ext = path.extname(name).toLowerCase();
    if (!TARGET_EXTS.has(ext)) continue;

    await processFile(full);
  }
}

(async () => {
  console.log('root:', root);
  console.log('dryRun:', dryRun ? 'true' : 'false');
  try {
    await walkAndFix(root);
    console.log('done');
  } catch (err) {
    console.error('unexpected error:', err);
    process.exitCode = 2;
  }
})();


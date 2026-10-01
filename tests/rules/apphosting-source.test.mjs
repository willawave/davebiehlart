// Guards the App Hosting upload: `firebase deploy --only apphosting` zips the repo minus
// firebase.json's `apphosting.ignore` (gitignore rules, so an unanchored "dist" also drops
// brand/dist), and App Hosting builds `web` from that zip. A missing asset input builds fine
// and 404s in production, as the favicons and mark once did.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { before, describe, test } from 'node:test';

// The CLI's own directory walk, so this test applies the ignore rules exactly as a deploy does.
const { readdirRecursive } = createRequire(import.meta.url)('firebase-tools/lib/fsAsync.js');

const root = process.cwd();
const [backend] = JSON.parse(readFileSync('firebase.json', 'utf8')).apphosting;

// Inputs the web build copies as assets (angular.json → web → assets), outside build output.
const ASSET_DIRS = ['brand/dist/icons', 'projects/web/public'];

function filesIn(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(root, join(entry.parentPath, entry.name)));
}

describe('App Hosting source upload', () => {
  let uploaded;

  before(async () => {
    const files = await readdirRecursive({
      path: root,
      ignoreStrings: backend.ignore,
      supportGitIgnore: true,
    });
    uploaded = new Set(files.map((file) => relative(root, file.name)));
  });

  test('includes every asset the web build copies', () => {
    const missing = ASSET_DIRS.flatMap(filesIn).filter((file) => !uploaded.has(file));
    assert.deepEqual(missing, []);
  });

  test('includes the sources App Hosting builds from', () => {
    for (const file of ['package.json', 'pnpm-lock.yaml', 'angular.json', 'apphosting.yaml']) {
      assert.ok(uploaded.has(file), `${file} is not uploaded`);
    }
  });

  test('leaves out build output, dependencies, tests and seed data', () => {
    const leaked = [...uploaded].filter((file) =>
      /^(dist|node_modules|e2e|tests|emulator-data|coverage)\//.test(file),
    );
    assert.deepEqual(leaked.slice(0, 5), []);
  });
});

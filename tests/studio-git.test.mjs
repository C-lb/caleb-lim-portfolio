import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { publish } from '../scripts/studio/git.mjs';
const run = promisify(execFile);

async function setupRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'gitpub-'));
  const repo = path.join(root, 'work');
  const remote = path.join(root, 'remote.git');
  await fs.mkdir(repo, { recursive: true });
  await run('git', ['init', '--bare', remote]);
  await run('git', ['init', '-b', 'main', repo]);
  await run('git', ['config', 'user.email', 't@t.test'], { cwd: repo });
  await run('git', ['config', 'user.name', 'Test'], { cwd: repo });
  await fs.writeFile(path.join(repo, 'seed.txt'), 'seed');
  await run('git', ['add', '-A'], { cwd: repo });
  await run('git', ['commit', '-m', 'seed'], { cwd: repo });
  await run('git', ['remote', 'add', 'origin', remote], { cwd: repo });
  await run('git', ['push', '-u', 'origin', 'main'], { cwd: repo });
  return { root, repo };
}

test('publish commits and pushes new work', async () => {
  const { root, repo } = await setupRepo();
  try {
    await fs.writeFile(path.join(repo, 'new.txt'), 'hello');
    const r = await publish({ cwd: repo, message: 'Add piece: Foo' });
    assert.equal(r.committed, true);
    assert.equal(r.pushed, true);
    assert.equal(r.branch, 'main');
    const { stdout } = await run('git', ['log', '--oneline'], { cwd: repo });
    assert.match(stdout, /Add piece: Foo/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('publish reports nothing to commit', async () => {
  const { root, repo } = await setupRepo();
  try {
    const r = await publish({ cwd: repo, message: 'noop' });
    assert.equal(r.committed, false);
    assert.match(r.detail, /nothing to (commit|publish)/i);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

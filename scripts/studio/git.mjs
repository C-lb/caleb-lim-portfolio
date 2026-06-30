// scripts/studio/git.mjs
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

export async function uncommittedCount(cwd = process.cwd()) {
  const { stdout } = await run('git', ['status', '--porcelain'], { cwd });
  return stdout.split('\n').filter((l) => l.trim()).length;
}

async function currentBranch(cwd) {
  const { stdout } = await run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd });
  return stdout.trim();
}

export async function publish({ cwd = process.cwd(), message }) {
  const branch = await currentBranch(cwd);
  if ((await uncommittedCount(cwd)) === 0) {
    return { committed: false, branch, pushed: false, detail: 'Nothing to publish (no changes).' };
  }
  await run('git', ['add', '-A'], { cwd });
  await run('git', ['commit', '-m', message], { cwd });
  try {
    await run('git', ['push', 'origin', branch], { cwd });
    return { committed: true, branch, pushed: true, detail: `Pushed ${branch}. Live in ~1 min.` };
  } catch (err) {
    const stderr = String(err.stderr || err.message);
    let hint = stderr;
    if (/\[rejected\]|non-fast-forward|fetch first/i.test(stderr)) {
      hint = `${branch} has moved on the remote. Pull and resolve before publishing again (your commit is saved locally).`;
    } else if (/could not read|authentication|permission|Could not resolve host/i.test(stderr)) {
      hint = `Push failed (network or auth). Your commit is saved locally; retry Publish when connected.\n${stderr}`;
    }
    return { committed: true, branch, pushed: false, detail: hint };
  }
}

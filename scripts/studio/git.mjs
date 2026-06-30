// scripts/studio/git.mjs
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

export async function uncommittedCount(cwd = process.cwd()) {
  const { stdout } = await run('git', ['status', '--porcelain'], { cwd });
  return stdout.split('\n').filter((l) => l.trim()).length;
}

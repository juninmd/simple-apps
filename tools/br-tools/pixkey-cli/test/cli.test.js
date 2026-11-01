import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const cli = new URL('../src/cli.js', import.meta.url).pathname;
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });

test('validate without a key reports a missing key', () => {
  for (const args of [['validate'], ['validate', 'evp'], ['format', 'evp']]) {
    const r = run(...args);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /Key required/);
  }
});

test('validate accepts a key with or without the type', () => {
  const uuid = '123e4567-e89b-12d3-a456-426614174000';
  assert.equal(run('validate', uuid).status, 0);
  assert.equal(run('validate', 'evp', uuid).status, 0);
  assert.equal(run('validate', 'evp', 'nope').status, 1);
});

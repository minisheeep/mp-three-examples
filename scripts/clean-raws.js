import { globSync } from 'glob';
import { resolveRaw, resolveSrc } from './constants.js';
import { basename } from 'node:path';
import * as fs from 'node:fs';

const existFiles = globSync('**/*.js', { cwd: resolveSrc('/official/examples') }).map((item) => {
  return item.replace('$todo_', '').replace('$deprecated_', '');
});

const rawFiles = globSync('**/*.vue', { cwd: resolveRaw() });

let count = 0;
for (const file of rawFiles) {
  const name = basename(file, '.vue');
  if (existFiles.includes(name + '.js')) {
    fs.unlinkSync(resolveRaw(file));
    count++;
  }
}

console.log('cleaned: ', count);

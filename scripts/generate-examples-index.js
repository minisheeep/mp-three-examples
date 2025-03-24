import { globSync } from 'glob';
import { resolveSrc } from './constants.js';
import path from 'node:path';
import * as fs from 'node:fs';

const examples = globSync('[^$]*.js', { cwd: resolveSrc('official/examples') }).sort((a, b) =>
  a.localeCompare(b)
);

let lines = [];
examples.forEach((name) => {
  const base = path.basename(name, '.js');
  lines.push(`export { default as ${base} } from "./examples/${name}"`);
});

fs.writeFileSync(resolveSrc('official/index.ts'), lines.join('\n'), { encoding: 'utf-8' });

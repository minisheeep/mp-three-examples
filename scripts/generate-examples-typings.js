import { globSync } from 'glob';
import { resolveSrc } from './constants.js';
import { basename } from 'node:path';
import * as fs from 'node:fs';

const examples = globSync('[^$]*.js', { cwd: resolveSrc('official/examples') }).sort((a, b) =>
  a.localeCompare(b)
);

for (const example of examples) {
  const name = basename(example, '.js');
  const dtsFilePath = resolveSrc(`official/examples/${name}.d.ts`);
  if (fs.existsSync(dtsFilePath)) {
    continue;
  }
  fs.writeFileSync(
    dtsFilePath,
    [
      'import { OfficialExampleInfo } from "@/official";',
      'const exampleInfo: OfficialExampleInfo;',
      'export default exampleInfo;'
    ].join('\n'),
    'utf-8'
  );
}

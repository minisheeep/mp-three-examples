import { globSync } from 'glob';
import { resolveSrc } from './constants.js';
import * as fs from 'node:fs';

const existFiles = globSync('**/*.js', { cwd: resolveSrc('/official/examples') });

let count = 0;
let unfixCount = 0;
for (const file of existFiles) {
  const fileContent = fs.readFileSync(resolveSrc(`/official/examples/${file}`), 'utf-8');
  const matchedInfo = fileContent.match(/info:( \[[.\s\S]*?\]),\n\s\sinit/);
  if (matchedInfo && matchedInfo.length > 0) {
    const info = new Function(`return ${matchedInfo[1]}`)();
    if (info.length && !(info[0] instanceof Array)) {
      unfixCount++;
      console.log(file.slice(0, -3));
      if (info.length === 1) {
        // count++;
        // const newFileContent = fileContent.replace(matchedInfo[1], `[${matchedInfo[1]}]`);
        // fs.writeFileSync(resolveSrc(`/official/examples/${file}`), newFileContent, 'utf8');
      }
      if (info.length === 2 && info[0].content === 'three.js') {
        // count++;
        // const newFileContent = fileContent.replace(matchedInfo[1], `[${matchedInfo[1]}]`);
        // fs.writeFileSync(resolveSrc(`/official/examples/${file}`), newFileContent, 'utf8');
      }

      if (
        info[0].content === 'three.js' &&
        (info[1].content.trim().startsWith('-') || info[1].content.trim().startsWith('webgl -'))
      ) {
        const [three, name, ...otherInfo] = info;

        const otherLength = otherInfo.reduce((acc, curr) => {
          if (curr.tag === 'a') {
            return acc + ` ${curr.content} `;
          } else {
            return acc + curr.content;
          }
        }, '').length;
        if (otherLength <= 70) {
          const newInfo = [[three, name], otherInfo];
          const newFileContent = fileContent.replace(matchedInfo[1], JSON.stringify(newInfo));
          fs.writeFileSync(resolveSrc(`/official/examples/${file}`), newFileContent, 'utf8');
          count++;
        } else {
          //to_fix
        }
      }
    }
  }
}
console.log(count, unfixCount, existFiles.length);

import { globSync } from 'glob';
import { resolveRaw, resolveSrc } from './constants.js';
import fsp from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
import * as fs from 'node:fs';

const files = globSync('**/*.vue', { cwd: resolveRaw() }).sort((a, b) => a.localeCompare(b));

function getBlockContent(block, source) {
  const start = source.indexOf(`<${block}`);
  if (start === -1) {
    return '';
  }
  const end = source.lastIndexOf(`</${block}`);
  const temp = source.substring(start, end);
  return temp.substring(temp.indexOf('>') + 1, end);
}

function transformSource(name, source) {
  const template = getBlockContent('template', source);
  const script = getBlockContent('script', source);
  const style = getBlockContent('style', source);
  if (style) {
    throw 'has style';
  }
  const $ = cheerio.load(template);
  let info = $('ThreeExampleLayout > template')[0]
    .children[0].children.map((item) => {
      const $item = $(item);
      if (item.type === 'text') {
        const content = item.data.replaceAll('\n', '').trim();
        if (content) {
          return { tag: 'text', content };
        }
      } else if (item.type === 'tag') {
        if ($item.hasClass('a-br')) {
          return { tag: 'br' };
        } else if ($item.hasClass('a-link')) {
          return { tag: 'a', link: $item.attr('data-href'), content: $item.text().trim() };
        } else if ($item.hasClass('a-p')) {
          const contents = $item.text().trim();
          return contents.split('\n').map((item) => ({ tag: 'text', content: item.trim() }));
        } else if ($item.children().length) {
          throw 'info has childNodes';
        } else {
          // no case
        }
      }
    })
    .flat()
    .filter((item) => !!item);

  if (info.some((item) => item.tag === 'br')) {
    let newInfo = [[]];
    info.forEach((item) => {
      if (item.tag === 'br') {
        if (newInfo[newInfo.length - 1].length) {
          newInfo.push([]);
        }
      } else {
        newInfo[newInfo.length - 1].push(item);
      }
    });
    info = newInfo;
  } else {
    info = [info];
  }

  const imports = [];
  let loaders = '';
  const initScene = script
    .replaceAll(/import [a-zA-Z\s\S]*? from .*;/g, ($0) => {
      if (
        ['hookLoaderLoadFn', 'linkHandle', 'ThreeExampleLayout'].every((item) => {
          return !$0.includes(item);
        })
      ) {
        imports.push($0);
      }
      return '';
    })
    .replaceAll('//for analysis', '')
    .replaceAll(/hookLoaderLoadFn\(\[(.*)\]\);/g, ($0, $1) => {
      loaders = $1;
      return '';
    })
    .trim()
    .replace('const exampleInit = ', '')
    .slice(0, -1);

  if (!initScene.startsWith('(')) {
    throw 'need manual transform';
  }
  return `${imports.join('\n')}
  
/** @type {OfficialExampleInfo} */
const exampleInfo =  {
  name: "${name}",
  useLoaders: [${loaders}],
  info: ${JSON.stringify(info, null, 2)},
  init: ${initScene}
}
export { exampleInfo as default };
`;
}

if (!fs.existsSync(resolveSrc('official/examples'))) {
  fs.mkdirSync(resolveSrc('official/examples'));
}

for (const file of files) {
  const baseName = path.basename(file, '.vue');
  const target = resolveSrc(`official/examples/${baseName}.js`);
  if (
    fs.existsSync(target) |
    fs.existsSync(target.replace(baseName, `$todo_${baseName}`)) |
    fs.existsSync(target.replace(baseName, `$deprecated_${baseName}`))
  ) {
    continue;
  }
  const fileContent = await fsp.readFile(resolveRaw(file), 'utf8');
  try {
    const newSource = transformSource(baseName, fileContent);
    await fsp.writeFile(resolveSrc(`official/examples/$_${baseName}.js`), newSource, 'utf8');
  } catch (e) {
    console.error(`${file}:`, e);
  }
}

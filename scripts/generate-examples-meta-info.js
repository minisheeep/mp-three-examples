import { globSync } from 'glob';
import { resolveSrc } from './constants.js';
import { basename } from 'node:path';
import * as fs from 'node:fs';

const metaInfoFile = resolveSrc('official/metaInfo.json');

/**@type {Record<string,ExampleMetaInfo>}*/
let oldMetaData = {};
if (fs.existsSync(metaInfoFile)) {
  oldMetaData = JSON.parse(fs.readFileSync(metaInfoFile, 'utf8'));
}

const examples = globSync('[^$]*.js', { cwd: resolveSrc('official/examples') }).sort((a, b) =>
  a.localeCompare(b)
);

/**
 * @typedef ExampleMetaInfo
 * @property {boolean} canView
 * @property {string} primaryColor
 * @property {string?} blockReason
 * */

/**@type {Record<string,ExampleMetaInfo>}*/
const metaInfos = {};

for (const example of examples) {
  const name = basename(example, '.js');

  /** @type {ExampleMetaInfo}*/
  const metaInfo = {
    canView: true,
    primaryColor: '',
    ...(name in oldMetaData ? oldMetaData[name] : {})
  };
  metaInfos[name] = metaInfo;
}

fs.writeFileSync(metaInfoFile, JSON.stringify(metaInfos, null, 2), 'utf-8');

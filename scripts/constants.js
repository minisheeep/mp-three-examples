import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const resolveSrc = path.join.bind(null, __dirname, '../src/');

export const resolveRaw = path.join.bind(null, __dirname, './three-examples-raw');

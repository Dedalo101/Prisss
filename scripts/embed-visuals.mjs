#!/usr/bin/env node
/**
 * Inline js/visuals.js into index.html (no extra network request on deploy).
 * Usage: node scripts/embed-visuals.mjs [--check]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourcePath = path.join(root, 'js', 'visuals.js');
const mirrorPath = path.join(root, 'scripts', 'visuals.source.js');
const indexPath = path.join(root, 'index.html');
const markerStart = '<!-- visuals:inline:start -->';
const markerEnd = '<!-- visuals:inline:end -->';
const checkOnly = process.argv.includes('--check');

const visuals = fs.readFileSync(sourcePath, 'utf8');
const block = `${markerStart}\n<script>\n${visuals}\n</script>\n${markerEnd}`;

const index = fs.readFileSync(indexPath, 'utf8');
const externalTagRe = /<script\b[^>]*\bsrc=["']js\/visuals\.js["'][^>]*><\/script>/;
const inlineRe = new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}`);

if (!inlineRe.test(index) && !externalTagRe.test(index)) {
  console.error('embed-visuals: no visuals slot found in index.html');
  process.exit(1);
}

const next = index.replace(inlineRe, block).replace(externalTagRe, block);

if (checkOnly) {
  if (next === index) {
    console.log('embed-visuals: index.html is in sync with js/visuals.js');
    process.exit(0);
  }
  console.error('embed-visuals: index.html is out of sync — run node scripts/embed-visuals.mjs');
  process.exit(1);
}

fs.writeFileSync(indexPath, next);
fs.writeFileSync(mirrorPath, visuals);
console.log(`embed-visuals: inlined ${visuals.length} bytes from js/visuals.js`);
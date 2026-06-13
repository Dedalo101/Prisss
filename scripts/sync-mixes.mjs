#!/usr/bin/env node
/**
 * Sync PRISSS_SHOWS from Mixcloud oEmbed — validates URLs and pulls artwork.
 * Usage: node scripts/sync-mixes.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DATA_FILE = path.join(ROOT, 'js', 'mixes-data.js');
const OEMBED = 'https://app.mixcloud.com/oembed/';
const DELAY_MS = 350;

const existing = readFileSync(DATA_FILE, 'utf8');
const urlMatches = [...existing.matchAll(/url:\s*"(https:\/\/www\.mixcloud\.com\/[^"]+)"/g)];
const urls = urlMatches.map((m) => m[1]);

if (!urls.length) {
  console.error('sync-mixes: no URLs found in mixes-data.js');
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchShow(url) {
  const endpoint = `${OEMBED}?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(endpoint, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.url || !data.title) throw new Error('invalid oEmbed payload');
  return {
    title: data.title,
    url: data.url,
    image: data.image || '',
  };
}

const shows = [];
const failures = [];

for (let i = 0; i < urls.length; i++) {
  const url = urls[i];
  process.stdout.write(`[${i + 1}/${urls.length}] ${url} … `);
  try {
    const show = await fetchShow(url);
    shows.push(show);
    console.log('ok');
  } catch (err) {
    failures.push({ url, error: String(err.message || err) });
    console.log(`FAIL (${err.message || err})`);
  }
  if (i < urls.length - 1) await sleep(DELAY_MS);
}

if (!shows.length) {
  console.error('sync-mixes: no shows synced');
  process.exit(1);
}

const lines = shows.map((show) => {
  const title = show.title.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const image = show.image.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `  { title: "${title}", url: "${show.url}", image: "${image}" },`;
});

const output = `var PRISSS_SHOWS = [\n${lines.join('\n')}\n];\n`;

if (process.argv.includes('--check')) {
  if (output !== existing) {
    console.error('sync-mixes: mixes-data.js is out of sync — run node scripts/sync-mixes.mjs');
    process.exit(1);
  }
  console.log('sync-mixes: mixes-data.js is in sync');
  process.exit(0);
}

writeFileSync(DATA_FILE, output, 'utf8');
console.log(`sync-mixes: wrote ${shows.length} shows to js/mixes-data.js`);
if (failures.length) {
  console.warn(`sync-mixes: ${failures.length} failures:`);
  failures.forEach((f) => console.warn(`  - ${f.url}: ${f.error}`));
  process.exit(1);
}
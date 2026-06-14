import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontPath = path.join(__dirname, '../fonts/blade-runner-movie.ttf');

const font = opentype.parse(fs.readFileSync(fontPath));

function clonePath(pathObj, mapPoint) {
  const next = new opentype.Path();
  pathObj.commands.forEach((cmd) => {
    const copy = { type: cmd.type };
    ['x', 'y', 'x1', 'y1', 'x2', 'y2'].forEach((key) => {
      if (cmd[key] === undefined) return;
      const mapped = mapPoint(cmd[key], key.endsWith('y') ? 'y' : 'x');
      copy[key] = mapped;
    });
    next.commands.push(copy);
  });
  return next;
}

function fitGlyph(sourceGlyph, targetWidth, targetBox) {
  const sourceBox = sourceGlyph.getBoundingBox();
  const scaleX = (targetWidth - 24) / (sourceBox.x2 - sourceBox.x1);
  const scaleY = (targetBox.y2 - targetBox.y1) / (sourceBox.y2 - sourceBox.y1);
  const scale = Math.min(scaleX, scaleY) * 0.96;
  const offsetX = 12 - sourceBox.x1 * scale;
  const offsetY = targetBox.y1 - sourceBox.y1 * scale;

  const path = clonePath(sourceGlyph.path, (value, axis) =>
    axis === 'y' ? value * scale + offsetY : value * scale + offsetX
  );

  return new opentype.Glyph({
    name: 'B',
    unicode: 66,
    advanceWidth: Math.round(targetWidth),
    path,
  });
}

const ref = font.charToGlyph('D');
const refBox = ref.getBoundingBox();
const bIndex = font.charToGlyph('B').index;
const source = font.charToGlyph('8');

font.glyphs.glyphs[bIndex] = fitGlyph(source, ref.advanceWidth, refBox);

fs.writeFileSync(fontPath, Buffer.from(font.toArrayBuffer()));

const patched = opentype.parse(fs.readFileSync(fontPath));
const nextB = patched.charToGlyph('B');
console.log(
  'Patched B:',
  'width',
  nextB.advanceWidth,
  'cmds',
  nextB.path.commands.length,
  'bbox',
  nextB.getBoundingBox()
);
/** Full visuals; canvas starts after first paint for LCP */
(function () {
  'use strict';
  function boot() {
// ── Cursor ────────────────────────────────────────────────────────
const cDot  = document.getElementById('cDot');
const cRing = document.getElementById('cRing');
let mx = innerWidth/2, my = innerHeight/2;
let rx = mx, ry = my;

function setPointer(x, y) {
  mx = x; my = y;
}
document.addEventListener('mousemove', e => setPointer(e.clientX, e.clientY));
document.addEventListener('touchmove', e => {
  if (e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });
document.querySelectorAll('a').forEach(a => {
  a.addEventListener('mouseenter', () => cRing.classList.add('big'));
  a.addEventListener('mouseleave', () => cRing.classList.remove('big'));
});
(function animCursor() {
  rx += (mx - rx) * 0.11; ry += (my - ry) * 0.11;
  cDot.style.left  = mx + 'px'; cDot.style.top  = my + 'px';
  cRing.style.left = rx + 'px'; cRing.style.top = ry + 'px';
  requestAnimationFrame(animCursor);
})();

// ── Canvas ────────────────────────────────────────────────────────
const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');
let W, H;
function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
resize(); window.addEventListener('resize', () => { resize(); initGrooves(); });

let mouseX = W/2, mouseY = H/2;
function setMouse(x, y) { mouseX = x; mouseY = y; }
document.addEventListener('mousemove', e => setMouse(e.clientX, e.clientY));
document.addEventListener('touchmove', e => {
  if (e.touches[0]) setMouse(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

// ── Colour helpers ────────────────────────────────────────────────
const C = {
  groove: [196,170,126],
  needle: [237,228,208],
  copper: [201,122, 58],
  ember:  [180, 90, 30],
  dark:   [ 30, 24, 18],
};
const rgba = (c,a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

// ── 1. GROOVE RINGS (v2 DNA) — but denser, more prominent ─────────
const RINGS = window.innerWidth < 768 ? 50 : 90;
let grooves = [];
function initGrooves() {
  grooves = Array.from({length:RINGS}, (_,i) => ({
    i,
    phase:  (i/RINGS) * Math.PI * 2 + Math.random() * 0.4,
    wobble: (Math.random()-.5) * 0.004,
    thick:  i % 9 === 0 ? 1.1 : (i % 3 === 0 ? 0.6 : 0.3),
    opacity: 0.025 + (i/RINGS) * 0.055,   // outer rings brighter = more prominent
  }));
}
initGrooves();

function drawGrooves(t) {
  const cx = W/2, cy = H/2;
  const maxR = Math.min(W,H) * 0.47;
  const minR = Math.min(W,H) * 0.03;
  const mdx  = (mouseX - cx) / W;
  const mdy  = (mouseY - cy) / H;

  grooves.forEach(g => {
    const base = minR + (maxR - minR) * (g.i / RINGS);
    const r    = base + Math.sin(t * 0.28 + g.phase) * base * 0.012;
    // eccentricity: mouse warps the rings like a poorly-centred pressing
    const ex   = cx + mdx * (g.i/RINGS) * 28;
    const ey   = cy + mdy * (g.i/RINGS) * 20;

    ctx.beginPath();
    for (let s = 0; s <= 160; s++) {
      const a = (s/160) * Math.PI * 2;
      const px = ex + Math.cos(a) * r;
      const py = ey + Math.sin(a) * r;
      s === 0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
    }
    ctx.closePath();

    // Highlighted ring nearest cursor
    const dToCenter = Math.hypot(mouseX - cx, mouseY - cy);
    const nearThis  = Math.abs(dToCenter - r) < 14;
    ctx.strokeStyle = nearThis
      ? rgba(C.copper, g.opacity * 4.5)
      : rgba(C.groove, g.opacity);
    ctx.lineWidth   = nearThis ? g.thick * 2.2 : g.thick;
    ctx.stroke();
  });

  // Spindle
  ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI*2);
  ctx.fillStyle = rgba(C.groove, 0.4); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, 1.4, 0, Math.PI*2);
  ctx.fillStyle = rgba(C.needle, 0.75); ctx.fill();
}

// ── 2. LISSAJOUS ATTRACTORS (v1 DNA) — warm copper palette ────────
class Attractor {
  constructor(a, b, d, scale, speed) {
    Object.assign(this, {a,b,d,scale,speed});
    this.t     = Math.random() * Math.PI * 2;
    this.cx    = 0.38 + Math.random() * 0.24;
    this.cy    = 0.38 + Math.random() * 0.24;
    this.alpha = 0.028 + Math.random() * 0.032;
    this.col   = Math.random() < 0.5 ? C.copper : C.groove;
  }
  draw(t) {
    const ox = this.cx * W, oy = this.cy * H;
    const steps = 380;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = (i/steps) * Math.PI * 2;
      const x = ox + Math.sin(this.a * u + this.d + t * this.speed * 0.18) * this.scale;
      const y = oy + Math.sin(this.b * u                                  ) * this.scale * 0.62;
      i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.strokeStyle = rgba(this.col, this.alpha);
    ctx.lineWidth   = 0.55;
    ctx.stroke();
  }
}

const attractors = [
  new Attractor(3, 2, 1.5,  Math.min(W,H)*0.26, 0.6),
  new Attractor(5, 4, 0.9,  Math.min(W,H)*0.19, 0.45),
  new Attractor(2, 3, 0.35, Math.min(W,H)*0.31, 0.8),
  new Attractor(7, 6, 1.1,  Math.min(W,H)*0.14, 0.55),
];

// ── 3. PARTICLES (v1 DNA) — re-coloured warm ──────────────────────
const PCOUNT = window.innerWidth < 768 ? 120 : 240;
const parts  = [];

function mkParticle() {
  const angle = Math.random() * Math.PI * 2;
  const orb   = 60 + Math.random() * Math.min(W,H) * 0.48;
  const isCopper = Math.random() < 0.1;
  return {
    x:orb*Math.cos(angle)+W/2, y:orb*Math.sin(angle)+H/2,
    vx:0, vy:0,
    angle, orb,
    drift:  (Math.random()-.5) * 0.0018,
    speed:  Math.random() * 0.35 + 0.08,
    size:   Math.random() * 1.1 + 0.3,
    alpha:  Math.random() * 0.45 + 0.12,
    col:    isCopper ? C.copper : (Math.random()<0.2 ? C.needle : C.groove),
  };
}
for (let i = 0; i < PCOUNT; i++) parts.push(mkParticle());

function drawParticles(t) {
  const cx = W/2, cy = H/2;
  parts.forEach(p => {
    p.angle += p.drift + p.speed * 0.003;
    p.orb   += Math.sin(t + p.angle) * 0.14;
    const tx = cx + Math.cos(p.angle) * p.orb;
    const ty = cy + Math.sin(p.angle) * p.orb;
    const dM = Math.hypot(mouseX - tx, mouseY - ty);
    const rep = Math.max(0, 150 - dM) / 150;
    const fx  = (tx - mouseX) / (dM||1) * rep * 70;
    const fy  = (ty - mouseY) / (dM||1) * rep * 70;
    p.vx += ((tx+fx) - p.x) * 0.045; p.vy += ((ty+fy) - p.y) * 0.045;
    p.vx *= 0.87; p.vy *= 0.87;
    p.x  += p.vx;  p.y  += p.vy;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fillStyle = rgba(p.col, p.alpha);
    ctx.fill();
  });

  // Connection threads — thinner, warmer
  ctx.lineWidth = 0.25;
  for (let i = 0; i < parts.length; i++) {
    for (let j = i+1; j < parts.length; j++) {
      const dx = parts[i].x - parts[j].x;
      const dy = parts[i].y - parts[j].y;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d < 80) {
        ctx.strokeStyle = rgba(C.groove, (1-d/80) * 0.1);
        ctx.beginPath();
        ctx.moveTo(parts[i].x, parts[i].y);
        ctx.lineTo(parts[j].x, parts[j].y);
        ctx.stroke();
      }
    }
  }
}

// ── 4. NEEDLE GLOW at cursor ──────────────────────────────────────
function drawGlow() {
  const g = ctx.createRadialGradient(mouseX,mouseY,0, mouseX,mouseY,80);
  g.addColorStop(0,   rgba(C.needle, 0.1));
  g.addColorStop(0.4, rgba(C.copper, 0.04));
  g.addColorStop(1,   rgba(C.groove, 0));
  ctx.beginPath(); ctx.arc(mouseX, mouseY, 80, 0, Math.PI*2);
  ctx.fillStyle = g; ctx.fill();
}

// ── Slow Archimedean spiral ghost (tonearm trace) ─────────────────
function drawSpiralGhost(t) {
  const cx = W/2, cy = H/2;
  const maxR = Math.min(W,H) * 0.47;
  ctx.beginPath();
  for (let s = 0; s <= 700; s++) {
    const frac  = s/700;
    const theta = frac * 7 * Math.PI * 2 + t * 0.04;
    const r     = frac * maxR;
    const x     = cx + Math.cos(theta) * r;
    const y     = cy + Math.sin(theta) * r;
    s === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  }
  ctx.strokeStyle = rgba(C.ember, 0.018);
  ctx.lineWidth   = 0.5;
  ctx.stroke();
}

// ── Render ────────────────────────────────────────────────────────
let t = 0;
function frame() {
  t += 0.009;
  ctx.fillStyle = 'rgba(6,5,10,0.2)';
  ctx.fillRect(0, 0, W, H);

  drawSpiralGhost(t);
  drawGrooves(t);
  attractors.forEach(a => a.draw(t));
  drawParticles(t);
  drawGlow();

  requestAnimationFrame(frame);
}
frame();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else schedule();
  function schedule() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const run = () => boot();
        (window.requestIdleCallback || (cb => setTimeout(cb, 1)))(run, { timeout: 80 });
      });
    });
  }
})();
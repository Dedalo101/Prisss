/** Full visuals; canvas starts after first paint for LCP */
(function () {
  'use strict';

  var activeCanvas = null;
  var inputWired = false;
  var mx = innerWidth / 2;
  var my = innerHeight / 2;
  var rx = mx;
  var ry = my;
  var mouseX = mx;
  var mouseY = my;
  var titleRect = null;
  var overTitle = false;
  var titleFlashReady = 0;

  function setPointer(x, y) {
    mx = x;
    my = y;
    mouseX = x;
    mouseY = y;
  }

  function updateTitleRect() {
    var titleWrap = document.getElementById('title-wrap');
    if (!titleWrap || !titleWrap.isConnected) {
      titleRect = null;
      return;
    }
    titleRect = titleWrap.getBoundingClientRect();
  }

  function triggerTitleGlitch() {
    var titleWrap = document.getElementById('title-wrap');
    var heroTitle = document.getElementById('lcp-title');
    if (!heroTitle || !titleWrap || performance.now() < titleFlashReady) return;
    titleFlashReady = performance.now() + 320 + Math.random() * 900;
    titleWrap.classList.remove('is-flashing');
    heroTitle.classList.remove('is-glitching');
    void titleWrap.offsetWidth;
    titleWrap.classList.add('is-flashing');
    heroTitle.classList.add('is-glitching');
    window.setTimeout(function () {
      titleWrap.classList.remove('is-flashing');
    }, 180);
    window.setTimeout(function () {
      heroTitle.classList.remove('is-glitching');
    }, 240);
  }

  function checkTitleHover(x, y) {
    if (!titleRect) return;
    var pad = 28;
    var hit =
      x >= titleRect.left - pad &&
      x <= titleRect.right + pad &&
      y >= titleRect.top - pad &&
      y <= titleRect.bottom + pad;

    if (hit && !overTitle) {
      overTitle = true;
      triggerTitleGlitch();
    } else if (!hit) {
      overTitle = false;
    } else if (hit && Math.random() < 0.012) {
      triggerTitleGlitch();
    }
  }

  function wireInput() {
    if (inputWired) return;
    inputWired = true;

    document.addEventListener('mousemove', function (e) {
      setPointer(e.clientX, e.clientY);
    });
    document.addEventListener('touchmove', function (e) {
      if (e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    document.addEventListener('mouseover', function (e) {
      var ring = document.getElementById('cRing');
      if (!ring || !ring.isConnected) return;
      if (e.target.closest('a, button')) ring.classList.add('big');
    });
    document.addEventListener('mouseout', function (e) {
      var ring = document.getElementById('cRing');
      if (!ring || !ring.isConnected) return;
      if (e.target.closest('a, button')) ring.classList.remove('big');
    });
    window.addEventListener('resize', updateTitleRect);
  }

  function animCursor() {
    var cDot = document.getElementById('cDot');
    var cRing = document.getElementById('cRing');
    if (cDot && cRing && cDot.isConnected) {
      rx += (mx - rx) * 0.11;
      ry += (my - ry) * 0.11;
      cDot.style.left = mx + 'px';
      cDot.style.top = my + 'px';
      cRing.style.left = rx + 'px';
      cRing.style.top = ry + 'px';
      checkTitleHover(mx, my);
    }
    requestAnimationFrame(animCursor);
  }

  function boot() {
    var canvas = document.getElementById('c');
    if (!canvas || !canvas.getContext) return;
    if (activeCanvas === canvas) return;
    activeCanvas = canvas;

    wireInput();
    updateTitleRect();

    var ctx = canvas.getContext('2d');
    var W;
    var H;
    var grooves = [];
    var attractors = [];
    var parts = [];
    var t = 0;

    var C = {
      groove: [196, 170, 126],
      needle: [237, 228, 208],
      copper: [201, 122, 58],
      ember: [180, 90, 30],
      dark: [30, 24, 18],
    };
    var rgba = function (c, a) {
      return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
    };

    var RINGS = window.innerWidth < 768 ? 50 : 90;

    function initGrooves() {
      grooves = Array.from({ length: RINGS }, function (_, i) {
        return {
          i: i,
          phase: (i / RINGS) * Math.PI * 2 + Math.random() * 0.4,
          wobble: (Math.random() - 0.5) * 0.004,
          thick: i % 9 === 0 ? 1.1 : i % 3 === 0 ? 0.6 : 0.3,
          opacity: 0.025 + (i / RINGS) * 0.055,
        };
      });
    }

    function Attractor(a, b, d, scale, speed) {
      this.a = a;
      this.b = b;
      this.d = d;
      this.scale = scale;
      this.speed = speed;
      this.t = Math.random() * Math.PI * 2;
      this.cx = 0.38 + Math.random() * 0.24;
      this.cy = 0.38 + Math.random() * 0.24;
      this.alpha = 0.028 + Math.random() * 0.032;
      this.col = Math.random() < 0.5 ? C.copper : C.groove;
    }

    Attractor.prototype.draw = function (time) {
      var ox = this.cx * W;
      var oy = this.cy * H;
      var steps = 380;
      ctx.beginPath();
      for (var i = 0; i <= steps; i++) {
        var u = (i / steps) * Math.PI * 2;
        var x = ox + Math.sin(this.a * u + this.d + time * this.speed * 0.18) * this.scale;
        var y = oy + Math.sin(this.b * u) * this.scale * 0.62;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(this.col, this.alpha);
      ctx.lineWidth = 0.55;
      ctx.stroke();
    };

    function mkParticle() {
      var angle = Math.random() * Math.PI * 2;
      var orb = 60 + Math.random() * Math.min(W, H) * 0.48;
      var isCopper = Math.random() < 0.1;
      return {
        x: orb * Math.cos(angle) + W / 2,
        y: orb * Math.sin(angle) + H / 2,
        vx: 0,
        vy: 0,
        angle: angle,
        orb: orb,
        drift: (Math.random() - 0.5) * 0.0018,
        speed: Math.random() * 0.35 + 0.08,
        size: Math.random() * 1.1 + 0.3,
        alpha: Math.random() * 0.45 + 0.12,
        col: isCopper ? C.copper : Math.random() < 0.2 ? C.needle : C.groove,
      };
    }

    function resize() {
      W = canvas.width = innerWidth;
      H = canvas.height = innerHeight;
    }

    function drawGrooves(time) {
      var cx = W / 2;
      var cy = H / 2;
      var maxR = Math.min(W, H) * 0.47;
      var minR = Math.min(W, H) * 0.03;
      var mdx = (mouseX - cx) / W;
      var mdy = (mouseY - cy) / H;

      grooves.forEach(function (g) {
        var base = minR + (maxR - minR) * (g.i / RINGS);
        var r = base + Math.sin(time * 0.28 + g.phase) * base * 0.012;
        var ex = cx + mdx * (g.i / RINGS) * 28;
        var ey = cy + mdy * (g.i / RINGS) * 20;

        ctx.beginPath();
        for (var s = 0; s <= 160; s++) {
          var a = (s / 160) * Math.PI * 2;
          var px = ex + Math.cos(a) * r;
          var py = ey + Math.sin(a) * r;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        var dToCenter = Math.hypot(mouseX - cx, mouseY - cy);
        var nearThis = Math.abs(dToCenter - r) < 14;
        ctx.strokeStyle = nearThis ? rgba(C.copper, g.opacity * 4.5) : rgba(C.groove, g.opacity);
        ctx.lineWidth = nearThis ? g.thick * 2.2 : g.thick;
        ctx.stroke();
      });

      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = rgba(C.groove, 0.4);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = rgba(C.needle, 0.75);
      ctx.fill();
    }

    function drawParticles(time) {
      var cx = W / 2;
      var cy = H / 2;
      parts.forEach(function (p) {
        p.angle += p.drift + p.speed * 0.003;
        p.orb += Math.sin(time + p.angle) * 0.14;
        var tx = cx + Math.cos(p.angle) * p.orb;
        var ty = cy + Math.sin(p.angle) * p.orb;
        var dM = Math.hypot(mouseX - tx, mouseY - ty);
        var rep = Math.max(0, 150 - dM) / 150;
        var fx = ((tx - mouseX) / (dM || 1)) * rep * 70;
        var fy = ((ty - mouseY) / (dM || 1)) * rep * 70;
        p.vx += (tx + fx - p.x) * 0.045;
        p.vy += (ty + fy - p.y) * 0.045;
        p.vx *= 0.87;
        p.vy *= 0.87;
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = rgba(p.col, p.alpha);
        ctx.fill();
      });

      ctx.lineWidth = 0.25;
      for (var i = 0; i < parts.length; i++) {
        for (var j = i + 1; j < parts.length; j++) {
          var dx = parts[i].x - parts[j].x;
          var dy = parts[i].y - parts[j].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < 80) {
            ctx.strokeStyle = rgba(C.groove, (1 - d / 80) * 0.1);
            ctx.beginPath();
            ctx.moveTo(parts[i].x, parts[i].y);
            ctx.lineTo(parts[j].x, parts[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function drawGlow() {
      var g = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 80);
      g.addColorStop(0, rgba(C.needle, 0.1));
      g.addColorStop(0.4, rgba(C.copper, 0.04));
      g.addColorStop(1, rgba(C.groove, 0));
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 80, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    function drawSpiralGhost(time) {
      var cx = W / 2;
      var cy = H / 2;
      var maxR = Math.min(W, H) * 0.47;
      ctx.beginPath();
      for (var s = 0; s <= 700; s++) {
        var frac = s / 700;
        var theta = frac * 7 * Math.PI * 2 + time * 0.04;
        var r = frac * maxR;
        var x = cx + Math.cos(theta) * r;
        var y = cy + Math.sin(theta) * r;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(C.ember, 0.018);
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    function frame() {
      if (!canvas.isConnected || activeCanvas !== canvas) return;
      t += 0.009;
      ctx.fillStyle = 'rgba(6,5,10,0.2)';
      ctx.fillRect(0, 0, W, H);
      drawSpiralGhost(t);
      drawGrooves(t);
      attractors.forEach(function (a) {
        a.draw(t);
      });
      drawParticles(t);
      drawGlow();
      requestAnimationFrame(frame);
    }

    resize();
    initGrooves();
    attractors = [
      new Attractor(3, 2, 1.5, Math.min(W, H) * 0.26, 0.6),
      new Attractor(5, 4, 0.9, Math.min(W, H) * 0.19, 0.45),
      new Attractor(2, 3, 0.35, Math.min(W, H) * 0.31, 0.8),
      new Attractor(7, 6, 1.1, Math.min(W, H) * 0.14, 0.55),
    ];

    var PCOUNT = window.innerWidth < 768 ? 120 : 240;
    parts = [];
    for (var p = 0; p < PCOUNT; p++) parts.push(mkParticle());

    window.addEventListener('resize', function onResize() {
      if (activeCanvas !== canvas) {
        window.removeEventListener('resize', onResize);
        return;
      }
      resize();
      initGrooves();
    });

    frame();
  }

  window.PRISSS_VISUALS_BOOT = function () {
    schedule();
  };

  window.PRISSS_VISUALS_TEARDOWN = function () {
    activeCanvas = null;
    titleRect = null;
    overTitle = false;
  };

  function schedule() {
    requestAnimationFrame(function () {
      requestAnimationFrame(boot);
    });
  }

  animCursor();

  if (document.body.dataset.page === 'home') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', schedule, { once: true });
    } else {
      schedule();
    }
  }
})();
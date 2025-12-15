// Intense Datamatics Techno Visualization with Enhanced Glitch
const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let mouseX = 0.5;
let mouseY = 0.5;
let time = 0;
let currentPattern = 0;

// Audio reactivity
let audioContext;
let analyser;
let dataArray;
let audioInitialized = false;

// Mobile optimization
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Constants
const TEMPO = 128 / 60;
const FADE_OPACITY = 0.03;
const PULSE_FREQ = TEMPO * 8;
const FLASH_THRESHOLD = 0.9;
const GLITCH_FREQ = TEMPO * 4;

const PERFORMANCE_PRESETS = [
    {
        name: 'low',
        pixelStep: 5,
        maxIterations: 24,
        dataDensity: 70,
        dataDensityMobile: 40,
        barnsleyPoints: 1600,
        dragonIterations: 6,
        spiralDepth: 3,
        glitchSlices: 1,
        glitchNoise: 0.0015,
        glitchRows: 3,
        glitchMosh: 1,
        glitchInterval: 420,
        snowflakeIterations: 2
    },
    {
        name: 'medium',
        pixelStep: 4,
        maxIterations: 36,
        dataDensity: 110,
        dataDensityMobile: 60,
        barnsleyPoints: 2800,
        dragonIterations: 8,
        spiralDepth: 4,
        glitchSlices: 2,
        glitchNoise: 0.003,
        glitchRows: 5,
        glitchMosh: 2,
        glitchInterval: 320,
        snowflakeIterations: 3
    },
    {
        name: 'high',
        pixelStep: 3,
        maxIterations: 48,
        dataDensity: 150,
        dataDensityMobile: 80,
        barnsleyPoints: 4200,
        dragonIterations: 10,
        spiralDepth: 5,
        glitchSlices: 3,
        glitchNoise: 0.0045,
        glitchRows: 6,
        glitchMosh: 4,
        glitchInterval: 260,
        snowflakeIterations: 4
    }
];

const performanceState = {
    presetIndex: isMobile ? 1 : 2,
    fpsSample: 60,
    lastTimestamp: performance.now(),
    framesElapsed: 0
};

const TARGET_FPS = isMobile ? 45 : 55;
const FPS_UPPER_MARGIN = 10;
const FPS_LOWER_MARGIN = 8;

let lastGlitchTime = performance.now();

function getQuality() {
    return PERFORMANCE_PRESETS[performanceState.presetIndex];
}

let reusableImageData = null;

function acquireImageData() {
    if (!reusableImageData || reusableImageData.width !== width || reusableImageData.height !== height) {
        reusableImageData = ctx.createImageData(width, height);
    } else {
        reusableImageData.data.fill(0);
    }
    return reusableImageData;
}

// Disable scroll on mobile
document.body.style.overflow = 'hidden';
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100vw';
canvas.style.height = '100vh';

// Prevent touch scroll
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

function initAudio() {
    if (audioInitialized) return;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            audioInitialized = true;
        })
        .catch(err => console.log('Audio init failed:', err));
}

// Resize
function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    reusableImageData = null;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Mouse/touch
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX / width;
    mouseY = e.clientY / height;
    if (!audioInitialized) initAudio();
});

document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        mouseY = e.touches[0].clientY / height;
        mouseX = 0.5;
    }
    if (!audioInitialized) initAudio();
});

document.addEventListener('touchend', () => {
    currentPattern = (currentPattern + 1) % 9;
});

document.addEventListener('click', () => {
    currentPattern = (currentPattern + 1) % 9;
});

// Pulse
function pulseScale() {
    return 1 + 0.3 * Math.abs(Math.sin(time * PULSE_FREQ * Math.PI * 2));
}

// Data stream
function drawDataStream(quality) {
    const baseDensity = isMobile ? quality.dataDensityMobile : quality.dataDensity;
    const density = baseDensity + mouseX * baseDensity * 0.5;
    const speed = 8 + mouseY * 18;

    for (let i = 0; i < density; i++) {
        const x = Math.random() * width;
        const y = (Math.random() * height + time * speed) % height;
        const binary = (Math.random() > 0.5 ? '1' : '0').repeat(10 + Math.floor(Math.random() * 20));
        
        ctx.font = `${15 + pulseScale() * 10}px monospace`;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.sin(time + i) * 0.3})`;
        ctx.fillText(binary, x, y);
    }
}

// Data path
function drawDataPath(centerX, centerY, segments, depth, rotation) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation + Math.sin(time * TEMPO) * 0.3);
    
    for (let i = 0; i < depth; i++) {
        const length = 70 + i * 30 * pulseScale();
        const angleStep = Math.PI * 2 / segments;
        
        for (let j = 0; j < segments; j++) {
            const angle = j * angleStep + Math.cos(time + i) * 0.15;
            const endX = Math.cos(angle) * length;
            const endY = Math.sin(angle) * length;
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 - i / depth * 0.4})`;
            ctx.lineWidth = 2 + pulseScale() * 2;
            ctx.stroke();
        }
    }
    
    ctx.restore();
}

// Data field (Julia)
function drawDataField(quality) {
    const imageData = acquireImageData();
    const data = imageData.data;

    const maxIterations = Math.round(quality.maxIterations + mouseY * 8);
    const zoom = 1.2 + mouseX * 0.6 + 0.25 * Math.sin(time * PULSE_FREQ);
    const cX = -0.75 + mouseX * 0.25;
    const cY = 0.2 + mouseY * 0.15;
    const step = quality.pixelStep;

    for (let px = 0; px < width; px += step) {
        for (let py = 0; py < height; py += step) {
            const sampleX = px + step * 0.5;
            const sampleY = py + step * 0.5;
            let x = (sampleX - width / 2) / (0.5 * zoom * width);
            let y = (sampleY - height / 2) / (0.5 * zoom * height);

            let iteration = 0;
            while (x * x + y * y <= 4 && iteration < maxIterations) {
                const xTemp = x * x - y * y + cX;
                y = 2 * x * y + cY;
                x = xTemp;
                iteration++;
            }

            if (iteration < maxIterations) {
                const value = 255 * (iteration / maxIterations * pulseScale());
                for (let dx = 0; dx < step && px + dx < width; dx++) {
                    for (let dy = 0; dy < step && py + dy < height; dy++) {
                        const index = ((py + dy) * width + (px + dx)) * 4;
                        data[index] = value;
                        data[index + 1] = value;
                        data[index + 2] = value;
                        data[index + 3] = 160 + value / 1.5;
                    }
                }
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

// Binary Triangle
function drawBinaryTriangle(offsetX, offsetY, size, depth) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = pulseScale() * 1.5;
    
    function sierpinski(x, y, size, depth) {
        if (depth === 0 || size < 2) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x + size / 2, y - size * Math.sqrt(3) / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            return;
        }
        
        const halfSize = size / 2;
        const h = size * Math.sqrt(3) / 2;
        
        sierpinski(x, y, halfSize, depth - 1);
        sierpinski(x + halfSize, y, halfSize, depth - 1);
        sierpinski(x + halfSize / 2, y - h / 2, halfSize, depth - 1);
    }
    
    sierpinski(offsetX, offsetY, size, depth);
}

// Spiral fractal
function drawSpiralPattern(quality) {
    ctx.lineCap = 'round';
    if (quality.name !== 'low') {
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowOffsetX = 6;
        ctx.shadowOffsetY = 4;
        ctx.shadowBlur = 8;
    } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }

    const size = Math.min(width, height) * 0.28;
    const maxLevel = quality.spiralDepth + Math.floor(mouseX * 2);
    const scale = 0.78 + mouseY * 0.08;
    const spread = 0.18 + mouseX * 0.18 + Math.sin(time) * 0.08;
    const color = 'rgba(255, 255, 255, 0.78)';
    const lineWidth = Math.max(2, 5 * pulseScale());
    const sides = Math.max(3, Math.floor(3 + mouseY * 3));

    function drawBranch(level) {
        if (level > maxLevel) return;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size, 0);
        ctx.stroke();

        if (level < maxLevel) {
            ctx.save();
            ctx.translate(size * 0.12, 0);
            ctx.scale(scale, scale);
            ctx.rotate(spread);
            drawBranch(level + 1);
            ctx.restore();

            ctx.save();
            ctx.translate(size * 0.48, 0);
            ctx.scale(scale, scale);
            ctx.rotate(spread * 1.4);
            drawBranch(level + 1);
            ctx.restore();

            if (quality.name !== 'low') {
                ctx.save();
                ctx.translate(size * 0.62, 0);
                ctx.scale(scale * 0.35, scale * 0.35);
                ctx.rotate(spread * 0.6);
                drawBranch(level + 1);
                ctx.restore();
            }
        }

        ctx.beginPath();
        ctx.arc(size * 1.05, 0, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.save();
    ctx.translate(width / 2, height / 2);
    for (let i = 0; i < sides; i++) {
        ctx.rotate((Math.PI * 2) / sides + time * 0.09);
        drawBranch(0);
    }
    ctx.restore();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}

// Mandelbrot
function drawMandelbrot(quality) {
    const imageData = acquireImageData();
    const data = imageData.data;

    const maxIterations = Math.round(quality.maxIterations + mouseY * 6);
    const zoom = 1.25 + mouseX * 0.55 + 0.25 * Math.sin(time * PULSE_FREQ);
    const step = quality.pixelStep;

    for (let px = 0; px < width; px += step) {
        for (let py = 0; py < height; py += step) {
            const sampleX = px + step * 0.5;
            const sampleY = py + step * 0.5;
            let x0 = (sampleX - width / 2) / (0.25 * zoom * width) + mouseX * 0.4 - 0.5;
            let y0 = (sampleY - height / 2) / (0.25 * zoom * height) + mouseY * 0.4;
            let x = 0;
            let y = 0;
            let iteration = 0;
            while (x * x + y * y <= 4 && iteration < maxIterations) {
                const xTemp = x * x - y * y + x0;
                y = 2 * x * y + y0;
                x = xTemp;
                iteration++;
            }

            if (iteration < maxIterations) {
                const value = 255 * (iteration / maxIterations * pulseScale());
                for (let dx = 0; dx < step && px + dx < width; dx++) {
                    for (let dy = 0; dy < step && py + dy < height; dy++) {
                        const index = ((py + dy) * width + (px + dx)) * 4;
                        data[index] = value;
                        data[index + 1] = value;
                        data[index + 2] = value;
                        data[index + 3] = 160 + value / 1.5;
                    }
                }
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

// Dragon Curve
function drawDragonCurve(quality) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.lineWidth = Math.max(1.5, 1.8 * pulseScale());
    ctx.beginPath();

    let x = width / 2;
    let y = height / 2;
    let angle = 0;
    const length = 4 + mouseY * 8;
    const iterations = Math.min(12, quality.dragonIterations + Math.floor(mouseX * 3));

    function dragon(iter, dir) {
        if (iter === 0) {
            const endX = x + length * Math.cos(angle);
            const endY = y + length * Math.sin(angle);
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            x = endX;
            y = endY;
            return;
        }
        dragon(iter - 1, 1);
        angle += dir * Math.PI / 2;
        dragon(iter - 1, -1);
    }

    dragon(iterations, 1);
    ctx.stroke();
}

// Barnsley Fern
function drawBarnsleyFern(quality) {
    ctx.fillStyle = 'rgba(0, 255, 0, 0.75)';
    const points = quality.barnsleyPoints;
    let x = 0;
    let y = 0;

    for (let i = 0; i < points; i++) {
        const r = Math.random();
        let nx, ny;
        if (r < 0.01) {
            nx = 0;
            ny = 0.16 * y;
        } else if (r < 0.86) {
            nx = 0.85 * x + 0.04 * y;
            ny = -0.04 * x + 0.85 * y + 1.6;
        } else if (r < 0.93) {
            nx = 0.2 * x - 0.26 * y;
            ny = 0.23 * x + 0.22 * y + 1.6;
        } else {
            nx = -0.15 * x + 0.28 * y;
            ny = 0.26 * x + 0.24 * y + 0.44;
        }
        x = nx;
        y = ny;
        const px = width / 2 + x * 50 + mouseX * 80 - 40;
        const py = height - y * 50 - mouseY * 90;
        ctx.fillRect(px, py, 1, 1);
    }
}

// Koch Snowflake
function drawKochSnowflake(quality) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.lineWidth = 1;

    const size = Math.min(width, height) * 0.28;
    const iterations = Math.max(1, Math.min(5, quality.snowflakeIterations + Math.floor(mouseX * 1.5)));

    function koch(x1, y1, x2, y2, iter) {
        if (iter === 0) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            return;
        }
        const dx = x2 - x1;
        const dy = y2 - y1;
        const x3 = x1 + dx / 3;
        const y3 = y1 + dy / 3;
        const x4 = x1 + 2 * dx / 3;
        const y4 = y1 + 2 * dy / 3;
        const x5 = x3 + (x4 - x3) * Math.cos(Math.PI / 3) - (y4 - y3) * Math.sin(Math.PI / 3);
        const y5 = y3 + (x4 - x3) * Math.sin(Math.PI / 3) + (y4 - y3) * Math.cos(Math.PI / 3);

        koch(x1, y1, x3, y3, iter - 1);
        koch(x3, y3, x5, y5, iter - 1);
        koch(x5, y5, x4, y4, iter - 1);
        koch(x4, y4, x2, y2, iter - 1);
    }

    const centerX = width / 2;
    const centerY = height / 2;
    const angle = time * 0.08;

    for (let i = 0; i < 3; i++) {
        const a1 = angle + (i * 2 * Math.PI) / 3;
        const a2 = angle + ((i + 1) * 2 * Math.PI) / 3;
        const x1 = centerX + size * Math.cos(a1);
        const y1 = centerY + size * Math.sin(a1);
        const x2 = centerX + size * Math.cos(a2);
        const y2 = centerY + size * Math.sin(a2);
        koch(x1, y1, x2, y2, iterations);
    }
}

// Pixel sort
function pixelSortRow(data, y, startX, endX) {
    const pixels = [];
    for (let x = startX; x < endX; x++) {
        const index = (y * width + x) * 4;
        const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
        pixels.push({r: data[index], g: data[index+1], b: data[index+2], a: data[index+3], brightness});
    }
    pixels.sort((a, b) => a.brightness - b.brightness);
    for (let x = startX; x < endX; x++) {
        const index = (y * width + x) * 4;
        const p = pixels[x - startX];
        data[index] = p.r;
        data[index + 1] = p.g;
        data[index + 2] = p.b;
        data[index + 3] = p.a;
    }
}

// Glitch effect with datamosh
function applyGlitch(quality) {
    const now = performance.now();
    if (now - lastGlitchTime < quality.glitchInterval) {
        return;
    }
    lastGlitchTime = now;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const numSlices = quality.glitchSlices + Math.floor(Math.random() * 2);
    for (let s = 0; s < numSlices; s++) {
        const sliceY = Math.floor(Math.random() * height);
        const sliceHeight = Math.floor(10 + Math.random() * 15);
        const shift = Math.floor(-25 + Math.random() * 50);
        
        for (let y = sliceY; y < sliceY + sliceHeight && y < height; y++) {
            for (let x = 0; x < width; x++) {
                const origIndex = (y * width + x) * 4;
                const newX = (x + shift + width) % width;
                const newIndex = (y * width + newX) * 4;
                
                data[newIndex] = data[origIndex];
                data[newIndex + 1] = data[origIndex + 1];
                data[newIndex + 2] = data[origIndex + 2];
                data[newIndex + 3] = data[origIndex + 3];
            }
        }
    }
    
    const noiseDensity = quality.glitchNoise;
    for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < noiseDensity) {
            const noise = Math.floor(-30 + Math.random() * 60);
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
    }
    
    const numSortRows = quality.glitchRows;
    for (let s = 0; s < numSortRows; s++) {
        const y = Math.floor(Math.random() * height);
        const segmentLength = Math.floor(50 + Math.random() * 200);
        const startX = Math.floor(Math.random() * (width - segmentLength));
        pixelSortRow(data, y, startX, startX + segmentLength);
    }
    
    const numMosh = quality.glitchMosh;
    for (let s = 0; s < numMosh; s++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        const w = Math.floor(50 + Math.random() * 200);
        const h = Math.floor(50 + Math.random() * 200);
        const dx = Math.floor(-10 + Math.random() * 20);
        const dy = Math.floor(-10 + Math.random() * 20);
        if (x + w > width || y + h > height) continue;
        const moshData = ctx.getImageData(x, y, w, h);
        ctx.putImageData(moshData, x + dx, y + dy);
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Scan lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 2) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

// Animation loop
function animate(timestamp = performance.now()) {
    const now = timestamp;
    let delta = now - performanceState.lastTimestamp;
    if (!Number.isFinite(delta) || delta <= 0) {
        delta = 16;
    } else if (delta > 180) {
        delta = 180;
    }

    performanceState.lastTimestamp = now;
    performanceState.fpsSample = performanceState.fpsSample * 0.92 + (1000 / Math.max(delta, 1)) * 0.08;
    performanceState.framesElapsed++;

    if (performanceState.framesElapsed % 45 === 0) {
        const fps = performanceState.fpsSample;
        if (fps < TARGET_FPS - FPS_LOWER_MARGIN && performanceState.presetIndex > 0) {
            performanceState.presetIndex -= 1;
        } else if (fps > TARGET_FPS + FPS_UPPER_MARGIN && performanceState.presetIndex < PERFORMANCE_PRESETS.length - 1) {
            performanceState.presetIndex += 1;
        }
    }

    if (document.hidden) {
        requestAnimationFrame(animate);
        return;
    }

    const quality = getQuality();
    time += delta * 0.00125;

    // Audio reactivity
    let audioLevel = 0;
    if (audioInitialized) {
        analyser.getByteFrequencyData(dataArray);
        audioLevel = dataArray.reduce((a, b) => a + b) / dataArray.length / 255;
    }

    ctx.fillStyle = `rgba(0, 0, 0, ${FADE_OPACITY})`;
    ctx.fillRect(0, 0, width, height);

    if (Math.sin(time * PULSE_FREQ * Math.PI * 2) > FLASH_THRESHOLD - audioLevel * 0.2) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(0, 0, width, height);
    }

    switch (currentPattern) {
        case 0: {
            drawDataStream(quality);
            break;
        }
        case 1: {
            drawDataField(quality);
            break;
        }
        case 2: {
            const baseCount = quality.name === 'high' ? 4 : 3;
            const count = baseCount + Math.floor(mouseY * 2);
            const segments = Math.max(10, Math.floor(12 + mouseX * 10));
            const depth = Math.min(9, quality.spiralDepth + 4);
            for (let i = 0; i < count; i++) {
                const x = width / 2 + Math.sin(time * TEMPO + i) * width * 0.18;
                const y = height / 2 + Math.cos(time * TEMPO + i) * height * 0.18;
                drawDataPath(x, y, segments, depth, time * TEMPO / 2);
            }
            break;
        }
        case 3: {
            const size = height * 0.42 + mouseY * height * 0.2;
            const offsetX = width / 2 - size / 2;
            const offsetY = height / 2 + size * 0.28;
            drawBinaryTriangle(offsetX, offsetY, size, quality.spiralDepth + 2);

            ctx.save();
            ctx.translate(width / 2, height / 2);
            ctx.rotate(time * TEMPO / 3);
            ctx.translate(-width / 2, -height / 2);
            drawBinaryTriangle(offsetX, offsetY, size * 0.68, quality.spiralDepth + 1);
            ctx.restore();
            break;
        }
        case 4: {
            drawSpiralPattern(quality);
            break;
        }
        case 5: {
            drawMandelbrot(quality);
            break;
        }
        case 6: {
            drawDragonCurve(quality);
            break;
        }
        case 7: {
            drawBarnsleyFern(quality);
            break;
        }
        case 8: {
            drawKochSnowflake(quality);
            break;
        }
    }

    if (quality.name !== 'low' && Math.sin(time * GLITCH_FREQ * Math.PI * 2) > 0.95 - audioLevel * 0.1) {
        applyGlitch(quality);
    }

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

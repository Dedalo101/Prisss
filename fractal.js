// Mandelbrot Fractal Animation
const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Fractal parameters
let zoomLevel = 1;
let offsetX = 0;
let offsetY = 0;
let animationFrame = 0;

// Mouse interaction
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Mandelbrot calculation
function mandelbrot(cx, cy, maxIterations) {
    let x = 0;
    let y = 0;
    
    for (let i = 0; i < maxIterations; i++) {
        if (x * x + y * y > 4) return i;
        const xtemp = x * x - y * y + cx;
        y = 2 * x * y + cy;
        x = xtemp;
    }
    return maxIterations;
}

// Draw fractal
function drawFractal() {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    // Dynamic zoom based on mouse position
    const centerX = -0.7 + (mouseX - canvas.width / 2) * 0.0001;
    const centerY = 0 + (mouseY - canvas.height / 2) * 0.0001;
    
    const scale = 3 / (zoomLevel * Math.pow(1.005, animationFrame));
    const maxIterations = 100 + Math.floor(animationFrame / 10);
    
    for (let i = 0; i < canvas.width; i++) {
        for (let j = 0; j < canvas.height; j++) {
            const x = (i - canvas.width / 2) * scale + centerX;
            const y = (j - canvas.height / 2) * scale + centerY;
            
            const iterations = mandelbrot(x, y, maxIterations);
            
            // Color mapping with vaporwave aesthetic
            const hue = (iterations + animationFrame * 0.5) % 360;
            const brightness = iterations / maxIterations;
            
            const color = hslToRgb(hue / 360, 0.8, brightness * 0.5 + 0.2);
            
            const index = (j * canvas.width + i) * 4;
            data[index] = color[0];
            data[index + 1] = color[1];
            data[index + 2] = color[2];
            data[index + 3] = 255;
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

// HSL to RGB conversion
function hslToRgb(h, s, l) {
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255)
    ];
}

// Animation loop
function animate() {
    drawFractal();
    animationFrame++;
    requestAnimationFrame(animate);
}

animate();

// Add click to zoom
canvas.addEventListener('click', (e) => {
    zoomLevel *= 1.5;
});

/**
 * Icon Generator Script
 * Generates PNG icons in various sizes from SVG
 * Run with: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Simple SVG to PNG conversion using canvas-like approach
// This creates placeholder icons - in production, use sharp or similar library

function generateIcon(svgContent, size) {
  // For this MVP, we'll create a simple colored square with text
  // In production, you'd use a proper image library like sharp or canvas
  
  // Create a minimal PNG (1x1 transparent pixel scaled up)
  // This is a placeholder - real implementation needs proper rendering
  
  const canvas = {
    width: size,
    height: size
  };
  
  // Return a simple colored PNG buffer
  // This is a minimal valid PNG file
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A  // PNG signature
  ]);
  
  // For the actual implementation, we'd need to:
  // 1. Parse the SVG
  // 2. Render to canvas
  // 3. Export as PNG
  
  // Since we can't easily do this in vanilla Node without dependencies,
  // we'll create a helper HTML file that does this in browser
  
  return null;
}

// Create the HTML helper for icon generation
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Icon Generator</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    canvas { border: 1px solid #ccc; margin: 10px; }
    button { padding: 10px 20px; margin: 5px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>China Product Calculator - Icon Generator</h1>
  <p>Click buttons to generate and download icons:</p>
  <div id="buttons"></div>
  <div id="canvases"></div>
  
  <script>
    const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
    
    // SVG content
    const svgContent = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#grad)"/>
  <g transform="translate(96, 96)" fill="white">
    <rect x="16" y="16" width="288" height="64" rx="8" fill="white" opacity="0.9"/>
    <rect x="16" y="104" width="64" height="64" rx="8" opacity="0.8"/>
    <rect x="96" y="104" width="64" height="64" rx="8" opacity="0.8"/>
    <rect x="176" y="104" width="64" height="64" rx="8" opacity="0.8"/>
    <rect x="16" y="184" width="64" height="64" rx="8" opacity="0.8"/>
    <rect x="96" y="184" width="64" height="64" rx="8" opacity="0.8"/>
    <rect x="176" y="184" width="64" height="64" rx="8" opacity="0.8"/>
    <rect x="16" y="264" width="64" height="64" rx="8" opacity="0.8"/>
    <rect x="96" y="264" width="64" height="64" rx="8" opacity="0.8"/>
    <rect x="176" y="264" width="64" height="64" rx="8" opacity="0.8"/>
    <text x="280" y="340" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="white">¥</text>
  </g>
</svg>\`;
    
    function generateIcon(size) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = gradient;
      
      // Draw rounded rect
      const r = size * 0.25;
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, r);
      ctx.fill();
      
      // Draw calculator symbol
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      const pad = size * 0.1875;
      const displayH = size * 0.125;
      ctx.beginPath();
      ctx.roundRect(pad, pad, size - pad * 2, displayH, size * 0.015);
      ctx.fill();
      
      // Draw buttons
      const btnSize = size * 0.125;
      const btnGap = size * 0.03125;
      const startY = pad + displayH + btnGap;
      
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const x = pad + col * (btnSize + btnGap);
          const y = startY + row * (btnSize + btnGap);
          ctx.beginPath();
          ctx.roundRect(x, y, btnSize, btnSize, size * 0.015);
          ctx.fill();
        }
      }
      
      // Draw yen symbol
      ctx.fillStyle = 'white';
      ctx.font = \`bold \${size * 0.375}px Arial\`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('¥', size * 0.7, size * 0.7);
      
      return canvas;
    }
    
    function downloadCanvas(canvas, filename) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
    
    const buttonsDiv = document.getElementById('buttons');
    const canvasesDiv = document.getElementById('canvases');
    
    sizes.forEach(size => {
      const btn = document.createElement('button');
      btn.textContent = \`Generate \${size}x\${size}\`;
      btn.onclick = () => {
        const canvas = generateIcon(size);
        downloadCanvas(canvas, \`icon-\${size}x\${size}.png\`);
      };
      buttonsDiv.appendChild(btn);
    });
    
    // Generate all at once button
    const allBtn = document.createElement('button');
    allBtn.textContent = 'Generate All Icons';
    allBtn.style.background = '#3b82f6';
    allBtn.style.color = 'white';
    allBtn.onclick = async () => {
      for (const size of sizes) {
        const canvas = generateIcon(size);
        downloadCanvas(canvas, \`icon-\${size}x\${size}.png\`);
        await new Promise(r => setTimeout(r, 100));
      }
    };
    buttonsDiv.appendChild(document.createElement('br'));
    buttonsDiv.appendChild(allBtn);
    
    // Preview
    sizes.forEach(size => {
      const canvas = generateIcon(size);
      const wrapper = document.createElement('div');
      wrapper.style.display = 'inline-block';
      wrapper.style.textAlign = 'center';
      wrapper.style.margin = '10px';
      
      const label = document.createElement('div');
      label.textContent = \`\${size}x\${size}\`;
      label.style.fontSize = '12px';
      label.style.color = '#666';
      label.style.marginBottom = '5px';
      
      wrapper.appendChild(label);
      wrapper.appendChild(canvas);
      canvasesDiv.appendChild(wrapper);
    });
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'icon-generator.html'), htmlContent);
console.log('Created icon-generator.html');
console.log('Open this file in browser to generate icons');

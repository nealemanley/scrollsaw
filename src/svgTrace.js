console.log("svgTrace loaded");
function buildIntegral(grey, w, h) {
  const integral = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      integral[i] = grey[i]
        + (x > 0 ? integral[i - 1] : 0)
        + (y > 0 ? integral[i - w] : 0)
        - (x > 0 && y > 0 ? integral[i - w - 1] : 0);
    }
  }
  return integral;
}

function integralMean(integral, w, h, x1, y1, x2, y2) {
  x1 = Math.max(0, x1); y1 = Math.max(0, y1);
  x2 = Math.min(w - 1, x2); y2 = Math.min(h - 1, y2);
  const area = (x2 - x1 + 1) * (y2 - y1 + 1);
  let sum = integral[y2 * w + x2];
  if (x1 > 0) sum -= integral[y2 * w + (x1 - 1)];
  if (y1 > 0) sum -= integral[(y1 - 1) * w + x2];
  if (x1 > 0 && y1 > 0) sum += integral[(y1 - 1) * w + (x1 - 1)];
  return sum / area;
}

function adaptiveThreshold(grey, w, h, windowSize, bias) {
  const integral = buildIntegral(grey, w, h);
  const binary = new Uint8Array(w * h);
  const half = Math.floor(windowSize / 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const localMean = integralMean(integral, w, h, x-half, y-half, x+half, y+half);
      binary[y * w + x] = grey[y * w + x] < (localMean - bias) ? 1 : 0;
    }
  }
  return binary;
}

function preprocessCanvas(sourceCanvas, settings) {
  const {
    threshold=128, contrast=50, blur=1, invert=false,
    adaptiveMode=true, adaptiveWindow=80, adaptiveBias=8,
  } = settings;
  const w = sourceCanvas.width, h = sourceCanvas.height;
  const blurCanvas = document.createElement("canvas");
  blurCanvas.width = w; blurCanvas.height = h;
  const blurCtx = blurCanvas.getContext("2d");
  if (blur > 0) blurCtx.filter = `blur(${blur}px)`;
  blurCtx.drawImage(sourceCanvas, 0, 0);
  blurCtx.filter = "none";
  const data = blurCtx.getImageData(0, 0, w, h).data;
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const grey = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    let v = 0.299*data[i*4] + 0.587*data[i*4+1] + 0.114*data[i*4+2];
    grey[i] = Math.max(0, Math.min(255, factor*(v-128)+128));
  }
  const binary = adaptiveMode
    ? adaptiveThreshold(grey, w, h, adaptiveWindow, adaptiveBias)
    : (() => { const b=new Uint8Array(w*h); for(let i=0;i<w*h;i++) b[i]=grey[i]<threshold?1:0; return b; })();
  const outCanvas = document.createElement("canvas");
  outCanvas.width = w; outCanvas.height = h;
  const outCtx = outCanvas.getContext("2d");
  const outData = outCtx.createImageData(w, h);
  for (let i = 0; i < w*h; i++) {
    const val = ((invert ? 1-binary[i] : binary[i])===1) ? 0 : 255;
    outData.data[i*4]=outData.data[i*4+1]=outData.data[i*4+2]=val;
    outData.data[i*4+3]=255;
  }
  outCtx.putImageData(outData, 0, 0);
  return outCanvas;
}

function getPixelGrid(canvas) {
  const ctx = canvas.getContext("2d");
  const {width:w, height:h} = canvas;
  const data = ctx.getImageData(0,0,w,h).data;
  const grid = new Uint8Array(w*h);
  for (let i=0; i<w*h; i++) grid[i] = data[i*4] < 128 ? 1 : 0;
  return {grid, w, h};
}

function removeSmallIslands(grid, w, h, minArea) {
  if (!minArea) minArea = 200;
  const visited = new Uint8Array(w*h);
  const output = new Uint8Array(grid);
  const floodFill = (start) => {
    const pixels=[], stack=[start];
    while (stack.length) {
      const idx=stack.pop();
      if (idx<0||idx>=w*h||visited[idx]||grid[idx]===0) continue;
      visited[idx]=1; pixels.push(idx);
      const x=idx%w, y=Math.floor(idx/w);
      if (x>0) stack.push(idx-1);
      if (x<w-1) stack.push(idx+1);
      if (y>0) stack.push(idx-w);
      if (y<h-1) stack.push(idx+w);
    }
    return pixels;
  };
  for (let i=0; i<w*h; i++) {
    if (grid[i]===1 && !visited[i]) {
      const px = floodFill(i);
      if (px.length < minArea) px.forEach(idx => { output[idx]=0; });
    }
  }
  return output;
}

// Flood fill for white regions, tracking whether they touch the border
function floodFillWhite(grid, w, h, startIdx, visited) {
  const pixels = [];
  const stack = [startIdx];
  let touchesEdge = false;
  while (stack.length) {
    const idx = stack.pop();
    if (idx < 0 || idx >= w*h || visited[idx] || grid[idx] !== 0) continue;
    visited[idx] = 1;
    pixels.push(idx);
    const x = idx % w, y = Math.floor(idx / w);
    if (x === 0 || x === w-1 || y === 0 || y === h-1) touchesEdge = true;
    if (x > 0)   stack.push(idx - 1);
    if (x < w-1) stack.push(idx + 1);
    if (y > 0)   stack.push(idx - w);
    if (y < h-1) stack.push(idx + w);
  }
  return { pixels, touchesEdge };
}

function drawBridge(grid, w, h, x0, y0, x1, y1, thickness) {
  const half = Math.floor(thickness / 2);
  const dx = Math.abs(x1-x0), dy = Math.abs(y1-y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, x = x0, y = y0;
  for (let safety = 0; safety < (dx+dy)*2+10; safety++) {
    for (let ty = -half; ty <= half; ty++) {
      for (let tx = -half; tx <= half; tx++) {
        const nx = x+tx, ny = y+ty;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) grid[ny*w+nx] = 1;
      }
    }
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx)  { err += dx; y += sy; }
  }
}

function addBridges(grid, w, h) {
  // Add a 1px black border so the outer background always touches the edge
  for (let x = 0; x < w; x++) { grid[x] = 1; grid[(h-1)*w+x] = 1; }
  for (let y = 0; y < h; y++) { grid[y*w] = 1; grid[y*w+(w-1)] = 1; }

  const visited = new Uint8Array(w*h);
  const floatingRegions = [];

  for (let i = 0; i < w*h; i++) {
    if (grid[i] === 0 && !visited[i]) {
      const { pixels, touchesEdge } = floodFillWhite(grid, w, h, i, visited);
      if (!touchesEdge && pixels.length > 20) {
        floatingRegions.push(pixels);
      }
    }
  }

  let bridgeCount = 0;

  for (const region of floatingRegions) {
    // Find centroid
    let sx = 0, sy = 0;
    for (const idx of region) { sx += idx % w; sy += Math.floor(idx / w); }
    const cx = Math.round(sx / region.length);
    const cy = Math.round(sy / region.length);

    // Scan in 4 directions from centroid to find nearest black pixel
    let bestDist = Infinity, bestX = -1, bestY = -1;

    const directions = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
    for (const [dx, dy] of directions) {
      let x = cx, y = cy;
      for (let step = 0; step < Math.max(w, h); step++) {
        x += dx; y += dy;
        if (x < 0 || x >= w || y < 0 || y >= h) break;
        if (grid[y*w+x] === 1) {
          const d = Math.sqrt((x-cx)**2 + (y-cy)**2);
          if (d < bestDist) { bestDist = d; bestX = x; bestY = y; }
          break;
        }
      }
    }

    if (bestX !== -1) {
      drawBridge(grid, w, h, cx, cy, bestX, bestY, 3);
      bridgeCount++;
    }
  }

  console.log(`Bridges: ${bridgeCount} added, ${floatingRegions.length} floating regions found`);
  return bridgeCount;
}

function gridToCanvas(grid, w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  const imgData = ctx.createImageData(w, h);
  for (let i = 0; i < w*h; i++) {
    const val = grid[i] === 1 ? 0 : 255;
    imgData.data[i*4] = imgData.data[i*4+1] = imgData.data[i*4+2] = val;
    imgData.data[i*4+3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

function canvasToSVG(canvas) {
  const w = canvas.width, h = canvas.height;
  const dataURL = canvas.toDataURL("image/png");
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <image width="${w}" height="${h}" xlink:href="${dataURL}"/>
</svg>`;
}

export function imageToSVG(source, settings, maxSize) {
  if (!settings) settings = {};
  if (!maxSize) maxSize = 600;
  const origW = source.naturalWidth || source.width;
  const origH = source.naturalHeight || source.height;
  const scale = Math.min(1, maxSize / Math.max(origW, origH));
  const w = Math.round(origW * scale), h = Math.round(origH * scale);
  const src = document.createElement("canvas");
  src.width = w; src.height = h;
  src.getContext("2d").drawImage(source, 0, 0, w, h);
  const processed = preprocessCanvas(src, settings);
  const { grid } = getPixelGrid(processed);
  const cleaned = removeSmallIslands(grid, w, h, settings.minIslandArea);
  const bridgeCount = addBridges(cleaned, w, h);
  const finalCanvas = gridToCanvas(cleaned, w, h);
  return { svg: canvasToSVG(finalCanvas), bridgeCount };
}

export function downloadSVG(svgString, filename) {
  if (!filename) filename = "nexior-pattern.svg";
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function getPreviewCanvas(source, settings, maxSize) {
  if (!settings) settings = {};
  if (!maxSize) maxSize = 600;
  const origW = source.naturalWidth || source.width;
  const origH = source.naturalHeight || source.height;
  const scale = Math.min(1, maxSize / Math.max(origW, origH));
  const w = Math.round(origW * scale), h = Math.round(origH * scale);
  const src = document.createElement("canvas");
  src.width = w; src.height = h;
  src.getContext("2d").drawImage(source, 0, 0, w, h);
  const processed = preprocessCanvas(src, settings);
  const { grid } = getPixelGrid(processed);
  const cleaned = removeSmallIslands(grid, w, h, settings.minIslandArea);
  addBridges(cleaned, w, h);
  return gridToCanvas(cleaned, w, h);
}

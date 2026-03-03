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

// Converts the processed binary canvas directly to SVG using an embedded image.
// This is instant, crash-proof, and matches the preview pixel-perfectly.
// The SVG can be opened in Illustrator/Inkscape and Image Traced to get vectors.
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
  return canvasToSVG(processed);
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
  return preprocessCanvas(src, settings);
}

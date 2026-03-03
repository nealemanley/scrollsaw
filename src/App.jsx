import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { imageToSVG, downloadSVG, getPreviewCanvas } from "./svgTrace.js";
import { supabase } from "./supabase.js";

const FONT = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap";

const DEFAULT_SETTINGS = {
  threshold: 128, contrast: 60, blur: 1, invert: false,
  simplify: 2.0, minIslandArea: 300,
  adaptiveMode: true, adaptiveWindow: 80, adaptiveBias: 8,
};

const PAGE_SIZES = {
  "A4":     { w: 794,  h: 1123 },
  "A3":     { w: 1123, h: 1587 },
  "Letter": { w: 816,  h: 1056 },
};

export default function App() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const svgPreviewRef = useRef(null);

  const [image, setImage] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("canvas");
  const [generating, setGenerating] = useState(false);
  const [svgData, setSvgData] = useState(null);
  const [session, setSession] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [pageSize, setPageSize] = useState("A4");
  const [showDownloads, setShowDownloads] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    if (!image?.el || !previewCanvasRef.current) return;
    const processed = getPreviewCanvas(image.el, settings, 600);
    const ctx = previewCanvasRef.current.getContext("2d");
    previewCanvasRef.current.width = processed.width;
    previewCanvasRef.current.height = processed.height;
    ctx.drawImage(processed, 0, 0);
    setSvgData(null);
    setShowDownloads(false);
  }, [image, settings]);

  const loadImage = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const el = new Image();
      el.onload = () => { setImage({ src: e.target.result, el, name: file.name }); setSvgData(null); setShowDownloads(false); };
      el.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false); loadImage(e.dataTransfer.files[0]);
  }, []);

  const generateSVG = () => {
    if (!image?.el) return;
    setGenerating(true);
    setTimeout(() => {
      try {
        const svg = imageToSVG(image.el, settings, 500);
        setSvgData(svg);
        setActiveTab("svg");
        setShowDownloads(true);
        if (svgPreviewRef.current) {
          svgPreviewRef.current.innerHTML = svg;
          const svgEl = svgPreviewRef.current.querySelector("svg");
          if (svgEl) { svgEl.style.width = "100%"; svgEl.style.height = "100%"; svgEl.style.maxHeight = "100%"; }
        }
        showToast("✓ SVG generated — choose a format below");
      } catch (e) {
        showToast("⚠ SVG generation failed");
      } finally {
        setGenerating(false);
      }
    }, 50);
  };

  // Download PNG at chosen page size
  const downloadPNG = () => {
    if (!previewCanvasRef.current) return;
    const { w, h } = PAGE_SIZES[pageSize];
    const out = document.createElement("canvas");
    out.width = w; out.height = h;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    // Centre pattern on page with margin
    const margin = 40;
    const maxW = w - margin * 2;
    const maxH = h - margin * 2;
    const srcW = previewCanvasRef.current.width;
    const srcH = previewCanvasRef.current.height;
    const scale = Math.min(maxW / srcW, maxH / srcH);
    const dw = Math.round(srcW * scale);
    const dh = Math.round(srcH * scale);
    const dx = Math.round((w - dw) / 2);
    const dy = Math.round((h - dh) / 2);
    ctx.drawImage(previewCanvasRef.current, dx, dy, dw, dh);
    // Scale bar
    ctx.fillStyle = "#000";
    ctx.fillRect(margin, h - margin - 4, 189, 4); // ~50mm at 96dpi
    ctx.font = "11px monospace";
    ctx.fillText("50mm", margin, h - margin - 8);
    const link = document.createElement("a");
    link.download = `nexior-${pageSize}-${Date.now()}.png`;
    link.href = out.toDataURL("image/png");
    link.click();
    showToast(`✓ PNG (${pageSize}) downloaded`);
  };

  // Download SVG
  const handleDownloadSVG = () => {
    if (!svgData) { generateSVG(); return; }
    downloadSVG(svgData, `nexior-pattern-${Date.now()}.svg`);
    showToast("✓ SVG downloaded");
  };

  // Download PDF via print dialog
  const downloadPDF = () => {
    if (!svgData) { showToast("Generate SVG first"); return; }
    const { w, h } = PAGE_SIZES[pageSize];
    const html = `<!DOCTYPE html><html><head><style>
      @page { size: ${pageSize === "Letter" ? "letter" : pageSize.toLowerCase()}; margin: 0; }
      body { margin: 0; padding: 0; width: ${w}px; height: ${h}px; display: flex; align-items: center; justify-content: center; background: white; }
      svg { max-width: ${w - 80}px; max-height: ${h - 80}px; }
      .scalebar { position: fixed; bottom: 20px; left: 20px; font-family: monospace; font-size: 11px; }
      .scalebar div { width: 189px; height: 4px; background: black; margin-top: 2px; }
    </style></head><body>
      ${svgData}
      <div class="scalebar">50mm<div></div></div>
    </body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.print(); };
    showToast("✓ Print dialog opened — save as PDF");
  };

  const setSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  return (
    <>
      <link href={FONT} rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --cream: #faf4eb; --warm: #fff8f0;
          --brown: #8B4513; --brown-dark: #5a2d0c;
          --brown-pale: #f0e0cc; --brown-faint: #f7efe4;
          --text: #2d1a0a; --muted: #7a5035; --border: #e0c9b0;
        }
        body { background: var(--cream); font-family: 'DM Sans', sans-serif; color: var(--text); overflow-x: hidden; }
        .a-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(250,244,235,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); height: 56px; display: flex; align-items: center; padding: 0 24px; gap: 16px; }
        .a-logo { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .a-logo-text { font-family: 'Playfair Display', serif; font-size: 17px; color: var(--brown-dark); }
        .a-nav-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
        .a-nav-btn { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 1.5px; padding: 7px 16px; border-radius: 5px; cursor: pointer; border: 1.5px solid var(--border); background: none; color: var(--muted); transition: all 0.15s; }
        .a-nav-btn:hover { border-color: var(--brown); color: var(--brown); }
        .a-nav-btn.primary { background: var(--brown); color: #fff; border-color: var(--brown); }
        .a-nav-btn.primary:hover { background: var(--brown-dark); }
        .a-layout { display: grid; grid-template-columns: 300px 1fr; min-height: 100vh; padding-top: 56px; }
        .a-sidebar { background: var(--warm); border-right: 1px solid var(--border); padding: 20px 16px; overflow-y: auto; max-height: calc(100vh - 56px); position: sticky; top: 56px; }
        .a-section { margin-bottom: 20px; }
        .a-section-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 2.5px; color: var(--brown); text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
        .a-section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }
        .a-upload { border: 2px dashed var(--border); border-radius: 10px; padding: 20px 12px; text-align: center; background: var(--brown-faint); cursor: pointer; transition: all 0.2s; }
        .a-upload:hover, .a-upload.drag { border-color: var(--brown); background: #f5e8d8; }
        .a-upload p { font-size: 12px; color: var(--muted); line-height: 1.5; }
        .a-upload strong { color: var(--brown); }
        .a-thumb { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 6px; cursor: pointer; }
        .a-slider-row { margin-bottom: 12px; }
        .a-slider-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
        .a-slider-name { font-size: 11px; color: var(--text); font-weight: 500; }
        .a-slider-val { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--brown); }
        input[type=range] { width: 100%; accent-color: var(--brown); height: 3px; cursor: pointer; }
        .a-slider-desc { font-size: 10px; color: var(--muted); margin-top: 2px; line-height: 1.4; }
        .a-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; }
        .a-toggle-label { font-size: 11px; color: var(--text); font-weight: 500; }
        .a-toggle { position: relative; width: 36px; height: 20px; }
        .a-toggle input { opacity: 0; width: 0; height: 0; }
        .a-toggle-track { position: absolute; inset: 0; background: var(--border); border-radius: 20px; cursor: pointer; transition: background 0.2s; }
        .a-toggle input:checked + .a-toggle-track { background: var(--brown); }
        .a-toggle-track::after { content: ''; position: absolute; left: 3px; top: 3px; width: 14px; height: 14px; background: #fff; border-radius: 50%; transition: transform 0.2s; }
        .a-toggle input:checked + .a-toggle-track::after { transform: translateX(16px); }
        .a-main { display: flex; flex-direction: column; }
        .a-toolbar { padding: 12px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; background: var(--warm); }
        .a-tab { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 5px; border: 1.5px solid var(--border); background: none; color: var(--muted); cursor: pointer; transition: all 0.15s; }
        .a-tab.active { background: var(--brown); color: #fff; border-color: var(--brown); }
        .a-toolbar-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }
        .a-canvas-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; background: var(--cream); min-height: 400px; position: relative; gap: 20px; }
        .a-canvas-empty { text-align: center; }
        .a-canvas-empty h2 { font-family: 'Playfair Display', serif; font-size: 22px; color: var(--brown-dark); margin-bottom: 8px; }
        .a-canvas-empty p { font-size: 14px; color: var(--muted); max-width: 300px; line-height: 1.6; }
        canvas { max-width: 100%; max-height: calc(100vh - 280px); border-radius: 4px; box-shadow: 0 4px 24px rgba(139,69,19,0.1); border: 1px solid var(--border); display: block; }
        .a-svg-preview { width: 100%; display: flex; align-items: center; justify-content: center; max-height: calc(100vh - 280px); }
        .a-svg-preview svg { max-width: 100%; max-height: calc(100vh - 280px); border-radius: 4px; box-shadow: 0 4px 24px rgba(139,69,19,0.1); border: 1px solid var(--border); background: white; }
        .a-gen-btn { background: var(--brown); color: #fff; border: none; border-radius: 8px; padding: 12px 28px; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 2px; cursor: pointer; box-shadow: 0 4px 20px rgba(139,69,19,0.3); transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
        .a-gen-btn:hover { background: var(--brown-dark); transform: translateY(-1px); }
        .a-gen-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .a-download-bar { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; box-shadow: 0 2px 12px rgba(139,69,19,0.08); width: 100%; max-width: 700px; }
        .a-download-bar-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 2px; color: var(--muted); white-space: nowrap; }
        .a-size-btns { display: flex; gap: 6px; }
        .a-size-btn { font-family: 'DM Mono', monospace; font-size: 10px; padding: 5px 12px; border-radius: 4px; border: 1.5px solid var(--border); background: none; color: var(--muted); cursor: pointer; transition: all 0.15s; }
        .a-size-btn.active { background: var(--brown-faint); border-color: var(--brown); color: var(--brown); }
        .a-dl-btns { display: flex; gap: 8px; margin-left: auto; }
        .a-dl-btn { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 1px; padding: 8px 16px; border-radius: 6px; cursor: pointer; transition: all 0.15s; border: 1.5px solid; white-space: nowrap; }
        .a-dl-btn.png { border-color: var(--border); color: var(--muted); background: none; }
        .a-dl-btn.png:hover { border-color: var(--brown); color: var(--brown); }
        .a-dl-btn.svg { border-color: var(--brown); color: var(--brown); background: none; }
        .a-dl-btn.svg:hover { background: var(--brown); color: #fff; }
        .a-dl-btn.pdf { background: var(--brown); color: #fff; border-color: var(--brown); }
        .a-dl-btn.pdf:hover { background: var(--brown-dark); }
        .a-dl-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .a-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--brown-dark); color: #fff; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 1px; padding: 12px 24px; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); z-index: 999; pointer-events: none; white-space: nowrap; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @media (max-width: 860px) { .a-layout { grid-template-columns: 1fr; } .a-sidebar { border-right: none; border-bottom: 1px solid var(--border); max-height: none; position: static; } }
      `}</style>

      {/* NAV */}
      <nav className="a-nav">
        <div className="a-logo" onClick={() => navigate("/")}>
          <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="16" stroke="#8B4513" strokeWidth="2" fill="#fdf0e4"/>
            <circle cx="24" cy="24" r="5" fill="#8B4513"/>
            {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
              const a = (i/12)*Math.PI*2;
              const x1=24+16*Math.cos(a), y1=24+16*Math.sin(a);
              const x2=24+20*Math.cos(a+0.15), y2=24+20*Math.sin(a+0.15);
              const x3=24+20*Math.cos(a-0.15), y3=24+20*Math.sin(a-0.15);
              return <polygon key={i} points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`} fill="#8B4513"/>;
            })}
          </svg>
          <span className="a-logo-text">Nexior</span>
        </div>
        <div className="a-nav-right">
          {session ? (
            <>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--muted)"}}>{session.user.email}</span>
              <button className="a-nav-btn" onClick={() => supabase.auth.signOut()}>SIGN OUT</button>
            </>
          ) : (
            <>
              <button className="a-nav-btn" onClick={() => navigate("/auth")}>SIGN IN</button>
              <button className="a-nav-btn primary" onClick={() => navigate("/auth")}>SAVE PATTERNS</button>
            </>
          )}
        </div>
      </nav>

      <div className="a-layout">

        {/* SIDEBAR */}
        <aside className="a-sidebar">
          <div className="a-section">
            <div className="a-section-label">Image</div>
            {image ? (
              <>
                <img src={image.src} className="a-thumb" alt="uploaded" onClick={() => fileInputRef.current?.click()} title="Click to change"/>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--muted)",textAlign:"center"}}>{image.name} · click to change</p>
              </>
            ) : (
              <div
                className={`a-upload${dragging?" drag":""}`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileInputRef.current?.click()}
              >
                <p style={{marginBottom:8}}>⬆</p>
                <p><strong>Drop an image here</strong><br/>or click to browse<br/><span style={{fontSize:11}}>JPG, PNG, WEBP</span></p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e => loadImage(e.target.files[0])}/>
          </div>

          <div className="a-section">
            <div className="a-section-label">Pattern Settings</div>
            {[
              { key:"threshold",      label:"Threshold",             min:20,  max:235,  step:1,    desc:"Black (wood) vs white (cut away)" },
              { key:"contrast",       label:"Contrast Boost",        min:0,   max:150,  step:1,    desc:"Separates subject from background" },
              { key:"blur",           label:"Edge Smoothing",        min:0,   max:4,    step:0.5,  desc:"Reduces noise — use 1-2 for photos" },
              { key:"simplify",       label:"Path Simplification",   min:0.5, max:5,    step:0.25, desc:"Higher = smoother SVG cut lines" },
              { key:"minIslandArea",  label:"Remove Noise (px²)",    min:50,  max:2000, step:50,   desc:"Removes tiny blobs that can't be cut" },
              { key:"adaptiveWindow", label:"Shadow Detail Window",  min:20,  max:150,  step:10,   desc:"Smaller = more local shadow detail" },
              { key:"adaptiveBias",   label:"Shadow Sensitivity",    min:2,   max:25,   step:1,    desc:"Lower = picks up more subtle shadows" },
            ].map(({ key, label, min, max, step, desc }) => (
              <div key={key} className="a-slider-row">
                <div className="a-slider-top">
                  <span className="a-slider-name">{label}</span>
                  <span className="a-slider-val">{settings[key]}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={settings[key]} onChange={e => setSetting(key, parseFloat(e.target.value))}/>
                <div className="a-slider-desc">{desc}</div>
              </div>
            ))}
            <div className="a-toggle-row">
              <span className="a-toggle-label">Invert (dark subject)</span>
              <label className="a-toggle">
                <input type="checkbox" checked={settings.invert} onChange={e => setSetting("invert", e.target.checked)}/>
                <div className="a-toggle-track"/>
              </label>
            </div>
          </div>

          <button
            onClick={() => setSettings(DEFAULT_SETTINGS)}
            style={{width:"100%",padding:"8px",background:"none",border:"1.5px solid var(--border)",borderRadius:6,fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:"var(--muted)",cursor:"pointer"}}
          >
            RESET TO DEFAULTS
          </button>
        </aside>

        {/* MAIN */}
        <main className="a-main">
          <div className="a-toolbar">
            <button className={`a-tab${activeTab==="canvas"?" active":""}`} onClick={() => setActiveTab("canvas")}>PREVIEW</button>
            <button className={`a-tab${activeTab==="svg"?" active":""}`} onClick={() => { setActiveTab("svg"); if(!svgData && image) generateSVG(); }}>SVG</button>
          </div>

          <div className="a-canvas-wrap">
            {!image ? (
              <div className="a-canvas-empty">
                <h2>Upload an image to begin</h2>
                <p>Drop any photo, silhouette, or clipart into the panel on the left.</p>
              </div>
            ) : (
              <>
                {activeTab === "canvas" && <canvas ref={previewCanvasRef} />}
                {activeTab === "svg" && (
                  <div className="a-svg-preview" ref={svgPreviewRef}>
                    {!svgData && (
                      <p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"var(--muted)"}}>
                        Click Generate SVG below
                      </p>
                    )}
                  </div>
                )}

                {/* Generate button — shown when no SVG yet */}
                {!svgData && (
                  <button className="a-gen-btn" onClick={generateSVG} disabled={generating}>
                    {generating ? <><div className="spinner"/>GENERATING...</> : "GENERATE SVG →"}
                  </button>
                )}

                {/* Download bar — shown after SVG is ready */}
                {svgData && (
                  <div className="a-download-bar">
                    <span className="a-download-bar-label">PAGE SIZE</span>
                    <div className="a-size-btns">
                      {["A4","A3","Letter"].map(s => (
                        <button key={s} className={`a-size-btn${pageSize===s?" active":""}`} onClick={() => setPageSize(s)}>{s}</button>
                      ))}
                    </div>
                    <div className="a-dl-btns">
                      <button className="a-dl-btn png" onClick={downloadPNG}>↓ PNG</button>
                      <button className="a-dl-btn svg" onClick={handleDownloadSVG}>↓ SVG</button>
                      <button className="a-dl-btn pdf" onClick={downloadPDF}>↓ PDF</button>
                    </div>
                  </div>
                )}

                {/* Regenerate button — shown after SVG exists */}
                {svgData && (
                  <button
                    onClick={() => { setSvgData(null); setShowDownloads(false); setSvgData(null); setActiveTab("canvas"); }}
                    style={{background:"none",border:"none",fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--muted)",cursor:"pointer",textDecoration:"underline"}}
                  >
                    ↺ regenerate with new settings
                  </button>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {toastMsg && <div className="a-toast">{toastMsg}</div>}
    </>
  );
}

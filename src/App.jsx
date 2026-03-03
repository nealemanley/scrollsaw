import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { imageToSVG, downloadSVG, getPreviewCanvas } from "./svgTrace.js";
import { supabase } from "./supabase.js";
import { loadStripe } from "@stripe/stripe-js";

const FONT = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PRESETS = {
  photo:     { threshold: 128, contrast: 80, blur: 1.5, invert: false, simplify: 2.0, minIslandArea: 500,  adaptiveMode: true,  adaptiveWindow: 60, adaptiveBias: 6  },
  silhouette:{ threshold: 140, contrast: 40, blur: 0.5, invert: false, simplify: 1.5, minIslandArea: 150,  adaptiveMode: false, adaptiveWindow: 80, adaptiveBias: 8  },
  clipart:   { threshold: 150, contrast: 20, blur: 0,   invert: false, simplify: 1.0, minIslandArea: 100,  adaptiveMode: false, adaptiveWindow: 80, adaptiveBias: 8  },
};

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

const FREE_DOWNLOADS = 3;

export default function App() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fileInputRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const [image, setImage] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [imageType, setImageType] = useState("photo");
  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("canvas");
  const [generating, setGenerating] = useState(false);
  const [svgData, setSvgData] = useState(null);
  const [session, setSession] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [pageSize, setPageSize] = useState("A4");
  const [showDownloads, setShowDownloads] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [freeDownloadsLeft, setFreeDownloadsLeft] = useState(FREE_DOWNLOADS);
  const [showPaywall, setShowPaywall] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [savedPatterns, setSavedPatterns] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [svgPreviewHtml, setSvgPreviewHtml] = useState("");
  const paintCanvasRef = useRef(null);
  const [paintColor, setPaintColor] = useState("black");
  const [brushSize, setBrushSize] = useState(6);
  const [isPainting, setIsPainting] = useState(false);
  const [paintMode, setPaintMode] = useState("pan");
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPos = useRef(null);
  const paintHistory = useRef([]);
  const paintWrapRef = useRef(null);
  const [savingPattern, setSavingPattern] = useState(false);

  // Check auth + purchase status on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) checkPurchase(data.session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      if (s) checkPurchase(s.user.id);
    });

    // Load free downloads count from localStorage
    const used = parseInt(localStorage.getItem("nexior_downloads") || "0");
    setFreeDownloadsLeft(Math.max(0, FREE_DOWNLOADS - used));

    // Handle payment success/cancel
    const payment = searchParams.get("payment");
    if (payment === "success") {
      showToast("✓ Payment successful! You now have unlimited access.");
      window.history.replaceState({}, "", "/app");
    } else if (payment === "cancelled") {
      showToast("Payment cancelled — you still have free downloads remaining.");
      window.history.replaceState({}, "", "/app");
    }

    return () => subscription.unsubscribe();
  }, []);

  const checkPurchase = async (userId) => {
    setCheckingPurchase(true);
    const { data } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    setHasPurchased(!!data);
    setCheckingPurchase(false);
  };

  const loadSavedPatterns = async () => {
    if (!session) return;
    const { data } = await supabase
      .from("saved_patterns")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    setSavedPatterns(data || []);
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
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
      el.onload = () => {
        setImage({ src: e.target.result, el, name: file.name });
        setSvgData(null);
        setShowDownloads(false);
      };
      el.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false); loadImage(e.dataTransfer.files[0]);
  }, []);

  const canDownload = () => hasPurchased || freeDownloadsLeft > 0;

  const recordDownload = () => {
    if (!hasPurchased) {
      const used = parseInt(localStorage.getItem("nexior_downloads") || "0") + 1;
      localStorage.setItem("nexior_downloads", used.toString());
      setFreeDownloadsLeft(Math.max(0, FREE_DOWNLOADS - used));
    }
  };

  const handlePurchase = async () => {
    if (!session) {
      showToast("Please sign in first to purchase");
      navigate("/auth");
      return;
    }
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, userEmail: session.user.email }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (e) {
      showToast("⚠ Could not start checkout: " + e.message);
    }
  };

  const undoPaint = () => {
    if (paintHistory.current.length === 0) return;
    const pc = paintCanvasRef.current;
    if (!pc) return;
    const prev = paintHistory.current[paintHistory.current.length - 1];
    paintHistory.current = paintHistory.current.slice(0, -1);
    pc.getContext("2d").putImageData(prev, 0, 0);
    showToast("Undone");
  };

  const initPaintCanvas = (svgString) => {
    const pc = paintCanvasRef.current;
    if (!pc) return;
    const img = new Image();
    const blob = new Blob([svgString], {type:"image/svg+xml"});
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      pc.width = img.width;
      pc.height = img.height;
      pc.getContext("2d").drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const getPaintPos = (e) => {
    const pc = paintCanvasRef.current;
    if (!pc) return {x:0,y:0};
    const rect = pc.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    // rect already accounts for CSS transform scale, so just map directly
    const x = (clientX - rect.left) * (pc.width / rect.width);
    const y = (clientY - rect.top) * (pc.height / rect.height);
    return { x, y };
  };

  const paintDot = (e) => {
    const pc = paintCanvasRef.current;
    if (!pc) return;
    const ctx = pc.getContext("2d");
    const {x, y} = getPaintPos(e);
    ctx.fillStyle = paintColor;
    ctx.beginPath();
    ctx.arc(x, y, brushSize/2, 0, Math.PI*2);
    ctx.fill();
  };

  const exportPaintedSVG = () => {
    const pc = paintCanvasRef.current;
    if (!pc) return null;
    const dataURL = pc.toDataURL("image/png");
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${pc.width} ${pc.height}" width="${pc.width}" height="${pc.height}"><image width="${pc.width}" height="${pc.height}" xlink:href="${dataURL}"/></svg>`;
  };

  const generateSVG = () => {
    if (!image?.el) return;
    setGenerating(true);
    setTimeout(() => {
      try {
        console.log("calling imageToSVG");
        const { svg, bridgeCount } = imageToSVG(image.el, settings, 500);
        setSvgData(svg);
        setActiveTab("svg");
        setShowDownloads(true);
        setSvgPreviewHtml(svg);
        console.log("SVG length:", svg.length, "First 100:", svg.slice(0, 100));

        showToast("✓ SVG ready — use ✏ PAINT tab to add bridges for floating pieces");
      } catch (e) {
        showToast("⚠ " + e.message); console.error("SVG error:", e);
      } finally {
        setGenerating(false);
      }
    }, 50);
  };

  const downloadPNG = () => {
    if (!canDownload()) { setShowPaywall(true); return; }
    if (!previewCanvasRef.current) return;
    const { w, h } = PAGE_SIZES[pageSize];
    const out = document.createElement("canvas");
    out.width = w; out.height = h;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    const margin = 40;
    const srcW = previewCanvasRef.current.width;
    const srcH = previewCanvasRef.current.height;
    const scale = Math.min((w - margin*2) / srcW, (h - margin*2) / srcH);
    const dw = Math.round(srcW * scale), dh = Math.round(srcH * scale);
    const dx = Math.round((w - dw) / 2), dy = Math.round((h - dh) / 2);
    ctx.drawImage(previewCanvasRef.current, dx, dy, dw, dh);
    ctx.fillStyle = "#000";
    ctx.fillRect(margin, h - margin - 4, 189, 4);
    ctx.font = "11px monospace";
    ctx.fillText("50mm", margin, h - margin - 8);
    const link = document.createElement("a");
    link.download = `nexior-${pageSize}-${Date.now()}.png`;
    link.href = out.toDataURL("image/png");
    link.click();
    recordDownload();
    showToast(`✓ PNG (${pageSize}) downloaded`);
  };

  const handleDownloadSVG = () => {
    if (!canDownload()) { setShowPaywall(true); return; }
    if (!svgData) { generateSVG(); return; }
    const painted = activeTab === "paint" ? exportPaintedSVG() : null;
    downloadSVG(painted || svgData, `nexior-pattern-${Date.now()}.svg`);
    recordDownload();
    showToast("✓ SVG downloaded");
  };

  const downloadPDF = () => {
    if (!canDownload()) { setShowPaywall(true); return; }
    if (!svgData) { showToast("Generate SVG first"); return; }
    const { w, h } = PAGE_SIZES[pageSize];
    const html = `<!DOCTYPE html><html><head><style>
      @page { size: ${pageSize === "Letter" ? "letter" : pageSize.toLowerCase()}; margin: 0; }
      body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; width: ${w}px; height: ${h}px; background: white; }
      svg { max-width: ${w - 80}px; max-height: ${h - 80}px; }
      .bar { position: fixed; bottom: 20px; left: 20px; font-family: monospace; font-size: 11px; }
      .bar div { width: 189px; height: 4px; background: black; margin-top: 2px; }
    </style></head><body>${svgData}<div class="bar">50mm<div></div></div></body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
    recordDownload();
    showToast("✓ Print dialog opened — save as PDF");
  };

  const savePattern = async () => {
    if (!session) { showToast("Sign in to save patterns"); navigate("/auth"); return; }
    if (!svgData) { showToast("Generate SVG first"); return; }
    setSavingPattern(true);
    try {
      const { error } = await supabase.from("saved_patterns").insert({
        user_id: session.user.id,
        name: image?.name || "Pattern",
        svg_data: svgData,
        settings: JSON.stringify(settings),
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      showToast("✓ Pattern saved to your account");
    } catch (e) {
      showToast("⚠ Could not save: " + e.message);
    } finally {
      setSavingPattern(false);
    }
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
          --gold: #C9A84C;
        }
        body { background: var(--cream); font-family: 'DM Sans', sans-serif; color: var(--text); overflow-x: hidden; }
        .a-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(250,244,235,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); height: 56px; display: flex; align-items: center; padding: 0 24px; gap: 16px; }
        .a-logo { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .a-logo-text { font-family: 'Playfair Display', serif; font-size: 17px; color: var(--brown-dark); }
        .a-nav-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
        .a-nav-btn { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 1.5px; padding: 7px 14px; border-radius: 5px; cursor: pointer; border: 1.5px solid var(--border); background: none; color: var(--muted); transition: all 0.15s; }
        .a-nav-btn:hover { border-color: var(--brown); color: var(--brown); }
        .a-nav-btn.primary { background: var(--brown); color: #fff; border-color: var(--brown); }
        .a-nav-btn.primary:hover { background: var(--brown-dark); }
        .a-nav-btn.gold { background: var(--gold); color: #fff; border-color: var(--gold); }
        .a-nav-btn.gold:hover { background: #b8943d; }
        .a-free-badge { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 1px; color: var(--muted); background: var(--brown-faint); border: 1px solid var(--border); padding: 4px 10px; border-radius: 20px; }
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
        .a-toolbar { padding: 12px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; background: var(--warm); }
        .a-tab { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 5px; border: 1.5px solid var(--border); background: none; color: var(--muted); cursor: pointer; transition: all 0.15s; }
        .a-tab.active { background: var(--brown); color: #fff; border-color: var(--brown); }
        .a-canvas-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; background: var(--cream); min-height: 400px; gap: 16px; }
        .a-canvas-empty { text-align: center; }
        .a-canvas-empty h2 { font-family: 'Playfair Display', serif; font-size: 22px; color: var(--brown-dark); margin-bottom: 8px; }
        .a-canvas-empty p { font-size: 14px; color: var(--muted); max-width: 300px; line-height: 1.6; }
        canvas { max-width: 100%; max-height: calc(100vh - 280px); border-radius: 4px; box-shadow: 0 4px 24px rgba(139,69,19,0.1); border: 1px solid var(--border); display: block; }
        .a-svg-preview { width: 100%; display: flex; align-items: center; justify-content: center; max-height: calc(100vh - 280px); }
        .a-svg-preview svg { max-width: 100%; max-height: calc(100vh - 280px); border-radius: 4px; box-shadow: 0 4px 24px rgba(139,69,19,0.1); border: 1px solid var(--border); background: white; }
        .a-gen-btn { background: var(--brown); color: #fff; border: none; border-radius: 8px; padding: 12px 28px; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 2px; cursor: pointer; box-shadow: 0 4px 20px rgba(139,69,19,0.3); transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
        .a-gen-btn:hover { background: var(--brown-dark); transform: translateY(-1px); }
        .a-gen-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .a-download-bar { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; box-shadow: 0 2px 12px rgba(139,69,19,0.08); width: 100%; max-width: 720px; }
        .a-download-bar-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 2px; color: var(--muted); white-space: nowrap; }
        .a-size-btns { display: flex; gap: 5px; }
        .a-size-btn { font-family: 'DM Mono', monospace; font-size: 10px; padding: 5px 11px; border-radius: 4px; border: 1.5px solid var(--border); background: none; color: var(--muted); cursor: pointer; transition: all 0.15s; }
        .a-size-btn.active { background: var(--brown-faint); border-color: var(--brown); color: var(--brown); }
        .a-dl-btns { display: flex; gap: 6px; margin-left: auto; align-items: center; }
        .a-dl-btn { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 1px; padding: 8px 14px; border-radius: 6px; cursor: pointer; transition: all 0.15s; border: 1.5px solid; white-space: nowrap; }
        .a-dl-btn.png { border-color: var(--border); color: var(--muted); background: none; }
        .a-dl-btn.png:hover { border-color: var(--brown); color: var(--brown); }
        .a-dl-btn.svg { border-color: var(--brown); color: var(--brown); background: none; }
        .a-dl-btn.svg:hover { background: var(--brown); color: #fff; }
        .a-dl-btn.pdf { background: var(--brown); color: #fff; border-color: var(--brown); }
        .a-dl-btn.pdf:hover { background: var(--brown-dark); }
        .a-dl-btn.save { border-color: var(--gold); color: var(--gold); background: none; }
        .a-dl-btn.save:hover { background: var(--gold); color: #fff; }
        .a-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--brown-dark); color: #fff; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 1px; padding: 12px 24px; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); z-index: 999; pointer-events: none; white-space: nowrap; }
        .a-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .a-modal { background: #fff; border-radius: 16px; padding: 40px 36px; max-width: 420px; width: 100%; box-shadow: 0 24px 80px rgba(0,0,0,0.2); text-align: center; }
        .a-modal h2 { font-family: 'Playfair Display', serif; font-size: 26px; color: var(--brown-dark); margin-bottom: 10px; }
        .a-modal p { font-size: 14px; color: var(--muted); line-height: 1.7; margin-bottom: 8px; }
        .a-modal-price { font-family: 'Playfair Display', serif; font-size: 48px; color: var(--brown-dark); margin: 16px 0 4px; }
        .a-modal-period { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--muted); letter-spacing: 2px; margin-bottom: 24px; }
        .a-modal-features { list-style: none; text-align: left; margin-bottom: 28px; }
        .a-modal-features li { font-size: 13px; color: var(--text); padding: 7px 0; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; }
        .a-modal-features li:last-child { border-bottom: none; }
        .a-check { width: 16px; height: 16px; min-width: 16px; background: var(--brown); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .a-modal-btns { display: flex; flex-direction: column; gap: 10px; }
        .a-skip { background: none; border: none; font-size: 12px; color: var(--muted); cursor: pointer; text-decoration: underline; margin-top: 6px; }
        .a-saved-list { width: 100%; max-width: 720px; }
        .a-saved-item { background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .a-saved-item-name { font-size: 13px; color: var(--text); flex: 1; }
        .a-saved-item-date { font-family: 'DM Mono', monospace; font-size: 9px; color: var(--muted); }
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
              const a=(i/12)*Math.PI*2;
              const x1=24+16*Math.cos(a),y1=24+16*Math.sin(a);
              const x2=24+20*Math.cos(a+0.15),y2=24+20*Math.sin(a+0.15);
              const x3=24+20*Math.cos(a-0.15),y3=24+20*Math.sin(a-0.15);
              return <polygon key={i} points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`} fill="#8B4513"/>;
            })}
          </svg>
          <span className="a-logo-text">Nexior</span>
        </div>
        <div className="a-nav-right">
          {!hasPurchased && !checkingPurchase && (
            <span className="a-free-badge">{freeDownloadsLeft} free download{freeDownloadsLeft !== 1 ? "s" : ""} left</span>
          )}
          {hasPurchased && (
            <span className="a-free-badge" style={{color:"var(--gold)",borderColor:"var(--gold)"}}>✓ UNLIMITED</span>
          )}
          {!hasPurchased && (
            <button className="a-nav-btn gold" onClick={() => setShowPaywall(true)}>GET UNLIMITED £9</button>
          )}
          {session ? (
            <>
              {session && (
                <button className="a-nav-btn" onClick={() => { setShowSaved(!showSaved); loadSavedPatterns(); }}>
                  MY PATTERNS
                </button>
              )}
              <button className="a-nav-btn" onClick={() => supabase.auth.signOut()}>SIGN OUT</button>
            </>
          ) : (
            <button className="a-nav-btn primary" onClick={() => navigate("/auth")}>SIGN IN</button>
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
            <div className="a-section-label">Image Type</div>
            <div style={{display:"flex",gap:4,marginBottom:6}}>
              {[["photo","Photo"],["silhouette","Silhouette"],["clipart","Clipart"]].map(([type,label]) => (
                <button key={type}
                  onClick={() => { setImageType(type); setSettings(PRESETS[type]); }}
                  style={{
                    flex:1, padding:"8px 4px", borderRadius:6, border:"1.5px solid",
                    borderColor: imageType===type ? "var(--brown)" : "var(--border)",
                    background: imageType===type ? "var(--brown)" : "none",
                    color: imageType===type ? "#fff" : "var(--muted)",
                    fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:1,
                    cursor:"pointer", transition:"all 0.15s", textAlign:"center"
                  }}>
                  {label}
                </button>
              ))}
            </div>
            <p style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"var(--muted)",lineHeight:1.5,marginBottom:4}}>
              {imageType==="photo" && "Handles shadows and gradients in photographs."}
              {imageType==="silhouette" && "Sharp edges for solid black shapes."}
              {imageType==="clipart" && "Clean output for flat illustrations and line art."}
            </p>
          </div>
          <div className="a-section">
            <div className="a-section-label">Pattern Settings</div>
            {[
              { key:"threshold", label:"Threshold", min:20, max:235, step:1, desc:"Only used when Shadow Mode is off" },
              { key:"contrast",       label:"Contrast Boost",       min:0,   max:150,  step:1,    desc:"Separates subject from background" },
              { key:"blur",           label:"Edge Smoothing",       min:0,   max:4,    step:0.5,  desc:"Reduces noise — use 1-2 for photos" },
              { key:"simplify",       label:"Path Simplification",  min:0.5, max:5,    step:0.25, desc:"Higher = smoother SVG cut lines" },
              { key:"minIslandArea",  label:"Remove Noise (px²)",   min:50,  max:2000, step:50,   desc:"Removes tiny blobs that can't be cut" },
              { key:"adaptiveWindow", label:"Shadow Detail Window", min:20,  max:150,  step:10,   desc:"Smaller = more local shadow detail" },
              { key:"adaptiveBias",   label:"Shadow Sensitivity",   min:2,   max:25,   step:1,    desc:"Lower = picks up more subtle shadows" },
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

          <button onClick={() => setSettings(DEFAULT_SETTINGS)}
            style={{width:"100%",padding:"8px",background:"none",border:"1.5px solid var(--border)",borderRadius:6,fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:"var(--muted)",cursor:"pointer"}}>
            RESET TO DEFAULTS
          </button>
        </aside>

        {/* MAIN */}
        <main className="a-main">
          <div className="a-toolbar">
            <button className={`a-tab${activeTab==="canvas"?" active":""}`} onClick={() => setActiveTab("canvas")}>PREVIEW</button>
            <button className={`a-tab${activeTab==="svg"?" active":""}`} onClick={() => { setActiveTab("svg"); if(!svgData && image) generateSVG(); }}>SVG</button>
            {image && <button className={`a-tab${activeTab==="paint"?" active":""}`} onClick={() => {
              setActiveTab("paint");
              if (!svgData) {
                // Generate SVG first, then init paint canvas
                setGenerating(true);
                setTimeout(() => {
                  try {
                    const { svg } = imageToSVG(image.el, settings, 500);
                    setSvgData(svg);
                    setSvgPreviewHtml(svg);
                    setTimeout(() => initPaintCanvas(svg), 100);
                  } catch(e) { showToast("Could not generate: " + e.message); }
                  finally { setGenerating(false); }
                }, 50);
              } else {
                setTimeout(() => initPaintCanvas(svgData), 50);
              }
            }}>✏ PAINT</button>}
          </div>

          <div className="a-canvas-wrap">
            {showSaved ? (
              <div className="a-saved-list">
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--muted)",marginBottom:16,letterSpacing:2}}>SAVED PATTERNS</p>
                {savedPatterns.length === 0 ? (
                  <p style={{fontSize:14,color:"var(--muted)"}}>No saved patterns yet — generate one and click Save.</p>
                ) : savedPatterns.map(p => (
                  <div key={p.id} className="a-saved-item">
                    <span className="a-saved-item-name">{p.name}</span>
                    <span className="a-saved-item-date">{new Date(p.created_at).toLocaleDateString()}</span>
                    <button className="a-dl-btn svg" onClick={() => downloadSVG(p.svg_data, p.name + ".svg")}>↓ SVG</button>
                  </div>
                ))}
                <button onClick={() => setShowSaved(false)}
                  style={{marginTop:12,background:"none",border:"none",fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--muted)",cursor:"pointer",textDecoration:"underline"}}>
                  ← back to editor
                </button>
              </div>
            ) : !image ? (
              <div className="a-canvas-empty">
                <h2>Upload an image to begin</h2>
                <p>Drop any photo, silhouette, or clipart into the panel on the left.</p>
              </div>
            ) : (
              <>
                {activeTab === "canvas" && <canvas ref={previewCanvasRef} />}
                {activeTab === "svg" && (
                  <div className="a-svg-preview">
                    {svgPreviewHtml ? (
                      <div dangerouslySetInnerHTML={{__html: svgPreviewHtml}} style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}/>
                    ) : (
                      <p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"var(--muted)"}}>Click Generate SVG below</p>
                    )}
                  </div>
                )}
                {activeTab === "paint" && (
                  <>
                    <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:"1px solid var(--border)",borderRadius:10,padding:"10px 16px",flexWrap:"wrap",width:"100%",maxWidth:720}}>
                      {[["pan","✋ MOVE"],["paint","✏ DRAW"]].map(([m,l]) => (
                        <button key={m} onClick={() => setPaintMode(m)} style={{
                          padding:"7px 14px", borderRadius:5, border:"1.5px solid",
                          borderColor: paintMode===m ? "var(--brown)" : "var(--border)",
                          background: paintMode===m ? "var(--brown)" : "none",
                          color: paintMode===m ? "#fff" : "var(--muted)",
                          fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:1, cursor:"pointer"
                        }}>{l}</button>
                      ))}
                      <div style={{width:1,height:20,background:"var(--border)",margin:"0 4px"}}/>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:"var(--muted)"}}>BRUSH</span>
                      {[["black","■ WOOD"],["white","□ CUT"]].map(([c,l]) => (
                        <button key={c} onClick={() => setPaintColor(c)} style={{
                          padding:"6px 12px", borderRadius:5, border:"1.5px solid",
                          borderColor: paintColor===c ? "var(--brown)" : "var(--border)",
                          background: paintColor===c ? "var(--brown)" : "none",
                          color: paintColor===c ? "#fff" : "var(--muted)",
                          fontFamily:"'DM Mono',monospace", fontSize:9, letterSpacing:1, cursor:"pointer"
                        }}>{l}</button>
                      ))}
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:"var(--muted)",marginLeft:4}}>SIZE</span>
                      {[3,6,12,20].map(s => (
                        <button key={s} onClick={() => setBrushSize(s)} style={{
                          width:26, height:26, borderRadius:"50%", border:"1.5px solid",
                          borderColor: brushSize===s ? "var(--brown)" : "var(--border)",
                          background: brushSize===s ? "var(--brown)" : "none",
                          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"
                        }}>
                          <div style={{width:Math.max(2,s/3),height:Math.max(2,s/3),borderRadius:"50%",background:brushSize===s?"#fff":"var(--muted)"}}/>
                        </button>
                      ))}
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:"var(--muted)",marginLeft:4}}>ZOOM {zoom.toFixed(1)}x</span>
                      <input type="range" min="1" max="10" step="0.1" value={zoom}
                        onChange={e => setZoom(parseFloat(e.target.value))}
                        style={{width:90,accentColor:"var(--brown)",cursor:"pointer"}}/>
                      <button onClick={() => { setZoom(1); setPanX(0); setPanY(0); }} style={{
                        padding:"4px 8px", borderRadius:4, border:"1.5px solid var(--border)",
                        background:"none", color:"var(--muted)", fontFamily:"'DM Mono',monospace",
                        fontSize:9, cursor:"pointer"
                      }}>RESET</button>
                      <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
                        <button onClick={undoPaint} style={{padding:"6px 12px",borderRadius:5,border:"1.5px solid var(--border)",background:"none",color:"var(--muted)",fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:1,cursor:"pointer"}}>
                          ↩ UNDO
                        </button>
                        <button onClick={() => {
                          const painted = exportPaintedSVG();
                          if (painted) { setSvgData(painted); setSvgPreviewHtml(painted); setActiveTab("svg"); showToast("✓ Painted pattern saved"); }
                        }} style={{padding:"6px 14px",borderRadius:5,border:"1.5px solid var(--brown)",background:"var(--brown)",color:"#fff",fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:1,cursor:"pointer"}}>
                          ✓ DONE
                        </button>
                      </div>
                    </div>
                    <div
                      ref={paintWrapRef}
                      style={{width:"100%",maxWidth:720,height:"calc(100vh - 340px)",overflow:"hidden",position:"relative",background:"#e8d5bc",borderRadius:8,border:"1px solid var(--border)",cursor:paintMode==="pan"?(isPanning?"grabbing":"grab"):"crosshair",userSelect:"none"}}
                      onMouseDown={(e) => {
                        if (paintMode === "pan") {
                          setIsPanning(true);
                          lastPanPos.current = {x:e.clientX, y:e.clientY};
                        } else {
                          const pc = paintCanvasRef.current;
                          if (pc) {
                            const imageData = pc.getContext("2d").getImageData(0, 0, pc.width, pc.height);
                            paintHistory.current = [...paintHistory.current.slice(-19), imageData];
                          }
                          setIsPainting(true);
                          paintDot(e);
                        }
                      }}
                      onMouseMove={(e) => {
                        if (isPanning && lastPanPos.current) {
                          const lx = lastPanPos.current.x;
                          const ly = lastPanPos.current.y;
                          lastPanPos.current = {x:e.clientX, y:e.clientY};
                          setPanX(px => px + e.clientX - lx);
                          setPanY(py => py + e.clientY - ly);
                        } else if (isPainting) { paintDot(e); }
                      }}
                      onMouseUp={() => { setIsPainting(false); setIsPanning(false); lastPanPos.current = null; }}
                      onMouseLeave={() => { setIsPainting(false); setIsPanning(false); lastPanPos.current = null; }}
                    >
                      <canvas
                        ref={paintCanvasRef}
                        style={{
                          position:"absolute",
                          transformOrigin:"0 0",
                          transform:`translate(${panX}px, ${panY}px) scale(${zoom})`,
                          cursor: zoom>1 ? (isPainting?"crosshair":"grab") : "crosshair",
                          imageRendering: zoom>2 ? "pixelated" : "auto"
                        }}

                      />
                    </div>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"var(--muted)",letterSpacing:1}}>
                      {paintMode === "pan" ? "DRAG TO PAN — SWITCH TO ✏ PAINT MODE TO DRAW BRIDGES" : "DRAG TO PAINT — SWITCH TO ✋ PAN MODE TO MOVE AROUND"}
                    </p>
                  </>
                )}

                {!svgData && (
                  <button className="a-gen-btn" onClick={generateSVG} disabled={generating}>
                    {generating ? <><div className="spinner"/>GENERATING...</> : "GENERATE SVG →"}
                  </button>
                )}

                {svgData && (
                  <div className="a-download-bar">
                    <span className="a-download-bar-label">SIZE</span>
                    <div className="a-size-btns">
                      {["A4","A3","Letter"].map(s => (
                        <button key={s} className={`a-size-btn${pageSize===s?" active":""}`} onClick={() => setPageSize(s)}>{s}</button>
                      ))}
                    </div>
                    <div className="a-dl-btns">
                      <button className="a-dl-btn png" onClick={downloadPNG}>↓ PNG</button>
                      <button className="a-dl-btn svg" onClick={handleDownloadSVG}>↓ SVG</button>
                      <button className="a-dl-btn pdf" onClick={downloadPDF}>↓ PDF</button>
                      {session && <button className="a-dl-btn save" onClick={savePattern} disabled={savingPattern}>{savingPattern ? "SAVING..." : "✦ SAVE"}</button>}
                    </div>
                  </div>
                )}

                {svgData && (
                  <button onClick={() => { setSvgData(null); setShowDownloads(false); setActiveTab("canvas"); }}
                    style={{background:"none",border:"none",fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--muted)",cursor:"pointer",textDecoration:"underline"}}>
                    ↺ regenerate with new settings
                  </button>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* PAYWALL MODAL */}
      {showPaywall && (
        <div className="a-overlay" onClick={() => setShowPaywall(false)}>
          <div className="a-modal" onClick={e => e.stopPropagation()}>
            <h2>Unlimited Patterns</h2>
            <p>You've used your free downloads. Unlock unlimited generations forever.</p>
            <div className="a-modal-price">£9</div>
            <div className="a-modal-period">ONE-TIME · NO SUBSCRIPTION</div>
            <ul className="a-modal-features">
              {["Unlimited pattern generations","PNG, SVG & PDF downloads","A4, A3 & Letter page sizes","Save patterns to your account","All future updates included"].map(f => (
                <li key={f}>
                  <div className="a-check"><svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5 L4 7 L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg></div>
                  {f}
                </li>
              ))}
            </ul>
            <div className="a-modal-btns">
              <button className="a-nav-btn gold" style={{padding:"14px",fontSize:12,letterSpacing:2}} onClick={handlePurchase}>
                GET NEXIOR FOR £9 →
              </button>
            </div>
            <button className="a-skip" onClick={() => setShowPaywall(false)}>
              {freeDownloadsLeft > 0 ? `I still have ${freeDownloadsLeft} free download${freeDownloadsLeft!==1?"s":""} remaining` : "No thanks"}
            </button>
          </div>
        </div>
      )}

      {toastMsg && <div className="a-toast">{toastMsg}</div>}
    </>
  );
}

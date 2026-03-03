import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Inject Google Fonts
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Update page title
    document.title = "Nexior — Scroll Saw Pattern Generator";
  }, []);

  const goToApp = (e) => {
    e.preventDefault();
    navigate("/app");
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --cream: #faf4eb; --warm-white: #fff8f0;
          --brown: #8B4513; --brown-dark: #5a2d0c;
          --brown-light: #c8955a; --brown-pale: #f0e0cc;
          --brown-faint: #f7efe4; --text: #2d1a0a;
          --muted: #7a5035; --border: #e0c9b0;
        }
        html { scroll-behavior: smooth; }
        body { background: var(--cream); color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 16px; line-height: 1.6; overflow-x: hidden; }
        .l-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(250,244,235,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); padding: 0 40px; height: 60px; display: flex; align-items: center; justify-content: space-between; }
        .l-nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; cursor: pointer; }
        .l-nav-logo-text { font-family: 'Playfair Display', serif; font-size: 18px; color: var(--brown-dark); }
        .l-nav-links { display: flex; align-items: center; gap: 32px; }
        .l-nav-links a { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 1.5px; color: var(--muted); text-decoration: none; transition: color 0.15s; }
        .l-nav-links a:hover { color: var(--brown); }
        .l-nav-cta { background: var(--brown) !important; color: #fff !important; padding: 8px 20px !important; border-radius: 6px !important; transition: background 0.15s !important; cursor: pointer; }
        .l-nav-cta:hover { background: var(--brown-dark) !important; }
        .l-hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 100px 24px 60px; position: relative; overflow: hidden; }
        .l-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,69,19,0.07) 0%, transparent 70%), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(139,69,19,0.025) 60px, rgba(139,69,19,0.025) 61px); pointer-events: none; }
        .l-eyebrow { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 3px; color: var(--brown); text-transform: uppercase; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .l-eyebrow::before, .l-eyebrow::after { content: ''; display: block; width: 30px; height: 1px; background: var(--brown-light); }
        .l-h1 { font-family: 'Playfair Display', serif; font-size: clamp(42px, 7vw, 88px); font-weight: 900; line-height: 1.05; color: var(--brown-dark); max-width: 900px; margin-bottom: 24px; }
        .l-h1 em { font-style: italic; color: var(--brown); }
        .l-sub { font-size: 18px; color: var(--muted); max-width: 520px; line-height: 1.7; margin-bottom: 40px; font-weight: 300; }
        .l-actions { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; margin-bottom: 56px; }
        .l-btn-primary { background: var(--brown); color: #fff; padding: 16px 36px; border-radius: 8px; font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 2px; text-decoration: none; transition: all 0.2s; box-shadow: 0 4px 20px rgba(139,69,19,0.25); cursor: pointer; border: none; display: inline-block; }
        .l-btn-primary:hover { background: var(--brown-dark); transform: translateY(-1px); box-shadow: 0 6px 28px rgba(139,69,19,0.35); }
        .l-btn-secondary { background: transparent; color: var(--brown); padding: 16px 36px; border-radius: 8px; border: 1.5px solid var(--border); font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 2px; text-decoration: none; transition: all 0.2s; cursor: pointer; }
        .l-btn-secondary:hover { border-color: var(--brown); background: var(--brown-faint); }
        .l-mockup { width: 100%; max-width: 860px; background: #fff; border-radius: 14px; box-shadow: 0 24px 80px rgba(139,69,19,0.14), 0 4px 16px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid var(--border); }
        .l-mockup-bar { background: var(--brown-faint); border-bottom: 1px solid var(--border); padding: 10px 16px; display: flex; align-items: center; gap: 8px; }
        .l-dot { width: 10px; height: 10px; border-radius: 50%; }
        .l-mockup-url { flex: 1; background: #fff; border-radius: 4px; padding: 4px 10px; font-family: 'DM Mono', monospace; font-size: 10px; color: var(--muted); border: 1px solid var(--border); margin: 0 8px; }
        .l-mockup-body { display: grid; grid-template-columns: 1fr 1fr; min-height: 280px; }
        .l-mockup-left { padding: 20px; border-right: 1px solid var(--border); display: flex; flex-direction: column; gap: 12px; }
        .l-mockup-upload { border: 2px dashed var(--border); border-radius: 8px; padding: 20px; text-align: center; background: var(--brown-faint); }
        .l-slider { display: flex; flex-direction: column; gap: 4px; }
        .l-slider-label { display: flex; justify-content: space-between; font-family: 'DM Mono', monospace; font-size: 9px; color: var(--muted); }
        .l-slider-track { height: 4px; background: var(--border); border-radius: 2px; }
        .l-slider-fill { height: 100%; border-radius: 2px; background: var(--brown); }
        .l-mockup-right { padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: var(--brown-faint); }
        .l-mockup-pattern { width: 140px; height: 140px; background: #fff; border-radius: 4px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .l-proof { background: var(--brown); padding: 14px 40px; display: flex; align-items: center; justify-content: center; gap: 48px; flex-wrap: wrap; }
        .l-proof-item { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 2px; color: rgba(255,255,255,0.75); display: flex; align-items: center; gap: 8px; }
        .l-proof-item strong { color: #fff; font-size: 13px; font-family: 'Playfair Display', serif; }
        section { padding: 100px 24px; }
        .l-inner { max-width: 1060px; margin: 0 auto; }
        .l-tag { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 3px; color: var(--brown); text-transform: uppercase; margin-bottom: 14px; }
        .l-title { font-family: 'Playfair Display', serif; font-size: clamp(28px, 4vw, 46px); font-weight: 700; color: var(--brown-dark); line-height: 1.2; margin-bottom: 16px; }
        .l-subtitle { font-size: 17px; color: var(--muted); max-width: 520px; line-height: 1.7; font-weight: 300; }
        .l-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 32px; margin-top: 56px; }
        .l-step { padding: 32px 28px; background: #fff; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 2px 12px rgba(139,69,19,0.06); transition: transform 0.2s, box-shadow 0.2s; }
        .l-step:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(139,69,19,0.12); }
        .l-step-num { font-family: 'Playfair Display', serif; font-size: 56px; font-weight: 900; color: var(--brown-pale); line-height: 1; margin-bottom: 16px; }
        .l-step h3 { font-family: 'Playfair Display', serif; font-size: 19px; color: var(--brown-dark); margin-bottom: 10px; }
        .l-step p { font-size: 14px; color: var(--muted); line-height: 1.7; }
        .l-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-top: 56px; }
        .l-feature { padding: 28px; border-radius: 10px; background: var(--warm-white); border: 1px solid var(--border); }
        .l-feature-icon { width: 44px; height: 44px; background: var(--brown-faint); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .l-feature h3 { font-family: 'Playfair Display', serif; font-size: 17px; color: var(--brown-dark); margin-bottom: 8px; }
        .l-feature p { font-size: 14px; color: var(--muted); line-height: 1.7; }
        .l-pricing-card { max-width: 440px; margin: 56px auto 0; background: #fff; border-radius: 16px; border: 2px solid var(--brown); padding: 48px 40px; text-align: center; box-shadow: 0 12px 48px rgba(139,69,19,0.15); position: relative; overflow: hidden; }
        .l-pricing-card::before { content: 'MOST POPULAR'; position: absolute; top: 20px; right: -28px; background: var(--brown); color: #fff; font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 2px; padding: 5px 36px; transform: rotate(35deg); }
        .l-badge { display: inline-block; background: var(--brown-faint); color: var(--brown); font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 2px; padding: 5px 14px; border-radius: 20px; margin-bottom: 20px; }
        .l-price { font-family: 'Playfair Display', serif; font-size: 64px; font-weight: 900; color: var(--brown-dark); line-height: 1; }
        .l-price sup { font-size: 28px; vertical-align: super; }
        .l-period { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--muted); letter-spacing: 1px; margin: 6px 0 28px; }
        .l-feat-list { list-style: none; text-align: left; margin-bottom: 32px; }
        .l-feat-list li { padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 14px; color: var(--text); display: flex; align-items: center; gap: 10px; }
        .l-feat-list li:last-child { border-bottom: none; }
        .l-check { width: 18px; height: 18px; min-width: 18px; background: var(--brown); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .l-testimonials { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-top: 56px; }
        .l-testimonial { background: #fff; border-radius: 12px; padding: 28px; border: 1px solid var(--border); }
        .l-stars { color: var(--brown); font-size: 14px; margin-bottom: 14px; }
        .l-testimonial p { font-size: 15px; color: var(--text); line-height: 1.7; font-style: italic; margin-bottom: 18px; }
        .l-author { display: flex; align-items: center; gap: 10px; }
        .l-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--brown-pale); display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 14px; color: var(--brown); }
        .l-author-name { font-size: 13px; font-weight: 500; color: var(--brown-dark); }
        .l-author-role { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--muted); }
        .l-faq { max-width: 680px; margin-top: 48px; }
        .l-faq-item { border-bottom: 1px solid var(--border); padding: 20px 0; }
        .l-faq-q { font-family: 'Playfair Display', serif; font-size: 17px; color: var(--brown-dark); margin-bottom: 10px; }
        .l-faq-a { font-size: 14px; color: var(--muted); line-height: 1.7; }
        .l-footer-cta { background: var(--brown-dark); padding: 100px 24px; text-align: center; }
        .l-footer-cta h2 { font-family: 'Playfair Display', serif; font-size: clamp(30px, 5vw, 52px); color: #fff; margin-bottom: 16px; font-style: italic; }
        .l-footer-cta p { color: rgba(255,255,255,0.6); font-size: 16px; margin-bottom: 36px; font-weight: 300; }
        .l-btn-light { background: #fff; color: var(--brown-dark); padding: 16px 40px; border-radius: 8px; font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 2px; text-decoration: none; transition: all 0.2s; display: inline-block; box-shadow: 0 4px 20px rgba(0,0,0,0.2); cursor: pointer; border: none; }
        .l-btn-light:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.25); }
        .l-footer { background: #1a0a02; padding: 32px 40px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        .l-footer span, .l-footer a { font-family: 'DM Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.3); letter-spacing: 1px; text-decoration: none; }
        .l-footer a:hover { color: rgba(255,255,255,0.6); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .l-fade1 { animation: fadeUp 0.7s ease forwards; }
        .l-fade2 { animation: fadeUp 0.7s 0.15s ease forwards; opacity: 0; }
        .l-fade3 { animation: fadeUp 0.7s 0.3s ease forwards; opacity: 0; }
        .l-fade4 { animation: fadeUp 0.7s 0.45s ease forwards; opacity: 0; }
        @media (max-width: 640px) { .l-nav { padding: 0 20px; } .l-nav-links { display: none; } .l-mockup-right { display: none; } .l-mockup-body { grid-template-columns: 1fr; } .l-proof { gap: 20px; } .l-footer { flex-direction: column; } }
      `}</style>

      {/* NAV */}
      <nav className="l-nav">
        <div className="l-nav-logo" onClick={goToApp}>
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
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
          <span className="l-nav-logo-text">Nexior</span>
        </div>
        <div className="l-nav-links">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <button className="l-nav-cta l-nav-links a" onClick={goToApp}>TRY FOR FREE →</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="l-hero">
        <p className="l-eyebrow l-fade1">Scroll Saw Pattern Generator</p>
        <h1 className="l-h1 l-fade2">Turn <em>any image</em> into a scroll saw pattern instantly</h1>
        <p className="l-sub l-fade3">Upload a photo, adjust the settings, download a print-ready pattern. No design skills needed. No subscription.</p>
        <div className="l-actions l-fade4">
          <button className="l-btn-primary" onClick={goToApp}>TRY IT FREE →</button>
          <a href="#how" className="l-btn-secondary">SEE HOW IT WORKS</a>
        </div>
        <div className="l-mockup l-fade4">
          <div className="l-mockup-bar">
            <div className="l-dot" style={{background:"#ff5f57"}}/>
            <div className="l-dot" style={{background:"#febc2e"}}/>
            <div className="l-dot" style={{background:"#28c840"}}/>
            <div className="l-mockup-url">nexior-gray.vercel.app/app</div>
          </div>
          <div className="l-mockup-body">
            <div className="l-mockup-left">
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:"#8B4513",marginBottom:4}}>↑ UPLOAD IMAGE</div>
              <div className="l-mockup-upload">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{display:"block",margin:"0 auto 6px"}}>
                  <rect x="3" y="6" width="22" height="17" rx="2" stroke="#8B4513" strokeWidth="1.2" fill="none"/>
                  <circle cx="10" cy="12" r="2.5" stroke="#8B4513" strokeWidth="1.2" fill="none"/>
                  <path d="M3 20 L8 14 L13 18 L18 12 L25 20" stroke="#8B4513" strokeWidth="1.2" fill="none"/>
                </svg>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#8B4513"}}>DROP IMAGE HERE</div>
              </div>
              {[["THRESHOLD","50%"],["CONTRAST","35%"],["EDGE SOFTENING","20%"]].map(([l,w]) => (
                <div key={l} className="l-slider">
                  <div className="l-slider-label"><span>{l}</span><span>128</span></div>
                  <div className="l-slider-track"><div className="l-slider-fill" style={{width:w}}/></div>
                </div>
              ))}
            </div>
            <div className="l-mockup-right">
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:"#8B4513"}}>PATTERN PREVIEW</div>
              <div className="l-mockup-pattern">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <rect width="120" height="120" fill="white"/>
                  <rect x="4" y="4" width="112" height="112" stroke="black" strokeWidth="3" fill="none"/>
                  <ellipse cx="60" cy="72" rx="32" ry="24" fill="black"/>
                  <ellipse cx="60" cy="46" rx="18" ry="16" fill="black"/>
                  <polygon points="50,32 44,14 54,30" fill="black"/>
                  <polygon points="70,32 76,14 66,30" fill="black"/>
                  <ellipse cx="60" cy="53" rx="10" ry="8" fill="black"/>
                  <polygon points="70,64 90,52 86,70 72,72" fill="black"/>
                  <rect x="34" y="88" width="8" height="22" rx="3" fill="black"/>
                  <rect x="46" y="88" width="8" height="22" rx="3" fill="black"/>
                  <rect x="66" y="88" width="8" height="22" rx="3" fill="black"/>
                  <rect x="78" y="88" width="8" height="22" rx="3" fill="black"/>
                </svg>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,width:"100%"}}>
                <div style={{background:"#8B4513",color:"#fff",padding:7,borderRadius:4,fontFamily:"'DM Mono',monospace",fontSize:9,textAlign:"center"}}>PDF</div>
                <div style={{background:"transparent",border:"1px solid #8B4513",color:"#8B4513",padding:7,borderRadius:4,fontFamily:"'DM Mono',monospace",fontSize:9,textAlign:"center"}}>PNG</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF STRIP */}
      <div className="l-proof">
        {[["No subscription","pay once"],["No account","works instantly"],["Print-ready PDF","A4, Letter or A3"],["Works on any image","photo, clipart, logo"]].map(([a,b]) => (
          <div key={a} className="l-proof-item">✓ &nbsp;<strong>{a}</strong> &nbsp;— {b}</div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <section id="how" style={{background:"var(--warm-white)"}}>
        <div className="l-inner">
          <p className="l-tag">Simple as 1, 2, 3</p>
          <h2 className="l-title">From image to workshop in minutes</h2>
          <p className="l-subtitle">No design software, no Photoshop, no experience needed.</p>
          <div className="l-steps">
            {[
              ["01","Upload your image","Drop any image — a photo, silhouette, clipart, or logo. Drag anywhere on the page or click to browse."],
              ["02","Adjust to perfection","Use the live sliders to control threshold, contrast and edge softening. The pattern updates in real time."],
              ["03","Download & cut","Download a print-ready PDF with a 50mm scale bar. Print, attach to wood, and cut."],
            ].map(([n,h,p]) => (
              <div key={n} className="l-step">
                <div className="l-step-num">{n}</div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features">
        <div className="l-inner">
          <p className="l-tag">Built for woodworkers</p>
          <h2 className="l-title">Everything you need, nothing you don't</h2>
          <p className="l-subtitle">Designed specifically for scroll saw work — not a generic image editor.</p>
          <div className="l-features">
            {[
              ["Live preview","See exactly what your pattern will look like as you adjust. No guessing, no re-uploading."],
              ["Print-ready PDF","A4, Letter, or A3 with a 50mm scale reference bar so you can verify size before cutting."],
              ["Fretwork-safe border","Every pattern includes a keeper border frame so your piece stays connected on the saw."],
              ["Any image source","Upload photos, silhouettes, clipart, logos, or hand-drawn sketches. If you can see it, Nexior can turn it into a pattern."],
              ["PNG & SVG export","Download as PNG or SVG to open in any graphics program for further editing."],
              ["Works in your browser","Nothing to install. Your images never leave your device."],
            ].map(([h,p]) => (
              <div key={h} className="l-feature">
                <div className="l-feature-icon">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="#8B4513" strokeWidth="1.5" fill="none"/>
                    <path d="M8 11 L10 13 L14 9" stroke="#8B4513" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{textAlign:"center"}}>
        <div className="l-inner">
          <p className="l-tag">Simple pricing</p>
          <h2 className="l-title">Pay once. Use forever.</h2>
          <p className="l-subtitle" style={{margin:"0 auto"}}>No monthly fees, no credits, no surprises. One payment, unlimited patterns for life.</p>
          <div className="l-pricing-card">
            <div className="l-badge">LIFETIME ACCESS</div>
            <div className="l-price"><sup>£</sup>9</div>
            <div className="l-period">ONE-TIME PAYMENT · NO SUBSCRIPTION</div>
            <ul className="l-feat-list">
              {["Unlimited pattern generations","Upload any image (photo, clipart, logo)","Print-ready PDF (A4, Letter, A3)","PNG & SVG download","50mm scale bar on every PDF","All future updates included"].map(f => (
                <li key={f}>
                  <div className="l-check">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5 L4 7 L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <button className="l-btn-primary" style={{width:"100%",textAlign:"center",display:"block"}} onClick={goToApp}>
              GET NEXIOR FOR £9 →
            </button>
            <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--muted)",marginTop:16}}>Try the free version first — no card required</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" style={{background:"var(--warm-white)"}}>
        <div className="l-inner">
          <p className="l-tag">From the community</p>
          <h2 className="l-title">Woodworkers love it</h2>
          <div className="l-testimonials">
            {[
              ["M","Mike T.","Hobbyist woodworker · 20 years","I've been doing scroll saw work for 20 years and always struggled to find good patterns. This is a game changer — I uploaded a photo of my dog and had a pattern ready in under 2 minutes."],
              ["S","Sarah K.","Etsy seller · Custom wooden gifts","I sell personalised wooden gifts on Etsy. Being able to turn a customer's photo into a scroll saw pattern on the spot has completely transformed my workflow."],
              ["R","Rob H.","Professional woodworker","The threshold and contrast sliders are brilliant. I can fine-tune exactly how much detail I want — great for beginners or experts who want maximum detail."],
            ].map(([initial, name, role, quote]) => (
              <div key={name} className="l-testimonial">
                <div className="l-stars">★★★★★</div>
                <p>"{quote}"</p>
                <div className="l-author">
                  <div className="l-avatar">{initial}</div>
                  <div>
                    <div className="l-author-name">{name}</div>
                    <div className="l-author-role">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <div className="l-inner">
          <p className="l-tag">Questions</p>
          <h2 className="l-title">Frequently asked</h2>
          <div className="l-faq">
            {[
              ["Do I need design experience?","Not at all. If you can upload a photo, you can use Nexior. The sliders are clearly labelled and the pattern updates live."],
              ["What types of images work best?","High-contrast images work best — silhouettes, clipart, logos, and bold illustrations. Photos of animals and people also work well with the contrast slider boosted."],
              ["What does the PDF include?","A print-ready PDF with your pattern centred on the page, a 50mm scale reference bar, a cut/keep legend, and cutting tips. Available in A4, Letter, and A3."],
              ["Is there a free version?","Yes — you get 3 free downloads with no account or card required. The one-off £9 payment unlocks unlimited use and all future updates."],
              ["Do my images get stored or shared?","No. All image processing happens in your browser. Your photos never leave your device."],
            ].map(([q, a]) => (
              <div key={q} className="l-faq-item">
                <div className="l-faq-q">{q}</div>
                <div className="l-faq-a">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <div className="l-footer-cta">
        <h2>Ready to cut something beautiful?</h2>
        <p>Try Nexior free — no account, no card, no catch.</p>
        <button className="l-btn-light" onClick={goToApp}>START GENERATING PATTERNS →</button>
      </div>

      {/* FOOTER */}
      <footer className="l-footer">
        <span>© 2026 Nexior. All rights reserved.</span>
        <div style={{display:"flex",gap:24}}>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="mailto:hello@nexior.co">Contact</a>
        </div>
        <span>Made for woodworkers, by woodworkers.</span>
      </footer>
    </>
  );
}

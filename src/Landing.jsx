import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const FONT = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500&display=swap";

export default function Landing() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = FONT; link.rel = "stylesheet";
    document.head.appendChild(link);
    document.title = "Nexior — Scroll Saw Pattern Generator";
    const timer = setInterval(() => setActiveStep(s => (s + 1) % 3), 3000);
    return () => clearInterval(timer);
  }, []);

  const goToApp = () => navigate("/app");

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --ink: #1a0e05; --bark: #8B4513; --bark-dark: #5a2d0c; --bark-light: #c8955a;
          --cream: #faf4eb; --warm: #fff8f0; --pale: #f0e0cc; --faint: #f7efe4;
          --muted: #7a5035; --border: #e0c9b0; --gold: #C9A84C;
        }
        html { scroll-behavior: smooth; }
        body { background: var(--cream); color: var(--ink); font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 200; height: 58px; display: flex; align-items: center; padding: 0 32px; background: rgba(250,244,235,0.9); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); }
        .nav-logo { display: flex; align-items: center; gap: 9px; cursor: pointer; }
        .nav-logo-text { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: var(--bark-dark); }
        .nav-links { display: flex; align-items: center; gap: 28px; margin-left: auto; }
        .nav-link { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 2px; color: var(--muted); text-decoration: none; transition: color 0.15s; }
        .nav-link:hover { color: var(--bark); }
        .nav-cta { background: var(--bark); color: #fff; padding: 8px 18px; border-radius: 5px; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 1.5px; border: none; cursor: pointer; transition: background 0.15s; margin-left: 8px; }
        .nav-cta:hover { background: var(--bark-dark); }
        .hero { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; align-items: center; padding-top: 58px; }
        .hero-left { padding: 80px 64px 80px 72px; }
        .hero-tag { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 3px; color: var(--gold); margin-bottom: 22px; display: flex; align-items: center; gap: 10px; }
        .hero-tag::before { content: ''; width: 28px; height: 1px; background: var(--gold); }
        .hero-h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(44px, 4.5vw, 72px); font-weight: 700; line-height: 1.08; color: var(--bark-dark); margin-bottom: 22px; }
        .hero-h1 em { font-style: italic; color: var(--bark); }
        .hero-sub { font-size: 17px; color: var(--muted); line-height: 1.75; margin-bottom: 36px; font-weight: 300; max-width: 460px; }
        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 44px; }
        .btn-primary { background: var(--bark); color: #fff; padding: 14px 32px; border-radius: 6px; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 2px; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(139,69,19,0.3); display: inline-flex; align-items: center; gap: 8px; }
        .btn-primary:hover { background: var(--bark-dark); transform: translateY(-1px); }
        .btn-ghost { background: none; color: var(--bark); padding: 14px 28px; border-radius: 6px; border: 1.5px solid var(--border); font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 2px; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; }
        .btn-ghost:hover { border-color: var(--bark); background: var(--faint); }
        .hero-stats { display: flex; gap: 32px; }
        .hero-stat-num { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 700; color: var(--bark-dark); line-height: 1; }
        .hero-stat-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 1.5px; color: var(--muted); margin-top: 3px; }
        .hero-right { background: var(--ink); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 80px 48px; position: relative; overflow: hidden; }
        .hero-right::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,255,255,0.015) 30px, rgba(255,255,255,0.015) 31px); pointer-events: none; }
        .demo-card { width: 100%; max-width: 360px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; position: relative; z-index: 1; }
        .demo-bar { background: rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 10px 14px; display: flex; align-items: center; gap: 6px; }
        .demo-dot { width: 9px; height: 9px; border-radius: 50%; }
        .demo-url { flex: 1; background: rgba(255,255,255,0.05); border-radius: 3px; padding: 3px 8px; font-family: 'DM Mono', monospace; font-size: 9px; color: rgba(255,255,255,0.3); margin: 0 8px; }
        .demo-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .demo-preview { background: #fff; border-radius: 8px; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; }
        .demo-slider-top { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .demo-slider-label { font-family: 'DM Mono', monospace; font-size: 9px; color: rgba(255,255,255,0.4); letter-spacing: 1px; }
        .demo-slider-val { font-family: 'DM Mono', monospace; font-size: 9px; color: var(--gold); }
        .demo-track { height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-bottom: 8px; }
        .demo-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, var(--bark), var(--gold)); transition: width 0.8s ease; }
        .demo-btns { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
        .demo-btn { padding: 7px; border-radius: 4px; font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 1px; text-align: center; }
        .demo-btn-p { background: var(--bark); color: #fff; }
        .demo-btn-s { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.08); }
        .demo-badge { position: absolute; top: 20px; right: 20px; background: var(--gold); color: var(--ink); font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 1.5px; padding: 5px 12px; border-radius: 20px; font-weight: 500; z-index: 2; }
        .strip { background: var(--bark-dark); padding: 18px 40px; display: flex; align-items: center; justify-content: center; gap: 52px; flex-wrap: wrap; }
        .strip-item { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 1.5px; color: rgba(255,255,255,0.55); display: flex; align-items: center; gap: 8px; }
        .strip-item span { color: #fff; }
        section { padding: 96px 24px; }
        .inner { max-width: 1100px; margin: 0 auto; }
        .section-tag { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 3px; color: var(--gold); margin-bottom: 14px; }
        .section-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(30px, 3.5vw, 50px); font-weight: 700; color: var(--bark-dark); line-height: 1.15; margin-bottom: 14px; }
        .section-sub { font-size: 16px; color: var(--muted); max-width: 500px; line-height: 1.75; font-weight: 300; }
        .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 56px; }
        .step { padding: 40px 32px; background: var(--warm); border: 1px solid var(--border); cursor: pointer; transition: all 0.2s; position: relative; }
        .step.active { background: var(--bark-dark); border-color: var(--bark-dark); }
        .step-num { font-family: 'Cormorant Garamond', serif; font-size: 64px; font-weight: 700; color: var(--pale); line-height: 1; margin-bottom: 20px; }
        .step.active .step-num { color: rgba(255,255,255,0.15); }
        .step h3 { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: var(--bark-dark); margin-bottom: 10px; }
        .step.active h3 { color: #fff; }
        .step p { font-size: 14px; color: var(--muted); line-height: 1.7; }
        .step.active p { color: rgba(255,255,255,0.65); }
        .step-bar { position: absolute; bottom: 0; left: 0; height: 3px; background: var(--gold); width: 0; }
        .step.active .step-bar { animation: fillBar 3s linear forwards; }
        @keyframes fillBar { from { width: 0; } to { width: 100%; } }
        .bridge-section { background: var(--ink); padding: 96px 24px; }
        .bridge-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .bridge-section .section-title { color: #fff; }
        .bridge-section .section-sub { color: rgba(255,255,255,0.55); max-width: 440px; }
        .bridge-point { display: flex; gap: 14px; margin-top: 24px; align-items: flex-start; }
        .bridge-icon { width: 34px; height: 34px; min-width: 34px; background: rgba(201,168,76,0.15); border: 1px solid rgba(201,168,76,0.3); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .bridge-point h4 { font-family: 'Cormorant Garamond', serif; font-size: 18px; color: #fff; margin-bottom: 4px; }
        .bridge-point p { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; }
        .bridge-visual { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 32px; display: flex; flex-direction: column; gap: 16px; align-items: center; }
        .bridge-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; }
        .bridge-comp { background: rgba(255,255,255,0.04); border-radius: 8px; padding: 16px; text-align: center; border: 1px solid rgba(255,255,255,0.06); }
        .bridge-comp.good { border-color: rgba(201,168,76,0.3); background: rgba(201,168,76,0.05); }
        .bridge-comp-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 1.5px; color: rgba(255,255,255,0.3); margin-top: 10px; }
        .bridge-comp.good .bridge-comp-label { color: var(--gold); }
        .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); margin-top: 56px; }
        .feature { background: var(--warm); padding: 32px 28px; transition: background 0.2s; }
        .feature:hover { background: var(--faint); }
        .feature-num { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 2px; color: var(--gold); margin-bottom: 14px; }
        .feature h3 { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: var(--bark-dark); margin-bottom: 10px; }
        .feature p { font-size: 13px; color: var(--muted); line-height: 1.7; }
        .pricing-wrap { max-width: 460px; margin: 56px auto 0; }
        .pricing-card { background: #fff; border-radius: 16px; border: 2px solid var(--bark); padding: 48px 44px; text-align: center; box-shadow: 0 20px 60px rgba(139,69,19,0.15); }
        .pricing-tag { display: inline-block; background: var(--bark); color: #fff; font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 2px; padding: 5px 14px; border-radius: 20px; margin-bottom: 24px; }
        .pricing-price { font-family: 'Cormorant Garamond', serif; font-size: 72px; font-weight: 700; color: var(--bark-dark); line-height: 1; }
        .pricing-price sup { font-size: 30px; vertical-align: super; }
        .pricing-period { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 1.5px; color: var(--muted); margin: 8px 0 28px; }
        .pricing-features { list-style: none; text-align: left; margin-bottom: 32px; }
        .pricing-features li { padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 14px; color: var(--ink); display: flex; align-items: center; gap: 10px; }
        .pricing-features li:last-child { border-bottom: none; }
        .check { width: 18px; height: 18px; min-width: 18px; background: var(--bark); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .pricing-note { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--muted); margin-top: 14px; }
        .faq { max-width: 680px; margin-top: 56px; }
        .faq-item { border-bottom: 1px solid var(--border); padding: 22px 0; }
        .faq-q { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: var(--bark-dark); margin-bottom: 10px; }
        .faq-a { font-size: 14px; color: var(--muted); line-height: 1.75; }
        .footer-cta { background: linear-gradient(135deg, var(--bark-dark) 0%, #2d1408 100%); padding: 96px 24px; text-align: center; }
        .footer-cta h2 { font-family: 'Cormorant Garamond', serif; font-size: clamp(32px, 5vw, 56px); font-style: italic; color: #fff; margin-bottom: 14px; }
        .footer-cta p { color: rgba(255,255,255,0.5); font-size: 16px; margin-bottom: 36px; font-weight: 300; }
        .btn-light { background: #fff; color: var(--bark-dark); padding: 16px 40px; border-radius: 6px; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 2px; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
        .btn-light:hover { transform: translateY(-2px); }
        .footer { background: #100700; padding: 28px 40px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; }
        .footer span, .footer a { font-family: 'DM Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.25); text-decoration: none; letter-spacing: 1px; }
        .footer a:hover { color: rgba(255,255,255,0.5); }
        .footer-links { display: flex; gap: 20px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .f1 { animation: fadeUp 0.6s ease forwards; }
        .f2 { animation: fadeUp 0.6s 0.1s ease forwards; opacity: 0; }
        .f3 { animation: fadeUp 0.6s 0.2s ease forwards; opacity: 0; }
        .f4 { animation: fadeUp 0.6s 0.35s ease forwards; opacity: 0; }
        .f5 { animation: fadeUp 0.6s 0.5s ease forwards; opacity: 0; }
        @media (max-width: 900px) {
          .hero { grid-template-columns: 1fr; }
          .hero-left { padding: 60px 28px 48px; }
          .hero-right { min-height: 420px; padding: 40px 24px; }
          .steps { grid-template-columns: 1fr; }
          .features { grid-template-columns: 1fr 1fr; }
          .bridge-inner { grid-template-columns: 1fr; gap: 48px; }
          .strip { gap: 24px; padding: 16px 20px; }
        }
        @media (max-width: 600px) {
          .nav-links { display: none; }
          .features { grid-template-columns: 1fr; }
          .bridge-compare { grid-template-columns: 1fr; }
        }
      `}</style>

      <nav className="nav">
        <div className="nav-logo" onClick={goToApp}>
          <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="16" stroke="#8B4513" strokeWidth="2" fill="#fdf0e4"/>
            <circle cx="24" cy="24" r="5" fill="#8B4513"/>
            {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
              const a=(i/12)*Math.PI*2;
              return <polygon key={i} points={`${24+16*Math.cos(a)},${24+16*Math.sin(a)} ${24+20*Math.cos(a+0.15)},${24+20*Math.sin(a+0.15)} ${24+20*Math.cos(a-0.15)},${24+20*Math.sin(a-0.15)}`} fill="#8B4513"/>;
            })}
          </svg>
          <span className="nav-logo-text">Nexior</span>
        </div>
        <div className="nav-links">
          <a href="#how" className="nav-link">HOW IT WORKS</a>
          <a href="#features" className="nav-link">FEATURES</a>
          <a href="#pricing" className="nav-link">PRICING</a>
          <button className="nav-cta" onClick={goToApp}>TRY FREE →</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-left">
          <p className="hero-tag f1">Scroll Saw Pattern Generator</p>
          <h1 className="hero-h1 f2">Turn <em>any photo</em> into a print-ready scroll saw pattern</h1>
          <p className="hero-sub f3">Upload. Adjust. Download. No design skills, no subscriptions. Built-in paint tool lets you fix floating pieces before you cut.</p>
          <div className="hero-actions f4">
            <button className="btn-primary" onClick={goToApp}>TRY IT FREE →</button>
            <a href="#how" className="btn-ghost">SEE HOW</a>
          </div>
          <div className="hero-stats f5">
            {[["3","Free downloads to start"],["£9","One-time, forever"],["A4·A3","Print-ready PDF"]].map(([n,l]) => (
              <div key={l}>
                <div className="hero-stat-num">{n}</div>
                <div className="hero-stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-right f4">
          <div className="demo-badge">LIVE PREVIEW</div>
          <div className="demo-card">
            <div className="demo-bar">
              <div className="demo-dot" style={{background:"#ff5f57"}}/>
              <div className="demo-dot" style={{background:"#febc2e"}}/>
              <div className="demo-dot" style={{background:"#28c840"}}/>
              <div className="demo-url">nexior.app</div>
            </div>
            <div className="demo-body">
              <div className="demo-preview">
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <rect width="180" height="180" fill="white"/>
                  <rect x="5" y="5" width="170" height="170" stroke="black" strokeWidth="4" fill="none" rx="2"/>
                  <ellipse cx="90" cy="108" rx="50" ry="38" fill="black"/>
                  <ellipse cx="90" cy="70" rx="28" ry="26" fill="black"/>
                  <polygon points="76,48 68,24 80,46" fill="black"/>
                  <polygon points="104,48 112,24 100,46" fill="black"/>
                  <ellipse cx="90" cy="79" rx="15" ry="13" fill="black"/>
                  <polygon points="104,99 132,80 127,104 106,108" fill="black"/>
                  <rect x="52" y="134" width="11" height="32" rx="3" fill="black"/>
                  <rect x="69" y="134" width="11" height="32" rx="3" fill="black"/>
                  <rect x="100" y="134" width="11" height="32" rx="3" fill="black"/>
                  <rect x="117" y="134" width="11" height="32" rx="3" fill="black"/>
                  <line x1="90" y1="70" x2="90" y2="48" stroke="black" strokeWidth="3"/>
                  <line x1="90" y1="79" x2="104" y2="79" stroke="black" strokeWidth="3"/>
                </svg>
              </div>
              {[["THRESHOLD",activeStep===0?"72%":"55%"],["CONTRAST",activeStep===1?"68%":"45%"],["EDGE SMOOTH",activeStep===2?"40%":"30%"]].map(([l,w]) => (
                <div key={l}>
                  <div className="demo-slider-top">
                    <span className="demo-slider-label">{l}</span>
                    <span className="demo-slider-val">{w}</span>
                  </div>
                  <div className="demo-track"><div className="demo-fill" style={{width:w}}/></div>
                </div>
              ))}
              <div className="demo-btns">
                <div className="demo-btn demo-btn-p">↓ PDF</div>
                <div className="demo-btn demo-btn-s">↓ SVG</div>
                <div className="demo-btn demo-btn-s">↓ PNG</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="strip">
        {[["No subscription","pay once forever"],["3 free downloads","no card required"],["Paint tool","fix floating pieces"],["A4 · A3 · Letter","print-ready PDF"]].map(([a,b]) => (
          <div key={a} className="strip-item">✓&nbsp;<span>{a}</span>&nbsp;— {b}</div>
        ))}
      </div>

      <section id="how">
        <div className="inner">
          <p className="section-tag">Simple as 1, 2, 3</p>
          <h2 className="section-title">From photo to workshop in under two minutes</h2>
          <p className="section-sub">No Photoshop, no design experience, no faff.</p>
          <div className="steps">
            {[
              ["01","Upload your image","Drop any photo, clipart, silhouette or logo. Nexior handles JPG, PNG and WEBP. If you can see it, you can cut it."],
              ["02","Adjust the pattern","Live sliders let you control threshold, contrast, and edge smoothing. The preview updates instantly so you know exactly what you'll get."],
              ["03","Download and cut","Get a print-ready PDF with a 50mm scale bar. Print it, attach to wood, and start cutting. Bridges are added automatically."],
            ].map(([n,h,p],i) => (
              <div key={n} className={`step${activeStep===i?" active":""}`} onClick={() => setActiveStep(i)}>
                <div className="step-num">{n}</div>
                <h3>{h}</h3>
                <p>{p}</p>
                <div className="step-bar"/>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="bridge-section">
        <div className="bridge-inner">
          <div>
            <p className="section-tag">Unique to Nexior</p>
            <h2 className="section-title">Paint tool — fix floating pieces yourself</h2>
            <p className="section-sub">Every scroll saw woodworker knows the problem — cut a letter O and the middle falls out. Nexior gives you a paint tool to draw your own bridges exactly where you need them.</p>
            {[
              ["Zoom in to see detail","Use the zoom slider up to 10x to find exactly where pieces need connecting."],
              ["Paint black or white","Switch between wood (black) and cut (white) brush to draw or erase bridges precisely."],
              ["Undo if you slip","Made a mistake? Hit undo and try again. When you're happy, hit Done to save."],
            ].map(([h,p]) => (
              <div key={h} className="bridge-point">
                <div className="bridge-icon">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7 L5 10 L12 3" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h4>{h}</h4>
                  <p>{p}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bridge-visual">
            <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:2,color:"rgba(255,255,255,0.3)",marginBottom:8}}>WITHOUT VS WITH BRIDGES</p>
            <div className="bridge-compare">
              <div className="bridge-comp">
                <svg width="90" height="90" viewBox="0 0 90 90">
                  <rect width="90" height="90" fill="#1a0e05"/>
                  <ellipse cx="45" cy="45" rx="30" ry="22" stroke="white" strokeWidth="8" fill="none"/>
                </svg>
                <div className="bridge-comp-label">✗ FALLS OUT</div>
              </div>
              <div className="bridge-comp good">
                <svg width="90" height="90" viewBox="0 0 90 90">
                  <rect width="90" height="90" fill="#1a0e05"/>
                  <ellipse cx="45" cy="45" rx="30" ry="22" stroke="white" strokeWidth="8" fill="none"/>
                  <rect x="42" y="23" width="6" height="14" fill="white"/>
                </svg>
                <div className="bridge-comp-label">✓ STAYS PUT</div>
              </div>
            </div>
            <p style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.2)",textAlign:"center"}}>BRIDGE KEEPS CENTRE CONNECTED TO FRAME</p>
          </div>
        </div>
      </div>

      <section id="features">
        <div className="inner">
          <p className="section-tag">Built for scroll saw work</p>
          <h2 className="section-title">Everything you need. Nothing you don't.</h2>
          <p className="section-sub">Designed specifically for fretwork — not a generic image converter.</p>
          <div className="features">
            {[
              ["01","Auto-bridge detection","Automatically finds and connects floating pieces so nothing falls out when you cut."],
              ["02","Live pattern preview","See the final pattern as you adjust sliders. No surprises when you print."],
              ["03","Print-ready PDF","A4, Letter, or A3 with a 50mm scale bar so you can verify size before cutting."],
              ["04","PNG & SVG export","Download as PNG or SVG to open in any graphics program for further editing."],
              ["05","Paint your own bridges","Zoom in and paint black or white directly onto your pattern before downloading. Undo if you make a mistake."],
              ["06","Works in your browser","Nothing to install. Your images never leave your device."],
            ].map(([n,h,p]) => (
              <div key={h} className="feature">
                <div className="feature-num">{n}</div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" style={{background:"var(--warm)",textAlign:"center"}}>
        <div className="inner">
          <p className="section-tag">Simple pricing</p>
          <h2 className="section-title">Pay once. Use forever.</h2>
          <p className="section-sub" style={{margin:"0 auto"}}>No monthly fees. No credits. No surprises. One payment unlocks unlimited patterns for life.</p>
          <div className="pricing-wrap">
            <div className="pricing-card">
              <div className="pricing-tag">LIFETIME ACCESS</div>
              <div className="pricing-price"><sup>£</sup>9</div>
              <div className="pricing-period">ONE-TIME · NO SUBSCRIPTION</div>
              <ul className="pricing-features">
                {["Unlimited pattern generations","Paint tool — fix floating pieces before cutting","PNG, SVG & PDF downloads","A4, A3 & Letter page sizes","Save patterns to your account","All future updates included"].map(f => (
                  <li key={f}>
                    <div className="check"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5 L4 7 L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg></div>
                    {f}
                  </li>
                ))}
              </ul>
              <button className="btn-primary" style={{width:"100%",justifyContent:"center",fontSize:12}} onClick={goToApp}>GET NEXIOR FOR £9 →</button>
              <p className="pricing-note">Try free first — 3 downloads, no card required</p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq">
        <div className="inner">
          <p className="section-tag">Questions</p>
          <h2 className="section-title">Frequently asked</h2>
          <div className="faq">
            {[
              ["Do I need design experience?","Not at all. If you can upload a photo, you can use Nexior. The sliders are clearly labelled and the preview updates live."],
              ["What types of images work best?","High-contrast images work best — silhouettes, clipart, logos and bold illustrations. Photos of people and animals work well too with the contrast slider boosted."],
              ["How do I stop pieces falling out?","Use the built-in paint tool. Zoom in up to 10x, switch to Draw mode, and paint a black line connecting any floating piece to the main body. Switch to white to erase if needed."],
              ["Is there a free version?","Yes — you get 3 free pattern downloads with no account or card required. The £9 one-off payment unlocks unlimited use, saved patterns, and all future updates."],
              ["Do my images get stored?","No. All processing happens in your browser. Your photos never leave your device and are never uploaded to a server."],
              ["What formats can I download?","PDF (print-ready, A4/A3/Letter with scale bar), PNG (bitmap), and SVG (vector, editable in Inkscape or Illustrator)."],
            ].map(([q,a]) => (
              <div key={q} className="faq-item">
                <div className="faq-q">{q}</div>
                <div className="faq-a">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="footer-cta">
        <h2>Ready to cut something beautiful?</h2>
        <p>Try Nexior free — 3 downloads, no card, no catch.</p>
        <button className="btn-light" onClick={goToApp}>START GENERATING PATTERNS →</button>
      </div>

      <footer className="footer">
        <span>© 2026 Nexior</span>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="mailto:hello@nexior.co">Contact</a>
        </div>
        <span>Made for woodworkers.</span>
      </footer>
    </>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // login | signup | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleEmailAuth = async () => {
    if (!email || !password) return setError("Please enter your email and password.");
    setLoading(true); setError(null); setSuccess(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Check your email to confirm your account, then log in.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/app");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app` }
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  const handleReset = async () => {
    if (!email) return setError("Enter your email address first.");
    setLoading(true); setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSuccess("Password reset email sent — check your inbox.");
  };

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet"/>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #faf4eb; font-family: 'DM Sans', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
      `}</style>

      <div style={{
        minHeight: "100vh", background: "#faf4eb",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: 24,
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 40 }}
        >
          <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
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
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#3d1f0a" }}>Nexior</span>
        </div>

        {/* Card */}
        <div style={{
          background: "#fff", borderRadius: 16, padding: "40px 40px",
          width: "100%", maxWidth: 420,
          boxShadow: "0 8px 40px rgba(139,69,19,0.12)",
          border: "1px solid #e8d9c4",
        }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 26,
            color: "#3d1f0a", marginBottom: 6, textAlign: "center"
          }}>
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
          </h1>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 14,
            color: "#7a5035", textAlign: "center", marginBottom: 28
          }}>
            {mode === "login" ? "Sign in to access your saved patterns" :
             mode === "signup" ? "Save and manage your scroll saw patterns" :
             "We'll send you a reset link"}
          </p>

          {/* Google button */}
          {mode !== "reset" && (
            <>
              <button
                onClick={handleGoogle}
                disabled={loading}
                style={{
                  width: "100%", padding: "12px",
                  background: "#fff", border: "1.5px solid #e0cdb8",
                  borderRadius: 8, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#3d1f0a",
                  transition: "border-color 0.15s", marginBottom: 16,
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#8B4513"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#e0cdb8"}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continue with Google
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: "#e8d9c4" }}/>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#b8956a", letterSpacing: 1 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: "#e8d9c4" }}/>
              </div>
            </>
          )}

          {/* Email */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#5a3a1a", letterSpacing: 1, display: "block", marginBottom: 6 }}>
              EMAIL
            </label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleEmailAuth()}
              placeholder="you@example.com"
              style={{
                width: "100%", padding: "11px 14px",
                border: "1.5px solid #e0cdb8", borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: "#3d1f0a", background: "#faf5ef", outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = "#8B4513"}
              onBlur={e => e.target.style.borderColor = "#e0cdb8"}
            />
          </div>

          {/* Password */}
          {mode !== "reset" && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#5a3a1a", letterSpacing: 1, display: "block", marginBottom: 6 }}>
                PASSWORD
              </label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleEmailAuth()}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "11px 14px",
                  border: "1.5px solid #e0cdb8", borderRadius: 8,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                  color: "#3d1f0a", background: "#faf5ef", outline: "none",
                }}
                onFocus={e => e.target.style.borderColor = "#8B4513"}
                onBlur={e => e.target.style.borderColor = "#e0cdb8"}
              />
            </div>
          )}

          {/* Error / success */}
          {error && (
            <div style={{ background: "#fff0f0", border: "1px solid #ffaaaa", borderRadius: 6, padding: "10px 14px", marginBottom: 14 }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#c0392b" }}>⚠ {error}</p>
            </div>
          )}
          {success && (
            <div style={{ background: "#f0fff0", border: "1px solid #aaffaa", borderRadius: 6, padding: "10px 14px", marginBottom: 14 }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#2d7a2d" }}>✓ {success}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={mode === "reset" ? handleReset : handleEmailAuth}
            disabled={loading}
            style={{
              width: "100%", padding: "13px",
              background: loading ? "#d4b896" : "#8B4513",
              border: "none", borderRadius: 8,
              fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2,
              color: "#fff", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background 0.2s",
            }}
          >
            {loading && <div className="spinner"/>}
            {mode === "login" ? "SIGN IN" : mode === "signup" ? "CREATE ACCOUNT" : "SEND RESET LINK"}
          </button>

          {/* Footer links */}
          <div style={{ marginTop: 20, textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
            {mode === "login" && (
              <>
                <button onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#8B4513" }}>
                  Don't have an account? <strong>Sign up</strong>
                </button>
                <button onClick={() => { setMode("reset"); setError(null); setSuccess(null); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#b8956a" }}>
                  Forgot password?
                </button>
              </>
            )}
            {mode === "signup" && (
              <button onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#8B4513" }}>
                Already have an account? <strong>Sign in</strong>
              </button>
            )}
            {mode === "reset" && (
              <button onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#8B4513" }}>
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#b8956a", marginTop: 20, letterSpacing: 1 }}>
          BY SIGNING UP YOU AGREE TO OUR TERMS & PRIVACY POLICY
        </p>
      </div>
    </>
  );
}

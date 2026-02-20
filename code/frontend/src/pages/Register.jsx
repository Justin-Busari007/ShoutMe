import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getApiBase } from "../lib/api";

const MOCK_PINS = [
  { lat: 53.384, lng: -6.594, title: "Rooftop Jazz Night", cat: "Music", color: "#f97316" },
  { lat: 53.378, lng: -6.601, title: "Street Food Festival", cat: "Food", color: "#22c55e" },
  { lat: 53.390, lng: -6.585, title: "Open Mic Comedy", cat: "Comedy", color: "#a855f7" },
  { lat: 53.375, lng: -6.580, title: "Sunrise Yoga", cat: "Fitness", color: "#06b6d4" },
  { lat: 53.383, lng: -6.612, title: "Tech Startup Meetup", cat: "Biz", color: "#f59e0b" },
  { lat: 53.372, lng: -6.595, title: "Vinyl Record Fair", cat: "Music", color: "#f97316" },
  { lat: 53.392, lng: -6.570, title: "Outdoor Cinema", cat: "Film", color: "#ec4899" },
  { lat: 53.368, lng: -6.608, title: "Life Drawing Class", cat: "Art", color: "#8b5cf6" },
  { lat: 53.397, lng: -6.600, title: "Dawn Trail Run", cat: "Fitness", color: "#06b6d4" },
  { lat: 53.362, lng: -6.575, title: "Craft Beer Tasting", cat: "Food", color: "#22c55e" },
];

const checks = [
  { key: "len",     label: "At least 8 characters",     test: (v) => v.length >= 8 },
  { key: "upper",   label: "One uppercase letter",       test: (v) => /[A-Z]/.test(v) },
  { key: "lower",   label: "One lowercase letter",       test: (v) => /[a-z]/.test(v) },
  { key: "num",     label: "One number",                 test: (v) => /[0-9]/.test(v) },
  { key: "special", label: "One special character",      test: (v) => /[!@#$%^&*(),.?":{}|<>_\-]/.test(v) },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", password2: "" });
  const [message, setMessage] = useState(null); // { type: "success"|"error", text }
  const [loading, setLoading] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [visible, setVisible] = useState({ password: false, password2: false });

  const pwResults = checks.map((c) => ({ ...c, ok: c.test(form.password) }));
  const pwScore   = pwResults.filter((c) => c.ok).length;
  const pwsMatch  = form.password.length > 0 && form.password === form.password2;
  const allPassed = pwScore === 5 && pwsMatch;

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const API_URL = getApiBase();
      const res = await axios.post(`${API_URL}/auth/register/`, form, {
        headers: { "Content-Type": "application/json" },
      });
      const { access, refresh } = res.data?.tokens ?? {};
      if (access && refresh) {
        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setMessage({ type: "success", text: "Account created! Taking you to the map…" });
        setTimeout(() => navigate("/"), 1400);
      } else {
        setMessage({ type: "success", text: "Registered! Please sign in." });
      }
    } catch (err) {
      const data = err.response?.data;
      let errorMsg = "Something went wrong. Please try again.";
      
      if (data) {
        // Convert technical errors to user-friendly messages
        const errors = [];
        
        if (data.username) {
          const msg = Array.isArray(data.username) ? data.username[0] : data.username;
          if (msg.includes("already")) {
            errors.push("This username is already taken");
          } else {
            errors.push("Username: " + msg);
          }
        }
        
        if (data.email) {
          const msg = Array.isArray(data.email) ? data.email[0] : data.email;
          if (msg.includes("already")) {
            errors.push("This email is already registered");
          } else if (msg.includes("valid")) {
            errors.push("Please enter a valid email address");
          } else {
            errors.push("Email: " + msg);
          }
        }
        
        if (data.password) {
          const msg = Array.isArray(data.password) ? data.password[0] : data.password;
          errors.push("Password: " + msg);
        }
        
        if (data.password2) {
          const msg = Array.isArray(data.password2) ? data.password2[0] : data.password2;
          if (msg.includes("match")) {
            errors.push("Passwords don't match");
          } else {
            errors.push(msg);
          }
        }
        
        if (data.error) {
          errors.push(data.error);
        }
        
        if (errors.length > 0) {
          errorMsg = errors.join(". ");
        }
      }
      
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = pwScore <= 1 ? "#ef4444" : pwScore <= 3 ? "#f59e0b" : "#22c55e";
  const strengthLabel = pwScore <= 1 ? "Weak" : pwScore <= 3 ? "Fair" : pwScore === 4 ? "Good" : "Strong";

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        @keyframes pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 12px #f97316; } 50% { opacity: 0.4; box-shadow: 0 0 4px #f97316; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: #f97316 !important; outline: none; box-shadow: 0 0 0 3px rgba(249,115,22,0.15) !important; }
        button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(249,115,22,0.5) !important; }
        button:disabled { opacity: 0.45; cursor: not-allowed; }
      `}</style>

      {/* Full‑bleed map background */}
      <div style={S.mapWrap}>
        <MapContainer
          center={[53.3811, -6.5923]}
          zoom={12}
          zoomControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          keyboard={false}
          attributionControl={false}
          style={{ height: "100vh", width: "100vw" }}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" subdomains="abcd" />
          {MOCK_PINS.map((p, i) => (
            <CircleMarker key={i} center={[p.lat, p.lng]} radius={8} pathOptions={{ color: p.color, fillColor: p.color, fillOpacity: 0.85, weight: 2 }}>
              <Popup>{p.title}</Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        <div style={S.mapOverlay} />
      </div>

      {/* Card */}
      <div style={S.card}>
        {/* Logo with back link */}
        <Link to="/" style={{ textDecoration: "none", display: "block", marginBottom: 8 }}>
          <div style={S.logo}>
            <div style={S.logoDot} />
            <span style={S.logoWord}>Shout<span style={{ color: "#f97316" }}>Me</span></span>
          </div>
        </Link>
        <p style={S.sub}>Discover events happening near you</p>

        <form onSubmit={handleSubmit} style={S.form}>
          <Field label="Username">
            <input name="username" value={form.username} onChange={handle} placeholder="Choose a username" required style={S.input} />
          </Field>

          <Field label="Email">
            <input name="email" type="email" value={form.email} onChange={handle} placeholder="you@example.com" required style={S.input} />
          </Field>

          <Field label="Password">
            <div style={{ position: "relative" }}>
              <input
                name="password" type={visible.password ? "text" : "password"}
                value={form.password} onChange={handle}
                onFocus={() => setPwFocused(true)}
                placeholder="Create a strong password"
                required style={{ ...S.input, paddingRight: 44 }}
              />
              <EyeBtn show={visible.password} toggle={() => setVisible(p => ({ ...p, password: !p.password }))} />
            </div>

            {/* Strength bar */}
            {form.password.length > 0 && (
              <div style={S.strengthRow}>
                <div style={S.strengthTrack}>
                  <div style={{ ...S.strengthFill, width: `${(pwScore / 5) * 100}%`, background: strengthColor }} />
                </div>
                <span style={{ ...S.strengthLabel, color: strengthColor }}>{strengthLabel}</span>
              </div>
            )}

            {/* Checklist */}
            {(pwFocused || form.password.length > 0) && (
              <div style={S.checklist}>
                {pwResults.map((c) => (
                  <div key={c.key} style={{ ...S.checkItem, color: c.ok ? "#22c55e" : "#64748b" }}>
                    <span style={{ ...S.checkDot, background: c.ok ? "#22c55e" : "#334155" }} />
                    {c.label}
                  </div>
                ))}
              </div>
            )}
          </Field>

          <Field label="Confirm Password">
            <div style={{ position: "relative" }}>
              <input
                name="password2" type={visible.password2 ? "text" : "password"}
                value={form.password2} onChange={handle}
                placeholder="Re‑enter your password"
                required style={{ ...S.input, paddingRight: 44,
                  borderColor: form.password2.length > 0 ? (pwsMatch ? "#22c55e" : "#ef4444") : undefined,
                }}
              />
              <EyeBtn show={visible.password2} toggle={() => setVisible(p => ({ ...p, password2: !p.password2 }))} />
            </div>
            {form.password2.length > 0 && (
              <span style={{ fontSize: 12, color: pwsMatch ? "#22c55e" : "#ef4444", marginTop: 4, display: "block" }}>
                {pwsMatch ? "✓ Passwords match" : "✗ Passwords don't match"}
              </span>
            )}
          </Field>

          <button type="submit" disabled={loading || !allPassed} style={{ ...S.btn, opacity: (!allPassed || loading) ? 0.45 : 1, cursor: (!allPassed || loading) ? "not-allowed" : "pointer" }}>
            {loading ? <Spinner /> : "Create Account"}
          </button>
        </form>

        {message && (
          <div style={{ ...S.toast, background: message.type === "success" ? "#052e16" : "#2d0a0a", borderColor: message.type === "success" ? "#166534" : "#7f1d1d", color: message.type === "success" ? "#86efac" : "#fca5a5" }}>
            {message.text}
          </div>
        )}

        <p style={S.switchLink}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#f97316", textDecoration: "none", fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b" }}>{label}</label>
      {children}
    </div>
  );
}

function EyeBtn({ show, toggle }) {
  return (
    <button type="button" onClick={toggle} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0, fontSize: 16, lineHeight: 1 }}>
      {show ? "🙈" : "👁"}
    </button>
  );
}

function Spinner() {
  return <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />;
}

const S = {
  page: { position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0d12", overflow: "hidden", padding: "20px" },
  mapWrap: { position: "fixed", inset: 0, zIndex: 0 },
  mapOverlay: { position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(10,13,18,0.88) 0%, rgba(10,13,18,0.65) 100%)" },
  card: { position: "relative", zIndex: 10, background: "rgba(15,18,25,0.92)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 420, boxShadow: "0 32px 80px rgba(0,0,0,0.6)" },
  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4, cursor: "pointer" },
  logoDot: { width: 10, height: 10, borderRadius: "50%", background: "#f97316", boxShadow: "0 0 12px #f97316", animation: "pulse 2s infinite" },
  logoWord: { fontFamily: "'Bebas Neue', 'Arial Black', sans-serif", fontSize: 28, color: "#fff", letterSpacing: "0.06em" },
  sub: { color: "#475569", fontSize: 13, marginBottom: 28, marginTop: 0 },
  form: { display: "flex", flexDirection: "column", gap: 18 },
  input: { width: "100%", background: "#0d1117", border: "1.5px solid #1e2535", borderRadius: 10, padding: "11px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.2s", paddingRight: 44 },
  strengthRow: { display: "flex", alignItems: "center", gap: 10, marginTop: 6 },
  strengthTrack: { flex: 1, height: 3, background: "#1e2535", borderRadius: 2, overflow: "hidden" },
  strengthFill: { height: "100%", borderRadius: 2, transition: "width 0.3s, background 0.3s" },
  strengthLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", minWidth: 44, textAlign: "right" },
  checklist: { marginTop: 10, background: "#0d1117", border: "1px solid #1e2535", borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 },
  checkItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, transition: "color 0.2s" },
  checkDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0, transition: "background 0.2s" },
  btn: { marginTop: 4, padding: "14px", background: "#f97316", color: "#fff", border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 15, fontWeight: 700, letterSpacing: "0.04em", transition: "opacity 0.2s, transform 0.1s", boxShadow: "0 4px 20px rgba(249,115,22,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  toast: { marginTop: 16, padding: "12px 14px", borderRadius: 10, border: "1px solid", fontSize: 13, lineHeight: 1.5 },
  switchLink: { textAlign: "center", marginTop: 20, color: "#475569", fontSize: 13, marginBottom: 0 },
};
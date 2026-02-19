import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MOCK_PINS = [
  { lat: 53.384, lng: -6.594, title: "Rooftop Jazz Night", cat: "Music", color: "#f97316" },
  { lat: 53.378, lng: -6.601, title: "Street Food Festival", cat: "Food", color: "#22c55e" },
  { lat: 53.390, lng: -6.585, title: "Open Mic Comedy", cat: "Comedy", color: "#a855f7" },
  { lat: 53.375, lng: -6.580, title: "Sunrise Yoga", cat: "Fitness", color: "#06b6d4" },
  { lat: 53.383, lng: -6.612, title: "Tech Startup Meetup", cat: "Biz", color: "#f59e0b" },
];

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
      const res = await axios.post(`${API_URL}/auth/login/`, form, {
        headers: { "Content-Type": "application/json" },
      });
      const { access, refresh } = res.data?.tokens ?? {};
      if (access && refresh) {
        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setMessage({ type: "success", text: "Signed in! Taking you to the map…" });
        setTimeout(() => navigate("/"), 1400);
      } else {
        setMessage({ type: "success", text: "Signed in!" });
        setTimeout(() => navigate("/"), 1400);
      }
    } catch (err) {
      const data = err.response?.data;
      let errorMsg = "Unable to sign in. Please check your credentials.";
      
      if (data) {
        if (data.error) {
          const msg = data.error;
          if (msg.includes("Invalid") || msg.includes("password")) {
            errorMsg = "Incorrect username or password";
          } else if (msg.includes("provide")) {
            errorMsg = "Please enter both username and password";
          } else {
            errorMsg = msg;
          }
        } else if (data.detail) {
          errorMsg = data.detail;
        }
      }
      
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

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

      {/* Map background */}
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
        <p style={S.sub}>Welcome back! Sign in to continue</p>

        <form onSubmit={handleSubmit} style={S.form}>
          <Field label="Username">
            <input name="username" value={form.username} onChange={handle} placeholder="Your username" required style={S.input} />
          </Field>

          <Field label="Password">
            <input name="password" type="password" value={form.password} onChange={handle} placeholder="Your password" required style={S.input} />
          </Field>

          <button type="submit" disabled={loading} style={{ ...S.btn, opacity: loading ? 0.45 : 1 }}>
            {loading ? <Spinner /> : "Sign In"}
          </button>
        </form>

        {message && (
          <div style={{ ...S.toast, background: message.type === "success" ? "#052e16" : "#2d0a0a", borderColor: message.type === "success" ? "#166534" : "#7f1d1d", color: message.type === "success" ? "#86efac" : "#fca5a5" }}>
            {message.text}
          </div>
        )}

        <p style={S.switchLink}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#f97316", textDecoration: "none", fontWeight: 600 }}>Create one</Link>
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
  input: { width: "100%", background: "#0d1117", border: "1.5px solid #1e2535", borderRadius: 10, padding: "11px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.2s" },
  btn: { marginTop: 4, padding: "14px", background: "#f97316", color: "#fff", border: "none", borderRadius: 12, fontFamily: "inherit", fontSize: 15, fontWeight: 700, letterSpacing: "0.04em", transition: "opacity 0.2s, transform 0.1s", boxShadow: "0 4px 20px rgba(249,115,22,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  toast: { marginTop: 16, padding: "12px 14px", borderRadius: 10, border: "1px solid", fontSize: 13, lineHeight: 1.5 },
  switchLink: { textAlign: "center", marginTop: 20, color: "#475569", fontSize: 13, marginBottom: 0 },
};
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  MapContainer, TileLayer, Marker, Popup,
  CircleMarker, useMapEvents, useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Fix default icon paths in Vite ──────────────────────────────────────────
import markerIcon2x  from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon    from "leaflet/dist/images/marker-icon.png";
import markerShadow  from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const API = "http://127.0.0.1:8000/api";
const DEFAULT_CENTER = [53.3811, -6.5923];

// ─── Category config ──────────────────────────────────────────────────────────
const CATS = {
  Music:   { color: "#f97316", emoji: "🎵" },
  Food:    { color: "#22c55e", emoji: "🍔" },
  Comedy:  { color: "#a855f7", emoji: "🎤" },
  Fitness: { color: "#06b6d4", emoji: "🏃" },
  Biz:     { color: "#f59e0b", emoji: "💼" },
  Film:    { color: "#ec4899", emoji: "🎬" },
  Art:     { color: "#8b5cf6", emoji: "🎨" },
  Other:   { color: "#64748b", emoji: "📍" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function catColor(cat) { return (CATS[cat] ?? CATS.Other).color; }
function catEmoji(cat) { return (CATS[cat] ?? CATS.Other).emoji; }

function makeCustomIcon(color, pulse = false) {
  const size = pulse ? 46 : 38;
  const html = `
    <div style="position:relative;width:${size}px;height:${size + 8}px">
      ${pulse ? `<div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid ${color};animation:pulseRing 1.8s ease-out infinite;opacity:0.7;top:2px;left:2px;right:2px;bottom:18px"></div>` : ""}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 52" width="${size}" height="${size + 10}" style="position:relative;z-index:2;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.5))">
        <path d="M20 0C9 0 0 9 0 20c0 13.3 17 30.7 18.8 32.6a1.7 1.7 0 002.4 0C23 50.7 40 33.3 40 20 40 9 31 0 20 0z" fill="${color}" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
        <circle cx="20" cy="20" r="8" fill="rgba(255,255,255,0.92)"/>
      </svg>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [size, size + 10], iconAnchor: [size / 2, size + 10], popupAnchor: [0, -(size + 12)] });
}

function makeDraftIcon() {
  const html = `
    <div style="position:relative;width:38px;height:48px">
      <div style="position:absolute;inset:-6px;border-radius:50%;border:2px dashed #fff;animation:pulseRing 1.2s ease-out infinite;top:2px;left:2px;right:2px;bottom:16px;opacity:0.6"></div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 52" width="38" height="48" style="filter:drop-shadow(0 4px 12px rgba(0,0,0,0.6))">
        <path d="M20 0C9 0 0 9 0 20c0 13.3 17 30.7 18.8 32.6a1.7 1.7 0 002.4 0C23 50.7 40 33.3 40 20 40 9 31 0 20 0z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-dasharray="4 3"/>
        <text x="20" y="25" text-anchor="middle" font-size="14" fill="white">+</text>
      </svg>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [38, 48], iconAnchor: [19, 48], popupAnchor: [0, -50] });
}

// ─── Map interaction components ───────────────────────────────────────────────
function MapClickHandler({ onPick, enabled }) {
  useMapEvents({
    click(e) { if (enabled) onPick({ lat: e.latlng.lat, lng: e.latlng.lng }); },
  });
  return null;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 15, { animate: true, duration: 1.2 });
  }, [target, map]);
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function EventCard({ ev, onFocus }) {
  const color = catColor(ev.category ?? "Other");
  return (
    <div onClick={() => onFocus(ev)} style={{ ...CS.chip, "--accent": color }} className="event-chip">
      <div style={{ ...CS.chipDot, background: color, boxShadow: `0 0 10px ${color}88` }} />
      <div style={CS.chipInfo}>
        <div style={CS.chipName}>{ev.title}</div>
        <div style={CS.chipMeta}>{catEmoji(ev.category ?? "Other")} {ev.category ?? "Event"} · {ev.location_name ?? "See map"}</div>
      </div>
      <div style={{ ...CS.chipBadge, color }}>→</div>
    </div>
  );
}

function CreatePanel({ picked, onSubmit, loading, error, onClear }) {
  const [form, setForm] = useState({
    title: "", description: "", start_time: "", end_time: "",
    location_name: "", address: "", capacity: 50, is_public: true, category: "Other",
  });
  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };
  const submit = (e) => { e.preventDefault(); onSubmit(form, () => setForm({ title: "", description: "", start_time: "", end_time: "", location_name: "", address: "", capacity: 50, is_public: true, category: "Other" })); };

  return (
    <form onSubmit={submit} style={CS.createForm}>
      <div style={CS.createHeader}>
        <span style={CS.createTitle}>New Event</span>
        {picked && <button type="button" onClick={onClear} style={CS.clearBtn}>✕ Clear pin</button>}
      </div>

      <div style={{ ...CS.pickHint, background: picked ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)", borderColor: picked ? "#166534" : "#1e2535" }}>
        <span style={{ fontSize: 16 }}>{picked ? "📍" : "🗺"}</span>
        <span style={{ color: picked ? "#86efac" : "#475569", fontSize: 12 }}>
          {picked ? `${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)}` : "Click the map to drop a pin"}
        </span>
      </div>

      {[
        { name: "title",         label: "Title",         placeholder: "Give it a name…",           type: "text" },
        { name: "location_name", label: "Location Name", placeholder: "e.g. Maynooth Town Hall",   type: "text" },
        { name: "address",       label: "Address",       placeholder: "Full street address",        type: "text" },
      ].map((f) => (
        <div key={f.name} style={CS.field}>
          <label style={CS.fieldLabel}>{f.label}</label>
          <input name={f.name} value={form[f.name]} onChange={handle} placeholder={f.placeholder} type={f.type} style={CS.fieldInput} required={f.name === "title"} />
        </div>
      ))}

      <div style={CS.field}>
        <label style={CS.fieldLabel}>Category</label>
        <select name="category" value={form.category} onChange={handle} style={{ ...CS.fieldInput, paddingRight: 32 }}>
          {Object.keys(CATS).map((c) => <option key={c} value={c}>{catEmoji(c)} {c}</option>)}
        </select>
      </div>

      <div style={CS.field}>
        <label style={CS.fieldLabel}>Description</label>
        <textarea name="description" value={form.description} onChange={handle} placeholder="Tell people what to expect…" rows={3} style={{ ...CS.fieldInput, resize: "vertical", minHeight: 72 }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={CS.field}>
          <label style={CS.fieldLabel}>Start (ISO)</label>
          <input name="start_time" value={form.start_time} onChange={handle} placeholder="2026-03-01T18:00:00Z" style={CS.fieldInput} />
        </div>
        <div style={CS.field}>
          <label style={CS.fieldLabel}>End (ISO)</label>
          <input name="end_time" value={form.end_time} onChange={handle} placeholder="2026-03-01T21:00:00Z" style={CS.fieldInput} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "end" }}>
        <div style={CS.field}>
          <label style={CS.fieldLabel}>Capacity</label>
          <input name="capacity" type="number" min="1" value={form.capacity} onChange={handle} style={CS.fieldInput} />
        </div>
        <div style={{ ...CS.field, flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 2 }}>
          <input name="is_public" type="checkbox" checked={form.is_public} onChange={handle} style={{ width: 16, height: 16, accentColor: "#f97316" }} />
          <label style={{ ...CS.fieldLabel, textTransform: "none", letterSpacing: 0, color: "#94a3b8", marginBottom: 0 }}>Public</label>
        </div>
      </div>

      {error && <div style={CS.errBox}>{error}</div>}

      <button type="submit" disabled={loading || !picked} style={{ ...CS.submitBtn, opacity: (!picked || loading) ? 0.4 : 1, cursor: (!picked || loading) ? "not-allowed" : "pointer" }}>
        {loading ? "Creating…" : "🎉 Create Event"}
      </button>
    </form>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [events,       setEvents]    = useState([]);
  const [status,       setStatus]    = useState("loading");
  const [apiError,     setApiError]  = useState("");
  const [picked,       setPicked]    = useState(null);
  const [flyTarget,    setFlyTarget] = useState(null);
  const [createMode,   setCreateMode] = useState(false);
  const [createLoading,setCreateLoading] = useState(false);
  const [createError,  setCreateError] = useState("");
  const [panel,        setPanel]     = useState("events"); // "events" | "create"
  const [focusedEvent, setFocusedEvent] = useState(null);
  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem("user") ?? "null"); } catch { return null; } }, []);

  // ── Fetch events ──
  const fetchEvents = useCallback(async () => {
    try {
      setStatus("loading");
      const res = await fetch(`${API}/events/`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : data.results ?? []);
      setStatus("ok");
    } catch (e) {
      setStatus("error");
      setApiError(e.message);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ── Create event ──
  const handleCreate = async (form, resetForm) => {
    if (!picked) return;
    const access = localStorage.getItem("access");
    if (!access) { setCreateError("You must be signed in to create an event."); return; }
    setCreateLoading(true);
    setCreateError("");
    try {
      const res = await fetch(`${API}/events/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` },
        body: JSON.stringify({ ...form, lat: picked.lat, lng: picked.lng, capacity: Number(form.capacity) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(Object.entries(body).map(([k, v]) => `${k}: ${[].concat(v).join(", ")}`).join(" · ") || `Error ${res.status}`);
      }
      setPicked(null);
      setCreateMode(false);
      setPanel("events");
      resetForm();
      await fetchEvents();
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const focusEvent = (ev) => {
    setFocusedEvent(ev);
    if (typeof ev.lat === "number" && typeof ev.lng === "number") {
      setFlyTarget([ev.lat, ev.lng]);
    }
  };

  // ── Derived ──
  const mappableEvents = events.filter((e) => typeof e.lat === "number" && typeof e.lng === "number");

  return (
    <div style={CS.page}>
      {/* Global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; }
        body { margin:0; font-family:'DM Sans',sans-serif; }
        @keyframes pulseRing { 0%{transform:scale(0.7);opacity:1} 100%{transform:scale(2);opacity:0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .event-chip:hover { background: rgba(255,255,255,0.06) !important; transform: translateX(3px); }
        .event-chip { transition: background 0.15s, transform 0.15s; }
        input:focus, select:focus, textarea:focus { border-color: #f97316 !important; outline: none; box-shadow: 0 0 0 3px rgba(249,115,22,0.15); }
        .leaflet-control-attribution { background: rgba(10,13,18,0.75)!important; color:#475569!important; font-size:10px!important; }
        .leaflet-control-attribution a { color:#64748b!important; }
        .leaflet-control-zoom a { background:#0f1219!important; color:#94a3b8!important; border-color:#1e2535!important; }
        .leaflet-control-zoom a:hover { background:#f97316!important; color:#fff!important; }
        .leaflet-popup-content-wrapper { background:#0f1219!important; border:1px solid #1e2535!important; border-radius:14px!important; box-shadow:0 20px 60px rgba(0,0,0,0.6)!important; color:#e2e8f0!important; }
        .leaflet-popup-tip { background:#0f1219!important; }
        .leaflet-popup-close-button { color:#475569!important; font-size:18px!important; top:10px!important; right:10px!important; }
        ::-webkit-scrollbar { width:5px } ::-webkit-scrollbar-track { background:transparent } ::-webkit-scrollbar-thumb { background:#1e2535; border-radius:3px }
      `}</style>

      {/* ── LEFT: Panel (col 1) ── */}
      <div style={CS.panel}>
        <div style={CS.panelHeader}>
          <div style={CS.logoRow}>
            <div style={CS.logoDot} />
            <span style={CS.logoWord}>Shout<span style={{ color: "#f97316" }}>Me</span></span>
            {user && <span style={CS.userBadge}>👤 {user.username}</span>}
          </div>
          <p style={CS.tagline}>Discover what's happening near you</p>
          <div style={CS.tabRow}>
            <button onClick={() => { setPanel("events"); setCreateMode(false); setPicked(null); }} style={{ ...CS.tab, ...(panel === "events" ? CS.tabActive : {}) }}>Events</button>
            <button onClick={() => { setPanel("create"); setCreateMode(true); }} style={{ ...CS.tab, ...(panel === "create" ? CS.tabActive : {}) }}>+ Add Event</button>
          </div>
        </div>
        <div style={CS.panelBody}>
          {panel === "events" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {status === "loading" && (
                <div style={CS.statusMsg}>
                  <div style={{ width: 20, height: 20, border: "2px solid #1e2535", borderTop: "2px solid #f97316", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 10px" }} />
                  Loading events…
                </div>
              )}
              {status === "error" && (
                <div style={CS.errorBox}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠ Could not load events</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{apiError}</div>
                  <button onClick={fetchEvents} style={{ marginTop: 10, background: "#f97316", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Retry</button>
                </div>
              )}
              {status === "ok" && events.length === 0 && (
                <div style={CS.statusMsg}>No events yet. Be the first to add one!</div>
              )}
              {status === "ok" && events.map((ev) => (
                <EventCard key={ev.id} ev={ev} onFocus={focusEvent} />
              ))}
            </div>
          )}
          {panel === "create" && (
            <CreatePanel picked={picked} onSubmit={handleCreate} loading={createLoading} error={createError} onClear={() => setPicked(null)} />
          )}
        </div>
      </div>

      {/* ── RIGHT: Map (col 2) ── */}
      <div style={CS.mapArea}>
        <MapContainer center={DEFAULT_CENTER} zoom={13} zoomControl style={{ height: "100vh", width: "100%", position: "absolute", inset: 0 }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            attribution='&copy; CARTO'
            maxZoom={19}
          />
          <MapClickHandler onPick={(loc) => { if (createMode) { setPicked(loc); setPanel("create"); } }} enabled={createMode} />
          <FlyTo target={flyTarget} />
          {mappableEvents.map((ev) => {
            const color = catColor(ev.category ?? "Other");
            const isFocused = focusedEvent?.id === ev.id;
            return (
              <Marker key={ev.id} position={[ev.lat, ev.lng]} icon={makeCustomIcon(color, isFocused)}>
                <Popup minWidth={200}>
                  <div style={{ padding: "4px 2px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color, marginBottom: 4 }}>{ev.category ?? "Event"}</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: "#fff", marginBottom: 6 }}>{ev.title}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
                      {ev.location_name && <div>📍 {ev.location_name}</div>}
                      {ev.start_time    && <div>🕐 {new Date(ev.start_time).toLocaleString()}</div>}
                      {ev.capacity      && <div>👥 Capacity: {ev.capacity}</div>}
                    </div>
                    {ev.description && <div style={{ marginTop: 8, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{ev.description.slice(0, 120)}{ev.description.length > 120 ? "…" : ""}</div>}
                  </div>
                </Popup>
              </Marker>
            );
          })}
          {picked && (
            <Marker position={[picked.lat, picked.lng]} icon={makeDraftIcon()}>
              <Popup><div style={{ color: "#94a3b8", fontSize: 12 }}>New event<br />{picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}</div></Popup>
            </Marker>
          )}
        </MapContainer>
        {createMode && (
          <div style={CS.mapHint}>
            <span style={{ fontSize: 18 }}>📍</span> Click anywhere on the map to drop your event pin
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CS = {
  page:        { display: "grid", gridTemplateColumns: "380px 1fr", height: "100vh", width: "100vw", background: "#0a0d12", overflow: "hidden" },
  mapArea:     { position: "relative", width: "100%", height: "100vh", minWidth: 0, gridColumn: 2, overflow: "hidden" },
  mapHint:     { position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "rgba(10,13,18,0.88)", backdropFilter: "blur(10px)", border: "1px solid rgba(249,115,22,0.4)", borderRadius: 12, padding: "10px 20px", color: "#fbd38d", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, zIndex: 500, whiteSpace: "nowrap", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" },

  panel:       { display: "flex", flexDirection: "column", background: "#0a0d12", borderRight: "1px solid #1e2535", overflow: "hidden", boxShadow: "4px 0 40px rgba(0,0,0,0.5)", gridColumn: 1, zIndex: 10 },
  panelHeader: { padding: "24px 22px 0", borderBottom: "1px solid #0f1219", flexShrink: 0 },
  panelBody:   { flex: 1, overflowY: "auto", padding: "16px 22px 24px" },

  logoRow:   { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  logoDot:   { width: 9, height: 9, borderRadius: "50%", background: "#f97316", boxShadow: "0 0 10px #f97316aa", animation: "pulseRing 2s ease-out infinite" },
  logoWord:  { fontFamily: "'Bebas Neue', 'Arial Black', sans-serif", fontSize: 26, color: "#fff", letterSpacing: "0.06em" },
  userBadge: { marginLeft: "auto", fontSize: 11, color: "#64748b", background: "#0f1219", border: "1px solid #1e2535", borderRadius: 20, padding: "3px 10px" },
  tagline:   { color: "#334155", fontSize: 12, margin: "0 0 16px" },

  tabRow:   { display: "flex", gap: 2, marginBottom: 0 },
  tab:      { flex: 1, padding: "9px 12px", background: "none", border: "none", borderBottom: "2px solid transparent", color: "#475569", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em", transition: "color 0.2s, border-color 0.2s" },
  tabActive:{ color: "#f97316", borderBottomColor: "#f97316" },

  chip:      { display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid #0f1219", borderRadius: 12, cursor: "pointer" },
  chipDot:   { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  chipInfo:  { flex: 1, minWidth: 0 },
  chipName:  { fontSize: 13, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  chipMeta:  { fontSize: 11, color: "#475569", marginTop: 2 },
  chipBadge: { fontSize: 16, flexShrink: 0, opacity: 0.6 },

  statusMsg:  { padding: "32px 0", textAlign: "center", color: "#334155", fontSize: 13, animation: "fadeIn 0.4s ease" },
  errorBox:   { padding: 16, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, color: "#fca5a5", fontSize: 13, textAlign: "center" },

  // Create form
  createForm:   { display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.3s ease" },
  createHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  createTitle:  { fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "#fff", letterSpacing: "0.05em" },
  clearBtn:     { background: "none", border: "1px solid #1e2535", borderRadius: 8, color: "#64748b", fontSize: 11, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", transition: "color 0.2s" },
  pickHint:     { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1px dashed", borderRadius: 10, transition: "all 0.25s" },
  field:        { display: "flex", flexDirection: "column", gap: 5 },
  fieldLabel:   { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#475569" },
  fieldInput:   { background: "#0d1117", border: "1.5px solid #1e2535", borderRadius: 9, padding: "9px 12px", color: "#e2e8f0", fontSize: 13, fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s, box-shadow 0.2s", width: "100%" },
  errBox:       { padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, color: "#fca5a5", fontSize: 12 },
  submitBtn:    { padding: "13px", background: "#f97316", color: "#fff", border: "none", borderRadius: 11, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, transition: "opacity 0.2s", boxShadow: "0 4px 18px rgba(249,115,22,0.35)", letterSpacing: "0.02em" },
};
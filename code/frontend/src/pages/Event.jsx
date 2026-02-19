import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icon paths
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const API = "http://127.0.0.1:8000/api";

// Category colors
const CATS = {
  Music: { color: "#f97316" },
  Food: { color: "#22c55e" },
  Comedy: { color: "#a855f7" },
  Fitness: { color: "#06b6d4" },
  Biz: { color: "#f59e0b" },
  Film: { color: "#ec4899" },
  Art: { color: "#8b5cf6" },
  Other: { color: "#64748b" },
};

function catColor(cat) { return (CATS[cat] ?? CATS.Other).color; }

export default function Event() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Get current user
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") ?? "null");
    } catch {
      return null;
    }
  })();

  const isHost = user && event && event.host_id === user.id;
  const isJoined = user && event && event.is_joined === true;
  const isFull = event && event.capacity && event.attendee_count >= event.capacity;

  // Fetch event details
  useEffect(() => {
    async function fetchEvent() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/events/${id}/`);
        if (!res.ok) throw new Error(`Event not found`);
        const data = await res.json();
        setEvent(data);
      } catch (e) {
        setError(e.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  // Join Event
  async function handleJoin() {
    if (!user) {
      setActionError("You must be signed in to join events.");
      return;
    }
    if (isHost) {
      setActionError("Hosts cannot join their own events.");
      return;
    }
    if (isJoined) {
      setActionError("You have already joined this event.");
      return;
    }
    if (isFull) {
      setActionError("This event is at full capacity.");
      return;
    }

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const access = localStorage.getItem("access");
      const res = await fetch(`${API}/events/${id}/join/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${access}` },
      });

      if (!res.ok) throw new Error("Failed to join event");
      
      setActionSuccess("Successfully joined the event!");
      // Refresh event data
      const eventRes = await fetch(`${API}/events/${id}/`);
      const data = await eventRes.json();
      setEvent(data);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Leave Event
  async function handleLeave() {
    if (!user) {
      setActionError("You must be signed in.");
      return;
    }

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const access = localStorage.getItem("access");
      const res = await fetch(`${API}/events/${id}/leave/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${access}` },
      });

      if (!res.ok) throw new Error("Failed to leave event");
      
      setActionSuccess("You have left the event.");
      // Refresh event data
      const eventRes = await fetch(`${API}/events/${id}/`);
      const data = await eventRes.json();
      setEvent(data);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={S.page}>
        <div style={S.loader}>
          <div style={S.spinner} />
          <p style={{ marginTop: 16, color: "#64748b" }}>Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={S.page}>
        <div style={S.errorBox}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>!</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#fff" }}>Event Not Found</div>
          <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 20 }}>{error}</div>
          <Link to="/" style={S.backBtn}>Back to Events</Link>
        </div>
      </div>
    );
  }

  const color = catColor(event.category_name ?? "Other");
  const hasLocation = typeof event.lat === "number" && typeof event.lng === "number";

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; }
        body { margin:0; font-family:'DM Sans',sans-serif; background:#0a0d12; }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      {/* Header */}
      <div style={S.header}>
        <Link to="/" style={S.backLink}>← Back</Link>
        <div style={S.logo}>
          <div style={S.logoDot} />
          <span style={S.logoWord}>Shout<span style={{ color: "#f97316" }}>Me</span></span>
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* Content */}
      <div style={S.content}>
        {/* Left: Event Details */}
        <div style={S.detailsPanel}>
          {/* Category Badge */}
          <div style={{ ...S.categoryBadge, background: color }}>
            {event.category_name || "Event"}
          </div>

          {/* Title */}
          <h1 style={S.title}>{event.title}</h1>

          {/* Host & Attendees */}
          <div style={S.metaRow}>
            <div style={S.metaItem}>
              <span style={S.metaLabel}>Hosted by</span>
              <span style={S.metaValue}>{event.host_name || "Unknown"}</span>
            </div>
            <div style={S.metaItem}>
              <span style={S.metaLabel}>Attendees</span>
              <span style={S.metaValue}>
                {event.attendee_count || 0}
                {event.capacity && ` / ${event.capacity}`}
              </span>
            </div>
          </div>

          {/* Capacity Warning */}
          {isFull && (
            <div style={S.warningBox}>
              This event is at full capacity ({event.capacity} attendees)
            </div>
          )}

          {/* Action Buttons */}
          {!isHost && user && (
            <div style={{ marginTop: 20 }}>
              {!isJoined ? (
                <button
                  onClick={handleJoin}
                  disabled={actionLoading || isFull}
                  style={{
                    ...S.primaryBtn,
                    opacity: actionLoading || isFull ? 0.5 : 1,
                    cursor: actionLoading || isFull ? "not-allowed" : "pointer"
                  }}
                >
                  {actionLoading ? "Joining..." : isFull ? "Event Full" : "Join Event"}
                </button>
              ) : (
                <button
                  onClick={handleLeave}
                  disabled={actionLoading}
                  style={{
                    ...S.secondaryBtn,
                    opacity: actionLoading ? 0.5 : 1
                  }}
                >
                  {actionLoading ? "Leaving..." : "Leave Event"}
                </button>
              )}
            </div>
          )}

          {!user && (
            <div style={S.infoBox}>
              <Link to="/login" style={{ color: "#f97316", textDecoration: "none" }}>Sign in</Link> to join this event
            </div>
          )}

          {/* Messages */}
          {actionSuccess && <div style={S.successBox}>{actionSuccess}</div>}
          {actionError && <div style={S.errorMsg}>{actionError}</div>}

          {/* Event Details */}
          <div style={S.detailsSection}>
            <h3 style={S.sectionTitle}>Event Details</h3>

            {event.start_time && (
              <div style={S.detailRow}>
                <span style={S.detailLabel}>Start Time</span>
                <span style={S.detailValue}>{new Date(event.start_time).toLocaleString()}</span>
              </div>
            )}

            {event.end_time && (
              <div style={S.detailRow}>
                <span style={S.detailLabel}>End Time</span>
                <span style={S.detailValue}>{new Date(event.end_time).toLocaleString()}</span>
              </div>
            )}

            {event.location_name && (
              <div style={S.detailRow}>
                <span style={S.detailLabel}>Location</span>
                <span style={S.detailValue}>{event.location_name}</span>
              </div>
            )}

            {event.address && (
              <div style={S.detailRow}>
                <span style={S.detailLabel}>Address</span>
                <span style={S.detailValue}>{event.address}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div style={S.descriptionSection}>
              <h3 style={S.sectionTitle}>Description</h3>
              <p style={S.description}>{event.description}</p>
            </div>
          )}
        </div>

        {/* Right: Map */}
        {hasLocation && (
          <div style={S.mapPanel}>
            <MapContainer
              center={[event.lat, event.lng]}
              zoom={15}
              style={{ height: "100%", width: "100%", borderRadius: 16 }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; CARTO'
              />
              <Marker position={[event.lat, event.lng]} />
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#0a0d12", color: "#e2e8f0" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid #1e2535" },
  backLink: { color: "#94a3b8", textDecoration: "none", fontSize: 14, fontWeight: 600, transition: "color 0.2s", ":hover": { color: "#f97316" } },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoDot: { width: 10, height: 10, borderRadius: "50%", background: "#f97316", boxShadow: "0 0 12px #f97316" },
  logoWord: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "#fff", letterSpacing: "0.06em" },
  
  content: { display: "grid", gridTemplateColumns: "1fr 500px", gap: 40, padding: "40px", maxWidth: 1400, margin: "0 auto" },
  detailsPanel: { display: "flex", flexDirection: "column", gap: 20 },
  
  categoryBadge: { display: "inline-block", alignSelf: "flex-start", padding: "6px 16px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff" },
  title: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: "#fff", margin: 0, lineHeight: 1.1 },
  
  metaRow: { display: "flex", gap: 40, padding: "20px 0", borderTop: "1px solid #1e2535", borderBottom: "1px solid #1e2535" },
  metaItem: { display: "flex", flexDirection: "column", gap: 6 },
  metaLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b" },
  metaValue: { fontSize: 16, fontWeight: 600, color: "#e2e8f0" },
  
  warningBox: { padding: 14, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, color: "#fbbf24", fontSize: 14 },
  infoBox: { padding: 14, background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 12, color: "#fb923c", fontSize: 14 },
  successBox: { padding: 14, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 12, color: "#86efac", fontSize: 14 },
  errorMsg: { padding: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, color: "#fca5a5", fontSize: 14 },
  
  primaryBtn: { width: "100%", padding: 16, background: "#f97316", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, transition: "transform 0.1s, opacity 0.2s", fontFamily: "inherit" },
  secondaryBtn: { width: "100%", padding: 16, background: "rgba(255,255,255,0.05)", color: "#e2e8f0", border: "1px solid #1e2535", borderRadius: 12, fontSize: 16, fontWeight: 700, transition: "transform 0.1s, opacity 0.2s", fontFamily: "inherit" },
  
  detailsSection: { display: "flex", flexDirection: "column", gap: 16, padding: "24px 0", borderTop: "1px solid #1e2535" },
  sectionTitle: { fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b", margin: 0 },
  detailRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  detailLabel: { fontSize: 14, color: "#94a3b8" },
  detailValue: { fontSize: 14, fontWeight: 600, color: "#e2e8f0" },
  
  descriptionSection: { display: "flex", flexDirection: "column", gap: 12 },
  description: { fontSize: 15, lineHeight: 1.7, color: "#94a3b8", margin: 0 },
  
  mapPanel: { height: 600, borderRadius: 16, overflow: "hidden", border: "1px solid #1e2535" },
  
  loader: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" },
  spinner: { width: 48, height: 48, border: "4px solid #1e2535", borderTop: "4px solid #f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  
  errorBox: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", textAlign: "center", padding: 40 },
  backBtn: { display: "inline-block", marginTop: 20, padding: "12px 24px", background: "#f97316", color: "#fff", textDecoration: "none", borderRadius: 10, fontWeight: 600, transition: "transform 0.1s" },
};

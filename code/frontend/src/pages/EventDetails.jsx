import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icon paths
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const API = "http://127.0.0.1:8000/api";

// Category config matching Home.jsx
const CATS = {
  Music: { color: "#f97316", emoji: "🎵" },
  Food: { color: "#22c55e", emoji: "🍔" },
  Comedy: { color: "#a855f7", emoji: "🎤" },
  Fitness: { color: "#06b6d4", emoji: "🏃" },
  Biz: { color: "#f59e0b", emoji: "💼" },
  Film: { color: "#ec4899", emoji: "🎬" },
  Art: { color: "#8b5cf6", emoji: "🎨" },
  Other: { color: "#64748b", emoji: "📍" },
};

function catColor(cat) { return (CATS[cat] ?? CATS.Other).color; }
function catEmoji(cat) { return (CATS[cat] ?? CATS.Other).emoji; }

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
        if (!res.ok) throw new Error(`Event not found (${res.status})`);
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

  // REQ-5.1, REQ-5.2, REQ-5.4: Join Event
  async function handleJoin() {
    if (!user) {
      setActionError("You must be signed in to join events.");
      return;
    }
    if (isHost) {
      setActionError("REQ-5.3: Hosts cannot join their own events.");
      return;
    }
    if (isJoined) {
      setActionError("REQ-5.2: You have already joined this event.");
      return;
    }
    if (isFull) {
      setActionError("REQ-5.4: This event is at full capacity.");
      return;
    }

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const access = localStorage.getItem("access");
      const res = await fetch(`${API}/events/${id}/join/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || body.error || `Failed to join (${res.status})`);
      }

      // Refresh event to get updated attendee list
      const updatedRes = await fetch(`${API}/events/${id}/`);
      const updatedData = await updatedRes.json();
      setEvent(updatedData);

      setActionSuccess("REQ-5.6: Successfully joined the event!");
    } catch (e) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  // REQ-5.5: Leave Event
  async function handleLeave() {
    if (!user || !isJoined) return;

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const access = localStorage.getItem("access");
      const res = await fetch(`${API}/events/${id}/leave/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || body.error || `Failed to leave (${res.status})`);
      }

      // Refresh event
      const updatedRes = await fetch(`${API}/events/${id}/`);
      const updatedData = await updatedRes.json();
      setEvent(updatedData);

      setActionSuccess("You have left the event.");
    } catch (e) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  // REQ-4.5, REQ-4.6: Delete Event (Host only, with confirmation)
  async function handleDelete() {
    if (!isHost) return;

    setActionLoading(true);
    setActionError("");

    try {
      const access = localStorage.getItem("access");
      const res = await fetch(`${API}/events/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${access}` },
      });

      if (!res.ok) throw new Error(`Failed to delete (${res.status})`);

      // Navigate back to home
      navigate("/");
    } catch (e) {
      setActionError(e.message);
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={S.page}>
        <div style={S.loader}>
          <div style={S.spinner} />
          <p style={{ marginTop: 16, color: "#64748b" }}>Loading event details…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={S.page}>
        <div style={S.errorBox}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#fff" }}>Event Not Found</div>
          <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 20 }}>{error}</div>
          <Link to="/" style={S.backBtn}>← Back to Events</Link>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const color = catColor(event.category ?? "Other");
  const hasLocation = typeof event.lat === "number" && typeof event.lng === "number";

  return (
    <div style={S.page}>
      {/* Global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; }
        body { margin:0; font-family:'DM Sans',sans-serif; background:#0a0d12; }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .action-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(249,115,22,0.4); }
        .action-btn:disabled { opacity:0.45; cursor:not-allowed; transform:none; }
        input:focus, textarea:focus { border-color: #f97316 !important; outline: none; box-shadow: 0 0 0 3px rgba(249,115,22,0.15); }
      `}</style>

      {/* Header bar */}
      <div style={S.header}>
        <Link to="/" style={S.backLink}>← Back to Events</Link>
        <div style={S.logoRow}>
          <div style={S.logoDot} />
          <span style={S.logoWord}>Shout<span style={{ color: "#f97316" }}>Me</span></span>
        </div>
      </div>

      {/* Main content */}
      <div style={S.container}>
        <div style={S.content}>
          {/* Event header */}
          <div style={S.eventHeader}>
            <div style={{ ...S.categoryBadge, background: `${color}22`, borderColor: color, color }}>
              {catEmoji(event.category ?? "Other")} {event.category ?? "Other"}
            </div>
            <h1 style={S.eventTitle}>{event.title}</h1>

            {/* Host info */}
            <div style={S.metaRow}>
              <div style={S.metaItem}>
                <span style={S.metaIcon}>👤</span>
                <span style={S.metaLabel}>Hosted by</span>
                <span style={S.metaValue}>{event.host_name || "Unknown"}</span>
              </div>
              <div style={S.metaItem}>
                <span style={S.metaIcon}>👥</span>
                <span style={S.metaLabel}>Attendees</span>
                <span style={S.metaValue}>
                  {event.attendee_count || 0}
                  {event.capacity && ` / ${event.capacity}`}
                </span>
              </div>
            </div>
          </div>

          {/* Action messages */}
          {actionSuccess && (
            <div style={{ ...S.toast, background: "#052e16", borderColor: "#166534", color: "#86efac" }}>
              ✓ {actionSuccess}
            </div>
          )}
          {actionError && (
            <div style={{ ...S.toast, background: "#2d0a0a", borderColor: "#7f1d1d", color: "#fca5a5" }}>
              ✗ {actionError}
            </div>
          )}

          {/* Action buttons - REQ-3.4: Role-based actions */}
          <div style={S.actionRow}>
            {!user && (
              <div style={{ ...S.infoBox, borderColor: "#475569" }}>
                <span style={{ fontSize: 16 }}>🔒</span>
                <span style={{ fontSize: 14, color: "#94a3b8" }}>
                  <Link to="/login" style={{ color: "#f97316", textDecoration: "none", fontWeight: 600 }}>Sign in</Link> to join this event
                </span>
              </div>
            )}

            {user && !isHost && !isJoined && (
              <button
                onClick={handleJoin}
                disabled={actionLoading || isFull}
                className="action-btn"
                style={{ ...S.btnPrimary, opacity: (actionLoading || isFull) ? 0.45 : 1 }}
              >
                {actionLoading ? <Spinner /> : isFull ? "🚫 Event Full" : "✓ Join Event"}
              </button>
            )}

            {user && !isHost && isJoined && (
              <button
                onClick={handleLeave}
                disabled={actionLoading}
                className="action-btn"
                style={{ ...S.btnSecondary, opacity: actionLoading ? 0.45 : 1 }}
              >
                {actionLoading ? <Spinner /> : "✗ Leave Event"}
              </button>
            )}

            {isHost && (
              <div style={{ display: "flex", gap: 12, width: "100%" }}>
                <button
                  onClick={() => navigate(`/events/${id}/edit`)}
                  style={{ ...S.btnSecondary, flex: 1 }}
                  className="action-btn"
                >
                  ✎ Edit Event
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  style={{ ...S.btnDanger, flex: 1 }}
                  className="action-btn"
                >
                  🗑 Delete Event
                </button>
              </div>
            )}
          </div>

          {/* REQ-5.4: Capacity warning */}
          {isFull && (
            <div style={{ ...S.infoBox, borderColor: "#f59e0b", background: "rgba(245,158,11,0.08)" }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={{ fontSize: 14, color: "#fbbf24" }}>
                This event is at full capacity ({event.capacity} attendees)
              </span>
            </div>
          )}

          {/* Event details */}
          <div style={S.detailsSection}>
            <h2 style={S.sectionTitle}>Details</h2>
            
            <div style={S.detailGrid}>
              {event.start_time && (
                <div style={S.detailCard}>
                  <div style={S.detailIcon}>📅</div>
                  <div>
                    <div style={S.detailLabel}>Start Time</div>
                    <div style={S.detailValue}>{new Date(event.start_time).toLocaleString()}</div>
                  </div>
                </div>
              )}

              {event.end_time && (
                <div style={S.detailCard}>
                  <div style={S.detailIcon}>🕐</div>
                  <div>
                    <div style={S.detailLabel}>End Time</div>
                    <div style={S.detailValue}>{new Date(event.end_time).toLocaleString()}</div>
                  </div>
                </div>
              )}

              {event.location_name && (
                <div style={S.detailCard}>
                  <div style={S.detailIcon}>📍</div>
                  <div>
                    <div style={S.detailLabel}>Location</div>
                    <div style={S.detailValue}>{event.location_name}</div>
                  </div>
                </div>
              )}

              {event.address && (
                <div style={S.detailCard}>
                  <div style={S.detailIcon}>🏠</div>
                  <div>
                    <div style={S.detailLabel}>Address</div>
                    <div style={S.detailValue}>{event.address}</div>
                  </div>
                </div>
              )}
            </div>

            {event.description && (
              <div style={S.descriptionBox}>
                <h3 style={{ ...S.sectionTitle, fontSize: 16, marginBottom: 12 }}>About This Event</h3>
                <p style={S.description}>{event.description}</p>
              </div>
            )}
          </div>

          {/* REQ-3.3: Embedded map with location pin */}
          {hasLocation && (
            <div style={S.mapSection}>
              <h2 style={S.sectionTitle}>Location on Map</h2>
              <div style={S.mapContainer}>
                <MapContainer
                  center={[event.lat, event.lng]}
                  zoom={15}
                  zoomControl
                  style={{ height: "100%", width: "100%", borderRadius: 12 }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                  />
                  <Marker position={[event.lat, event.lng]}>
                    <Popup>
                      <div style={{ color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif" }}>
                        <strong>{event.title}</strong>
                        <br />
                        {event.location_name}
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          )}

          {/* Attendees list */}
          {event.attendees && event.attendees.length > 0 && (
            <div style={S.attendeesSection}>
              <h2 style={S.sectionTitle}>
                Attendees ({event.attendees.length})
              </h2>
              <div style={S.attendeeGrid}>
                {event.attendees.map((attendee) => (
                  <div key={attendee.id} style={S.attendeeCard}>
                    <div style={S.attendeeAvatar}>
                      {attendee.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div style={S.attendeeName}>{attendee.username || "Unknown"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REQ-4.6: Delete confirmation modal */}
      {showDeleteModal && (
        <div style={S.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalIcon}>⚠️</div>
            <h2 style={S.modalTitle}>Delete Event?</h2>
            <p style={S.modalText}>
              Are you sure you want to delete <strong>"{event.title}"</strong>?
              <br />
              This action cannot be undone.
            </p>
            <div style={S.modalActions}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={S.modalBtnCancel}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  handleDelete();
                }}
                style={S.modalBtnConfirm}
                disabled={actionLoading}
              >
                {actionLoading ? <Spinner /> : "Delete Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 16,
        height: 16,
        border: "2px solid rgba(255,255,255,0.3)",
        borderTop: "2px solid #fff",
        borderRadius: "50%",
        animation: "spin 0.6s linear infinite",
      }}
    />
  );
}

// Styles
const S = {
  page: { minHeight: "100vh", background: "#0a0d12", paddingBottom: 60 },
  
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 32px",
    borderBottom: "1px solid #1e2535",
    background: "#0f1219",
  },
  
  backLink: {
    color: "#94a3b8",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
    transition: "color 0.2s",
    cursor: "pointer",
  },

  logoRow: { display: "flex", alignItems: "center", gap: 10 },
  logoDot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: "#f97316",
    boxShadow: "0 0 10px #f97316aa",
  },
  logoWord: {
    fontFamily: "'Bebas Neue', 'Arial Black', sans-serif",
    fontSize: 22,
    color: "#fff",
    letterSpacing: "0.06em",
  },

  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "40px 24px",
  },

  content: {
    display: "flex",
    flexDirection: "column",
    gap: 32,
    animation: "fadeIn 0.4s ease",
  },

  eventHeader: {
    background: "#0f1219",
    border: "1px solid #1e2535",
    borderRadius: 16,
    padding: 32,
  },

  categoryBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 20,
    border: "1px solid",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.05em",
    marginBottom: 16,
  },

  eventTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 42,
    color: "#fff",
    margin: "0 0 24px 0",
    letterSpacing: "0.04em",
    lineHeight: 1.1,
  },

  metaRow: {
    display: "flex",
    gap: 32,
    flexWrap: "wrap",
  },

  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  metaIcon: { fontSize: 18 },
  metaLabel: { fontSize: 12, color: "#64748b", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" },
  metaValue: { fontSize: 15, color: "#e2e8f0", fontWeight: 600 },

  actionRow: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  btnPrimary: {
    width: "100%",
    padding: 16,
    background: "#f97316",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "transform 0.1s, box-shadow 0.2s, opacity 0.2s",
    boxShadow: "0 4px 20px rgba(249,115,22,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  btnSecondary: {
    width: "100%",
    padding: 16,
    background: "#1e2535",
    color: "#e2e8f0",
    border: "1px solid #334155",
    borderRadius: 12,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "transform 0.1s, background 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  btnDanger: {
    width: "100%",
    padding: 16,
    background: "rgba(239,68,68,0.1)",
    color: "#fca5a5",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 12,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "transform 0.1s, background 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  toast: {
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid",
    fontSize: 14,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  infoBox: {
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(255,255,255,0.02)",
  },

  detailsSection: {
    background: "#0f1219",
    border: "1px solid #1e2535",
    borderRadius: 16,
    padding: 28,
  },

  sectionTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 24,
    color: "#fff",
    margin: "0 0 20px 0",
    letterSpacing: "0.05em",
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },

  detailCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    background: "#0d1117",
    border: "1px solid #1e2535",
    borderRadius: 10,
  },

  detailIcon: { fontSize: 24, flexShrink: 0 },
  detailLabel: { fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 },
  detailValue: { fontSize: 14, color: "#e2e8f0", fontWeight: 500, lineHeight: 1.5 },

  descriptionBox: {
    padding: 20,
    background: "#0d1117",
    border: "1px solid #1e2535",
    borderRadius: 10,
  },

  description: {
    fontSize: 15,
    color: "#94a3b8",
    lineHeight: 1.7,
    margin: 0,
    whiteSpace: "pre-wrap",
  },

  mapSection: {
    background: "#0f1219",
    border: "1px solid #1e2535",
    borderRadius: 16,
    padding: 28,
  },

  mapContainer: {
    height: 360,
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #1e2535",
  },

  attendeesSection: {
    background: "#0f1219",
    border: "1px solid #1e2535",
    borderRadius: 16,
    padding: 28,
  },

  attendeeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 12,
  },

  attendeeCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: 16,
    background: "#0d1117",
    border: "1px solid #1e2535",
    borderRadius: 10,
  },

  attendeeAvatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "#f97316",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 700,
    fontFamily: "'Bebas Neue', sans-serif",
  },

  attendeeName: {
    fontSize: 13,
    color: "#e2e8f0",
    fontWeight: 600,
    textAlign: "center",
  },

  loader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
  },

  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #1e2535",
    borderTop: "3px solid #f97316",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },

  errorBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    textAlign: "center",
    padding: 24,
  },

  backBtn: {
    padding: "12px 24px",
    background: "#f97316",
    color: "#fff",
    textDecoration: "none",
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 14,
    display: "inline-block",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
  },

  modal: {
    background: "#0f1219",
    border: "1px solid #1e2535",
    borderRadius: 20,
    padding: 32,
    maxWidth: 440,
    width: "100%",
    boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
    animation: "fadeIn 0.2s ease",
  },

  modalIcon: {
    fontSize: 56,
    textAlign: "center",
    marginBottom: 16,
  },

  modalTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 28,
    color: "#fff",
    textAlign: "center",
    margin: "0 0 12px 0",
    letterSpacing: "0.04em",
  },

  modalText: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 1.6,
    marginBottom: 28,
  },

  modalActions: {
    display: "flex",
    gap: 12,
  },

  modalBtnCancel: {
    flex: 1,
    padding: 14,
    background: "#1e2535",
    color: "#e2e8f0",
    border: "1px solid #334155",
    borderRadius: 12,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.2s",
  },

  modalBtnConfirm: {
    flex: 1,
    padding: 14,
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
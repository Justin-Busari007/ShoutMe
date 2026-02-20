import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getApiBase } from "../lib/api";

// Fix Leaflet icon paths
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const API = getApiBase();

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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Get current user
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") ?? "null");
    } catch {
      return null;
    }
  })();

  const getAuthHeaders = () => {
    const access = localStorage.getItem("access");
    return access ? { Authorization: `Bearer ${access}` } : {};
  };

  const isHost = user && event && event.host_id === user.id;
  const isJoined = user && event && event.is_joined === true;
  const isFull = event && event.capacity && event.attendee_count >= event.capacity;
  const isCancelled = event && event.is_cancelled === true;

  // Sign out
  const handleSignOut = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Auto sign out on expired session
  const handleExpiredSession = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    alert("Your session has expired. Please sign in again.");
    navigate("/login");
  };

  // Fetch event details and categories
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        // Fetch event
        const eventRes = await fetch(`${API}/events/${id}/`, {
          headers: { ...getAuthHeaders() },
        });
        if (!eventRes.ok) throw new Error(`Event not found`);
        const eventData = await eventRes.json();
        setEvent(eventData);
        
        // Fetch categories
        const catRes = await fetch(`${API}/categories/`);
        const catData = await catRes.json();
        setCategories(catData);
      } catch (e) {
        setError(e.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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

      if (res.status === 401) {
        handleExpiredSession();
        return;
      }

      if (!res.ok) throw new Error("Failed to join event");
      
      setActionSuccess("Successfully joined the event!");
      // Refresh event data
      const eventRes = await fetch(`${API}/events/${id}/`, {
        headers: { ...getAuthHeaders() },
      });
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

      if (res.status === 401) {
        handleExpiredSession();
        return;
      }

      if (!res.ok) throw new Error("Failed to leave event");
      
      setActionSuccess("You have left the event.");
      // Refresh event data
      const eventRes = await fetch(`${API}/events/${id}/`, {
        headers: { ...getAuthHeaders() },
      });
      const data = await eventRes.json();
      setEvent(data);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Kick User (Host only)
  async function handleKick(userId, username) {
    if (!isHost) return;
    
    if (!confirm(`Are you sure you want to kick ${username} from this event?`)) {
      return;
    }

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const access = localStorage.getItem("access");
      const res = await fetch(`${API}/events/${id}/kick/`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${access}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (res.status === 401) {
        handleExpiredSession();
        return;
      }

      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to kick user");
        }
        const text = await res.text();
        throw new Error(text || "Failed to kick user");
      }
      
      setActionSuccess(`${username} has been kicked from the event.`);
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

  // Host: Cancel Event
  async function handleCancel() {
    if (!isHost) return;

    if (!confirm("Are you sure you want to cancel this event? Attendees will be removed.")) {
      return;
    }

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const access = localStorage.getItem("access");
      const res = await fetch(`${API}/events/${id}/cancel/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${access}` },
      });

      if (res.status === 401) {
        handleExpiredSession();
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || body.error || "Failed to cancel event");
      }

      setActionSuccess("Event cancelled.");
      const eventRes = await fetch(`${API}/events/${id}/`, {
        headers: { ...getAuthHeaders() },
      });
      const data = await eventRes.json();
      setEvent(data);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Enable Edit Mode
  function enableEditMode() {
    if (!isHost || !event) return;
    
    setEditForm({
      title: event.title || "",
      description: event.description || "",
      location_name: event.location_name || "",
      address: event.address || "",
      capacity: event.capacity || "",
      start_time: event.start_time ? event.start_time.slice(0, 16) : "",
      end_time: event.end_time ? event.end_time.slice(0, 16) : "",
      category: event.category_id || "",
    });
    setIsEditMode(true);
    setActionError("");
    setActionSuccess("");
  }

  // Cancel Edit Mode
  function cancelEdit() {
    setIsEditMode(false);
    setEditForm({});
    setActionError("");
    setActionSuccess("");
  }

  // Save Event Changes
  async function handleSaveEdit() {
    if (!isHost) return;

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const access = localStorage.getItem("access");
      
      // Build update payload
      const payload = {
        title: editForm.title,
        description: editForm.description,
        location_name: editForm.location_name,
        address: editForm.address,
        capacity: editForm.capacity ? parseInt(editForm.capacity) : null,
        category: editForm.category || null,
      };

      // Add times if provided
      if (editForm.start_time) {
        payload.start_time = new Date(editForm.start_time).toISOString();
      }
      if (editForm.end_time) {
        payload.end_time = new Date(editForm.end_time).toISOString();
      }

      const res = await fetch(`${API}/events/${id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        handleExpiredSession();
        return;
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update event");
      }

      setActionSuccess("Event updated successfully!");
      setIsEditMode(false);
      
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
        {user ? (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={S.userBadge}>{user.username}</span>
            <button onClick={handleSignOut} style={S.signOutBtn}>Sign Out</button>
          </div>
        ) : (
          <div style={{ width: 80 }} />
        )}
      </div>

      {/* Content */}
      <div style={S.content}>
        {/* Left: Event Details */}
        <div style={S.detailsPanel}>
          {/* Category Badge */}
          {!isEditMode && (
            <div style={{ ...S.categoryBadge, background: color }}>
              {event.category_name || "Event"}
            </div>
          )}

          {/* Title */}
          {!isEditMode ? (
            <h1 style={S.title}>{event.title}</h1>
          ) : (
            <div style={{ marginBottom: 20 }}>
              <label style={S.inputLabel}>Event Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                style={S.input}
                placeholder="Enter event title"
              />
            </div>
          )}

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
          {isFull && !isEditMode && (
            <div style={S.warningBox}>
              This event is at full capacity ({event.capacity} attendees)
            </div>
          )}

          {/* Host Controls: Edit Button */}
          {isHost && !isEditMode && (
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button onClick={enableEditMode} style={S.primaryBtn}>
                Edit Event
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading || isCancelled}
                style={{ ...S.secondaryBtn, opacity: (actionLoading || isCancelled) ? 0.5 : 1 }}
              >
                {isCancelled ? "Event Cancelled" : "Cancel Event"}
              </button>
            </div>
          )}

          {/* Edit Mode: Save/Cancel Buttons */}
          {isHost && isEditMode && (
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button 
                onClick={handleSaveEdit} 
                disabled={actionLoading}
                style={{ ...S.primaryBtn, opacity: actionLoading ? 0.5 : 1 }}
              >
                {actionLoading ? "Saving..." : "Save Changes"}
              </button>
              <button 
                onClick={cancelEdit} 
                disabled={actionLoading}
                style={S.secondaryBtn}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Action Buttons for Non-Hosts */}
          {!isHost && user && !isEditMode && (
            <div style={{ marginTop: 20 }}>
              {isCancelled ? (
                <div style={S.infoBox}>
                  This event has been cancelled by the host.
                </div>
              ) : !isJoined ? (
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

          {!user && !isEditMode && (
            <div style={S.infoBox}>
              <Link to="/login" style={{ color: "#f97316", textDecoration: "none" }}>Sign in</Link> to join this event
            </div>
          )}

          {/* Messages */}
          {isCancelled && (
            <div style={S.infoBox}>
              This event has been cancelled by the host.
            </div>
          )}

          {actionSuccess && <div style={S.successBox}>{actionSuccess}</div>}
          {actionError && <div style={S.errorMsg}>{actionError}</div>}

          {/* Event Details or Edit Form */}
          {!isEditMode ? (
            <>
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

              {/* Attendee List (Host only) */}
              {isHost && event.attendees && event.attendees.length > 0 && (
                <div style={S.attendeesSection}>
                  <h3 style={S.sectionTitle}>Attendees ({event.attendees.length})</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {event.attendees.map((attendee) => (
                      <div key={attendee.id} style={S.attendeeItem}>
                        <span style={S.attendeeName}>{attendee.username}</span>
                        <button
                          onClick={() => handleKick(attendee.id, attendee.username)}
                          disabled={actionLoading}
                          style={S.kickBtn}
                        >
                          Kick
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Edit Form */
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }}>
              <div>
                <label style={S.inputLabel}>Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  style={S.select}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={S.inputLabel}>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  style={{ ...S.input, minHeight: 100, resize: "vertical" }}
                  placeholder="Describe your event"
                />
              </div>

              <div>
                <label style={S.inputLabel}>Location Name</label>
                <input
                  type="text"
                  value={editForm.location_name}
                  onChange={(e) => setEditForm({ ...editForm, location_name: e.target.value })}
                  style={S.input}
                  placeholder="e.g., Central Park"
                />
              </div>

              <div>
                <label style={S.inputLabel}>Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  style={S.input}
                  placeholder="Street address"
                />
              </div>

              <div>
                <label style={S.inputLabel}>Capacity (max attendees)</label>
                <input
                  type="number"
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                  style={S.input}
                  placeholder="Leave blank for unlimited"
                  min="1"
                />
              </div>

              <div>
                <label style={S.inputLabel}>Start Time</label>
                <input
                  type="datetime-local"
                  value={editForm.start_time}
                  onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                  style={S.input}
                />
              </div>

              <div>
                <label style={S.inputLabel}>End Time</label>
                <input
                  type="datetime-local"
                  value={editForm.end_time}
                  onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                  style={S.input}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Map */}
        {hasLocation && !isEditMode && (
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
  userBadge: { fontSize: 11, color: "#64748b", background: "#0f1219", border: "1px solid #1e2535", borderRadius: 20, padding: "3px 10px" },
  signOutBtn: { fontSize: 11, color: "#94a3b8", background: "transparent", border: "1px solid #1e2535", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, transition: "color 0.2s, background 0.2s, border-color 0.2s" },
  
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
  
  primaryBtn: { width: "100%", padding: 16, background: "#f97316", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, transition: "transform 0.1s, opacity 0.2s", fontFamily: "inherit", cursor: "pointer" },
  secondaryBtn: { width: "100%", padding: 16, background: "rgba(255,255,255,0.05)", color: "#e2e8f0", border: "1px solid #1e2535", borderRadius: 12, fontSize: 16, fontWeight: 700, transition: "transform 0.1s, opacity 0.2s", fontFamily: "inherit", cursor: "pointer" },
  
  detailsSection: { display: "flex", flexDirection: "column", gap: 16, padding: "24px 0", borderTop: "1px solid #1e2535" },
  sectionTitle: { fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b", margin: 0 },
  detailRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  detailLabel: { fontSize: 14, color: "#94a3b8" },
  detailValue: { fontSize: 14, fontWeight: 600, color: "#e2e8f0" },
  
  descriptionSection: { display: "flex", flexDirection: "column", gap: 12 },
  description: { fontSize: 15, lineHeight: 1.7, color: "#94a3b8", margin: 0 },
  
  attendeesSection: { display: "flex", flexDirection: "column", gap: 16, padding: "24px 0", borderTop: "1px solid #1e2535" },
  attendeeItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid #1e2535" },
  attendeeName: { fontSize: 14, color: "#e2e8f0", fontWeight: 500 },
  kickBtn: { padding: "6px 16px", background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background 0.2s", fontFamily: "inherit" },
  
  inputLabel: { display: "block", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 8 },
  input: { width: "100%", padding: 12, background: "rgba(255,255,255,0.03)", border: "1px solid #1e2535", borderRadius: 8, color: "#e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none", transition: "border 0.2s" },
  select: { width: "100%", padding: 12, background: "rgba(255,255,255,0.03)", border: "1px solid #1e2535", borderRadius: 8, color: "#e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none", transition: "border 0.2s", cursor: "pointer" },
  
  mapPanel: { height: 600, borderRadius: 16, overflow: "hidden", border: "1px solid #1e2535" },
  
  loader: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" },
  spinner: { width: 48, height: 48, border: "4px solid #1e2535", borderTop: "4px solid #f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  
  errorBox: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", textAlign: "center", padding: 40 },
  backBtn: { display: "inline-block", marginTop: 20, padding: "12px 24px", background: "#f97316", color: "#fff", textDecoration: "none", borderRadius: 10, fontWeight: 600, transition: "transform 0.1s" },
};

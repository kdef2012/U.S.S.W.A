"use client";

import { useState } from "react";
import { uploadEventImage } from "@/app/actions/uploadImage";
import { deleteEvent } from "@/app/actions/deleteEvent";
import { logoutAdmin } from "@/app/actions/auth";
import EventBuilderModal from "@/components/EventBuilderModal";
import RolodexView from "./RolodexView";
import AnalyticsDashboard from "./AnalyticsDashboard";
import RegistrationLogModal from "./RegistrationLogModal";

import { createAdminPin } from "@/app/actions/auth";

export default function AdminDashboardUI({ events, registrations, parents, wrestlers, userRole }: { events: any[], registrations: any[], parents: any[], wrestlers: any[], userRole: string }) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"command_center" | "rolodex" | "analytics">("command_center");
  const [analyticsEventId, setAnalyticsEventId] = useState<string>("all");
  const [logEventId, setLogEventId] = useState<string | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinMessage, setPinMessage] = useState("");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Split events into Upcoming/Current vs Archived
  const activeEvents = events.filter((e) => {
    const d = new Date((e.date || "2026-01-01") + "T12:00:00");
    // Add timezone offset to avoid UTC date parsing bugs
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    d.setHours(23, 59, 59, 999);
    return d >= today;
  });

  const archivedEvents = events.filter((e) => {
    const d = new Date((e.date || "2026-01-01") + "T12:00:00");
    // Add timezone offset
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    d.setHours(23, 59, 59, 999);
    return d < today;
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, eventId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(eventId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("eventId", eventId);

    const result = await uploadEventImage(formData);
    setUploadingId(null);

    if (result.success) {
      window.location.reload();
    } else {
      alert("Error: " + result.message);
    }
  };

  const handleDelete = async (eventId: string, eventName: string) => {
    if (confirm(`Are you absolutely sure you want to delete "${eventName}"? This action cannot be undone.`)) {
      setIsDeleting(eventId);
      const result = await deleteEvent(eventId);
      setIsDeleting(null);
      if (result.success) {
        window.location.reload();
      } else {
        alert("Error: " + result.message);
      }
    }
  };

  const handleEdit = (event: any) => {
    setEventToEdit(event);
    setIsBuilderOpen(true);
  };

  const handleViewAnalytics = (eventId: string) => {
    setAnalyticsEventId(eventId);
    setActiveTab("analytics");
  };

  const handleLogout = async () => {
    await logoutAdmin();
    window.location.href = "/";
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage("");
    const res = await createAdminPin(newPin);
    if (res.success) {
      setPinMessage("Admin user added successfully!");
      setNewPin("");
      setTimeout(() => setIsAddUserOpen(false), 2000);
    } else {
      setPinMessage(res.message || "Failed to add user");
    }
  };

  return (
    <div className="container" style={{ marginTop: "3rem", maxWidth: "1400px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ marginBottom: "0.5rem" }}>Admin Portal</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem", margin: 0 }}>
            U.S.S.W.A Tournament Management
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          {activeTab === "command_center" && (
            <>
              {userRole === "superadmin" && (
                <button onClick={() => setIsAddUserOpen(true)} className="btn" style={{ background: "var(--accent-secondary)", color: "white", border: "none" }}>
                  + Add User
                </button>
              )}
              <button onClick={() => {
                setEventToEdit(null);
                setIsBuilderOpen(true);
              }} className="btn btn-primary">
                + Create New Event
              </button>
            </>
          )}
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar" style={{ marginBottom: "3rem", justifyContent: "flex-start" }}>
        <button 
          className={`tab-btn ${activeTab === "command_center" ? "active" : ""}`}
          onClick={() => setActiveTab("command_center")}
        >
          Command Center
        </button>
        <button 
          className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => {
            setAnalyticsEventId("all");
            setActiveTab("analytics");
          }}
        >
          Central Intelligence
        </button>
        <button 
          className={`tab-btn ${activeTab === "rolodex" ? "active" : ""}`}
          onClick={() => setActiveTab("rolodex")}
        >
          Rolodex
        </button>
      </div>

      {isBuilderOpen && <EventBuilderModal onClose={() => {
        setIsBuilderOpen(false);
        setEventToEdit(null);
      }} editEvent={eventToEdit} />}

      {activeTab === "rolodex" && (
        <RolodexView parents={parents} wrestlers={wrestlers} registrations={registrations} />
      )}

      {activeTab === "analytics" && (
        <AnalyticsDashboard 
          key={analyticsEventId} // Forces remount if event ID changes via shortcut button
          events={events} 
          registrations={registrations} 
          wrestlers={wrestlers} 
          parents={parents} 
          initialEventId={analyticsEventId}
        />
      )}

      {activeTab === "command_center" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "3rem" }}>
        {/* Main Area: Upcoming Events */}
        <div>
          <h2 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
            Upcoming Tournaments ({activeEvents.length})
          </h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            {activeEvents.map((event) => (
              <div key={event.id} className="glass-card" style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--text-primary)" }}>{event.name}</h3>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                    {new Date((event.date || "2026-01-01") + "T12:00:00").toLocaleDateString()} • {event.location || "Location TBA"}
                  </div>
                  {event.image_url && (
                    <span style={{ display: "inline-block", marginTop: "0.5rem", color: "var(--accent-primary)", fontSize: "0.8rem", fontWeight: "bold", textTransform: "uppercase" }}>
                      ✓ Custom Image Uploaded
                    </span>
                  )}
                </div>
                
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <div style={{ fontWeight: "bold", color: "var(--accent-primary)", fontSize: "1.2rem", paddingRight: "1rem" }}>
                    ${registrations.filter(r => r.event_id === event.id).reduce((sum, r) => sum + Number(r.fee || 35), 0).toLocaleString()}
                  </div>
                  {uploadingId === event.id ? (
                    <div className="btn btn-secondary" style={{ pointerEvents: "none", color: "var(--accent-primary)" }}>
                      Uploading...
                    </div>
                  ) : (
                    <label className="btn btn-secondary" style={{ cursor: "pointer", fontSize: "0.8rem", padding: "0.5rem 1rem" }}>
                      Upload Logo
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: "none" }} 
                        onChange={(e) => handleFileChange(e, event.id)}
                      />
                    </label>
                  )}
                  <button onClick={() => setLogEventId(event.id)} className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.5rem 1rem", borderColor: "#a855f7", color: "#a855f7" }}>
                    Reg Log
                  </button>
                  <button onClick={() => handleViewAnalytics(event.id)} className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.5rem 1rem", borderColor: "#10b981", color: "#10b981" }}>
                    Analytics
                  </button>
                  <button onClick={() => handleEdit(event)} className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(event.id, event.name)} disabled={isDeleting === event.id} className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.5rem 1rem", borderColor: "var(--accent-secondary)", color: "var(--accent-secondary)" }}>
                    {isDeleting === event.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
            {activeEvents.length === 0 && <p style={{ color: "var(--text-secondary)" }}>No upcoming tournaments.</p>}
          </div>
        </div>

        {/* Sidebar: Archives */}
        <div>
          <div className="glass-card" style={{ padding: "1.5rem", background: "rgba(15, 23, 42, 0.9)" }}>
            <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.5rem", fontSize: "1.2rem" }}>
              Archive ({archivedEvents.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "600px", overflowY: "auto", paddingRight: "0.5rem" }}>
              {archivedEvents.map((event) => (
                <div key={event.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "var(--text-secondary)" }}>{event.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {new Date((event.date || "2026-01-01") + "T12:00:00").toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
        </>
      )}
      {isBuilderOpen && (
        <EventBuilderModal 
          onClose={() => setIsBuilderOpen(false)} 
          existingEvent={eventToEdit}
        />
      )}

      {isAddUserOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div className="glass-card" style={{ padding: "2rem", width: "100%", maxWidth: "400px" }}>
            <h2 style={{ marginBottom: "1rem", color: "var(--accent-primary)" }}>Add New Admin</h2>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label className="form-label">Create 4-Digit PIN</label>
                <input 
                  type="text" 
                  pattern="[0-9]{4}"
                  maxLength={4}
                  className="form-input" 
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="e.g. 1234"
                  required 
                />
              </div>
              {pinMessage && (
                <div style={{ marginBottom: "1rem", color: pinMessage.includes("success") ? "lime" : "var(--accent-secondary)", fontWeight: "bold" }}>
                  {pinMessage}
                </div>
              )}
              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddUserOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {logEventId && (
        <RegistrationLogModal 
          event={events.find(e => e.id === logEventId)}
          registrations={registrations}
          wrestlers={wrestlers}
          onClose={() => setLogEventId(null)}
        />
      )}
    </div>
  );
}

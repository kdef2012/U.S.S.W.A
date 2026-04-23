"use client";

import { useState } from "react";
import { createEvent } from "@/app/actions/createEvent";

export default function EventBuilderModal({ 
  onClose,
  editEvent 
}: { 
  onClose: () => void;
  editEvent?: any; 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    if (editEvent?.id) {
      formData.append("id", editEvent.id);
    }
    const result = await createEvent(formData);
    
    setIsSubmitting(false);
    if (result.success) {
      window.location.reload();
    } else {
      alert("Error: " + result.message);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      backdropFilter: "blur(5px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999
    }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "600px", padding: "2.5rem", position: "relative" }}>
        <button 
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1.5rem", right: "1.5rem",
            background: "none", border: "none",
            color: "var(--text-secondary)",
            fontSize: "1.5rem", cursor: "pointer"
          }}
        >
          &times;
        </button>
        
        <h2 style={{ marginBottom: "2rem", color: "var(--accent-primary)" }}>
          {editEvent ? "Edit Tournament" : "Create New Tournament"}
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Tournament Name *</label>
            <input 
              name="name"
              required
              defaultValue={editEvent?.name}
              placeholder="e.g. War at the WaterTower"
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "white" }}
            />
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Date *</label>
              <input 
                type="date"
                name="date"
                required
                defaultValue={editEvent?.date ? new Date(editEvent.date).toISOString().split('T')[0] : ""}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "white" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Registration Cost ($) *</label>
              <input 
                type="number"
                name="cost"
                step="0.01"
                min="0"
                defaultValue={editEvent?.cost ?? "35.00"}
                required
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "white" }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Location</label>
            <input 
              name="location"
              defaultValue={editEvent?.location}
              placeholder="e.g. Glenn High School"
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "white" }}
            />
          </div>

          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
            <h3 style={{ marginBottom: "1.5rem", color: "var(--accent-secondary)" }}>Advanced Capacity Settings</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Total Spaces (Optional)</label>
                <input 
                  type="number"
                  name="total_spaces"
                  placeholder="e.g. 400"
                  defaultValue={editEvent?.total_spaces}
                  min="1"
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "white" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Max Spaces Per Booking</label>
                <input 
                  type="number"
                  name="max_spaces_per_booking"
                  placeholder="e.g. 20"
                  min="1"
                  defaultValue={editEvent?.max_spaces_per_booking ?? "20"}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "white" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Booking Cut-Off Date & Time (Optional)</label>
              <input 
                type="datetime-local"
                name="cutoff_date"
                defaultValue={editEvent?.cutoff_date ? new Date(editEvent.cutoff_date).toISOString().slice(0, 16) : ""}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "rgba(255,255,255,0.05)", color: "white" }}
              />
            </div>
          </div>

          <div style={{ marginTop: "1rem" }}>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: "100%", padding: "1rem" }}>
              {isSubmitting ? (editEvent ? "Saving..." : "Creating...") : (editEvent ? "Save Changes" : "Create Tournament")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

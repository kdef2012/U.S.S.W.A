"use client";

import { useState } from "react";
import { uploadEventImage } from "@/app/actions/uploadImage";

export default function AdminEventList({ events }: { events: any[] }) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);

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
      alert("Image successfully uploaded and applied!");
      // Hard refresh to reflect new JSON data and image
      window.location.reload();
    } else {
      alert("Error: " + result.message);
    }
  };

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {events.map((event) => (
        <div key={event.slug} style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          padding: "1rem", 
          background: "rgba(0,0,0,0.2)", 
          borderRadius: "8px",
          border: "1px solid var(--border-color)"
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{event.title}</h3>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              {new Date(event.startDate + "T12:00:00").toLocaleDateString()}
            </span>
            {event.imageUrl && (
              <span style={{ marginLeft: "1rem", color: "var(--accent-primary)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                ✓ Custom Image
              </span>
            )}
          </div>
          
          <div>
            {uploadingId === event.slug ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
                Uploading...
              </div>
            ) : (
              <label className="btn btn-secondary" style={{ cursor: "pointer", fontSize: "0.9rem", padding: "0.5rem 1rem" }}>
                Upload Logo
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: "none" }} 
                  onChange={(e) => handleFileChange(e, event.slug)}
                />
              </label>
            )}
          </div>
        </div>
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}

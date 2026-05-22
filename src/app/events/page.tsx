"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<"archives" | "current" | "upcoming">("upcoming");
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [wrestlers, setWrestlers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchEvents() {
      const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
      if (data) setEventsData(data);
      
      const { data: regsData } = await supabase.from('registrations').select('event_id, division, weight_class, wrestler_id');
      if (regsData) setRegistrations(regsData);

      const { data: wrestlersData } = await supabase.from('wrestlers').select('id, first_name, last_name');
      if (wrestlersData) setWrestlers(wrestlersData);
    }
    fetchEvents();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

  // Filter events based on active tab
  const filteredEvents = eventsData.filter((event) => {
    const eventDate = new Date(event.date || "2026-01-01");
    
    // Add timezone offset to avoid JS date parsing off-by-one errors with UTC
    eventDate.setMinutes(eventDate.getMinutes() + eventDate.getTimezoneOffset());
    
    if (activeTab === "archives") {
      // Event ended before today
      const endOfEventDate = new Date(eventDate);
      endOfEventDate.setHours(23, 59, 59, 999);
      return endOfEventDate < today;
    } 
    
    if (activeTab === "current") {
      // Event is happening today
      // Check if today falls on the exact event start date
      return eventDate >= today && eventDate < tomorrow;
    }
    
    if (activeTab === "upcoming") {
      // Event is strictly in the future (after today)
      // Since 'today' is 00:00:00, tomorrow is strictly future
      return eventDate >= tomorrow;
    }

    return false;
  });

  const getEventCount = (eventId: string) => {
    const eventRegs = registrations.filter(r => r.event_id === eventId && r.division !== "Multiple Attendees");
    
    const divisionsMap: Record<string, any[]> = {};
    eventRegs.forEach(reg => {
      const wrestler = wrestlers.find(w => w.id === reg.wrestler_id);
      if (!wrestler) return;

      if (!divisionsMap[reg.division]) divisionsMap[reg.division] = [];
      
      const isDuplicate = divisionsMap[reg.division].some(existing => {
        if (existing.weight_class !== reg.weight_class) return false;
        if (existing.wrestler_id === wrestler.id) return true;
        return existing.first_name.trim().toLowerCase() === wrestler.first_name.trim().toLowerCase() && 
               existing.last_name.trim().toLowerCase() === wrestler.last_name.trim().toLowerCase();
      });

      if (!isDuplicate) {
        divisionsMap[reg.division].push({ ...reg, first_name: wrestler.first_name, last_name: wrestler.last_name });
      }
    });

    return Object.values(divisionsMap).reduce((sum, arr) => sum + arr.length, 0);
  };

  return (
    <div className="container" style={{ marginTop: "3rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>All Tournaments</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "1.2rem" }}>
        Discover and register for U.S.S.W.A events across the country.
      </p>

      <div className="tabs-bar">
        <button 
          className={`tab-btn ${activeTab === "archives" ? "active" : ""}`}
          onClick={() => setActiveTab("archives")}
        >
          Archives
        </button>
        <button 
          className={`tab-btn ${activeTab === "current" ? "active" : ""}`}
          onClick={() => setActiveTab("current")}
        >
          Current
        </button>
        <button 
          className={`tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming
        </button>
      </div>

      {filteredEvents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>
          <p>No events found for this category.</p>
        </div>
      ) : (
        <div className="event-grid">
          {filteredEvents.map((event) => {
            const count = getEventCount(event.id);
            return (
            <div className="glass-card" key={event.id} style={{ '--card-bg-image': event.image_url ? `url(${event.image_url})` : undefined } as React.CSSProperties}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <span className="event-date">
                  {new Date(event.date).toLocaleDateString("en-US", {
                    timeZone: 'UTC',
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).toUpperCase()}
                </span>
                
                <div style={{ 
                  display: "flex", alignItems: "center", gap: "0.5rem", 
                  background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", 
                  padding: "0.25rem 0.75rem", borderRadius: "100px", 
                  color: "#34d399", fontWeight: "bold", fontSize: "0.85rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  {count} {count === 1 ? 'Wrestler' : 'Wrestlers'}
                </div>
              </div>
              
              <h3>{event.name || event.title}</h3>
              <div className="event-location">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {event.location ? (
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", textDecorationStyle: "dotted" }}>
                    {event.location}
                  </a>
                ) : "Location TBA"}
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <a href={`/events/${event.id}`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
                  {activeTab === "archives" ? "View Results" : "Register Now"}
                </a>
                <a href={`/events/${event.id}/matrix`} className="btn" style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  border: '1px solid rgba(255,255,255,0.2)', 
                  color: 'white',
                  textDecoration: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}>
                  Matrix
                </a>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}

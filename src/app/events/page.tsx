"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<"archives" | "current" | "upcoming">("upcoming");
  const [eventsData, setEventsData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchEvents() {
      const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
      if (data) setEventsData(data);
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
          {filteredEvents.map((event) => (
            <div className="glass-card" key={event.id} style={{ '--card-bg-image': event.image_url ? `url(${event.image_url})` : undefined } as React.CSSProperties}>
              <span className="event-date">
                {new Date(event.date).toLocaleDateString("en-US", {
                  timeZone: 'UTC',
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).toUpperCase()}
              </span>
              <h3>{event.title}</h3>
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
              <a href={`/events/${event.id}`} className="btn btn-secondary" style={{ width: "100%" }}>
                {activeTab === "archives" ? "View Results" : "Event Details & Register"}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

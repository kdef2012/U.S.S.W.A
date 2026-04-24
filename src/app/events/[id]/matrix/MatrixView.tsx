"use client";

import { useState } from "react";

export default function MatrixView({ event, registrations, wrestlers }: { event: any, registrations: any[], wrestlers: any[] }) {
  const [selectedDivision, setSelectedDivision] = useState<string>("All");

  // Get registrations for this specific event (excluding Multiple Attendees placeholders)
  const eventRegs = registrations.filter(r => r.event_id === event.id && r.division !== "Multiple Attendees");

  // Group by division
  const divisionsMap: Record<string, any[]> = {};
  eventRegs.forEach(reg => {
    // Only process valid wrestlers
    const wrestler = wrestlers.find(w => w.id === reg.wrestler_id);
    if (!wrestler) return;

    if (!divisionsMap[reg.division]) {
      divisionsMap[reg.division] = [];
    }
    
    // Deduplicate: check if this exact wrestler is already in this division and weight class
    const isDuplicate = divisionsMap[reg.division].some(existing => {
      if (existing.weight_class !== reg.weight_class) return false;
      if (existing.wrestler.id === wrestler.id) return true;
      return existing.wrestler.first_name.trim().toLowerCase() === wrestler.first_name.trim().toLowerCase() && 
             existing.wrestler.last_name.trim().toLowerCase() === wrestler.last_name.trim().toLowerCase();
    });

    if (!isDuplicate) {
      divisionsMap[reg.division].push({ ...reg, wrestler });
    }
  });

  const divisionOrder = ["TOT", "BANTAM", "ELEMENTARY", "MIDDLE SCHOOL", "HIGH SCHOOL"];
  const getDivWeight = (div: string) => {
    const idx = divisionOrder.indexOf(div.toUpperCase());
    return idx !== -1 ? idx : 999;
  };

  const availableDivisions = Object.keys(divisionsMap).sort((a, b) => getDivWeight(a) - getDivWeight(b));

  // Filter based on dropdown
  const filteredDivisions = selectedDivision === "All" 
    ? availableDivisions 
    : [selectedDivision];

  const totalDeduplicatedCount = Object.values(divisionsMap).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="container" style={{ marginTop: "2rem", marginBottom: "4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ color: "var(--accent-primary)", marginBottom: "0.5rem" }}>{event.name}</h1>
          <h2 style={{ margin: 0, color: "var(--text-secondary)" }}>Public Registration Matrix</h2>
        </div>
        
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "0.75rem 1.5rem", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34d399", fontWeight: "bold" }}>
            {totalDeduplicatedCount} Total Wrestlers
          </div>
          <select 
            value={selectedDivision} 
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="form-input"
            style={{ width: "250px", margin: 0 }}
          >
            <option value="All">All Divisions</option>
            {availableDivisions.map(div => (
              <option key={div} value={div}>{div} ({divisionsMap[div].length})</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gap: "2rem" }}>
        {filteredDivisions.map(division => {
          // Group by weight class within this division
          const weightClasses: Record<string, any[]> = {};
          divisionsMap[division].forEach(reg => {
            if (!weightClasses[reg.weight_class]) weightClasses[reg.weight_class] = [];
            weightClasses[reg.weight_class].push(reg);
          });

          // Sort weight classes
          const sortedWeights = Object.keys(weightClasses).sort((a, b) => {
            if (a.toUpperCase() === "HWT" || a.toUpperCase().includes("HWT")) return 1;
            if (b.toUpperCase() === "HWT" || b.toUpperCase().includes("HWT")) return -1;
            const numA = parseInt(a.replace(/[^0-9]/g, ''));
            const numB = parseInt(b.replace(/[^0-9]/g, ''));
            return numA - numB;
          });

          return (
            <div key={division} className="glass-card" style={{ padding: "1.25rem", borderTop: "4px solid var(--accent-primary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.25rem" }}>{division}</h3>
                <span style={{ color: "var(--text-secondary)", fontWeight: "bold", fontSize: "0.9rem" }}>
                  {divisionsMap[division].length} Entries
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                {sortedWeights.map(weight => {
                  const regsInWeight = weightClasses[weight];
                  return (
                    <div key={weight} style={{ background: "rgba(0,0,0,0.2)", borderRadius: "6px", overflow: "hidden" }}>
                      <div style={{ background: "rgba(255,255,255,0.05)", padding: "0.5rem 0.75rem", fontWeight: "bold", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                        <span>Weight Class: {weight}</span>
                        <span style={{ color: "var(--accent-secondary)" }}>{regsInWeight.length} Wrestlers</span>
                      </div>
                      
                      <div style={{ padding: "0" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                          <tbody>
                            {regsInWeight.map(reg => (
                              <tr key={reg.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <td style={{ padding: "0.4rem 0.75rem", width: "50%", fontWeight: "500" }}>
                                  {reg.wrestler.first_name} {reg.wrestler.last_name}
                                </td>
                                <td style={{ padding: "0.4rem 0.75rem", width: "50%", color: "var(--text-secondary)" }}>
                                  {reg.wrestler.team || "Independent"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredDivisions.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem", background: "rgba(0,0,0,0.2)", borderRadius: "12px", color: "var(--text-secondary)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: "0 auto 1rem", opacity: 0.5 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <h3 style={{ marginBottom: "0.5rem" }}>No registrations found</h3>
            <p>There are no wrestlers registered for this division yet.</p>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: "3rem", textAlign: "center" }}>
        <a href={`/events/${event.id}`} className="btn btn-primary" style={{ padding: "1rem 3rem", fontSize: "1.1rem" }}>
          Register for {event.name}
        </a>
      </div>
    </div>
  );
}

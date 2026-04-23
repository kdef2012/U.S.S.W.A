"use client";

import { useState } from "react";

export default function AnalyticsDashboard({ 
  events, 
  registrations, 
  wrestlers,
  parents,
  initialEventId = "all"
}: { 
  events: any[], 
  registrations: any[], 
  wrestlers: any[],
  parents: any[],
  initialEventId?: string
}) {
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);

  // Filter registrations based on selection
  const activeRegistrations = selectedEventId === "all" 
    ? registrations 
    : registrations.filter(r => r.event_id === selectedEventId);

  // --- KPI Calculations ---
  const totalRegistrations = activeRegistrations.length;
  
  // Financials
  // In a real app, fee is usually a number. If it's a string, cast it.
  const totalRevenue = activeRegistrations.reduce((sum, r) => sum + Number(r.fee || 35), 0);
  // Estimate double brackets: any fee > 35 is likely a double bracket fee ($65 total), or if we explicitly track it.
  // Actually, we added `double_bracket_division` to the DB. Since it might not be fully populated yet, 
  // we can also estimate double brackets based on fees. For now, let's look for fees > 35 or fees == 30.
  const doubleBracketCount = activeRegistrations.filter(r => Number(r.fee) > 35 || Number(r.fee) === 30).length;
  
  // Participant Demographics
  const uniqueWrestlerIds = new Set(activeRegistrations.map(r => r.wrestler_id));
  const uniqueWrestlersCount = uniqueWrestlerIds.size;
  
  // Division Breakdown
  const divisionCounts: Record<string, number> = {};
  activeRegistrations.forEach(r => {
    const div = r.division || "Unknown";
    divisionCounts[div] = (divisionCounts[div] || 0) + 1;
  });

  // Sort divisions by count
  const sortedDivisions = Object.entries(divisionCounts).sort((a, b) => b[1] - a[1]);

  // Find the selected event name
  const eventName = selectedEventId === "all" 
    ? "All-Time Analytics" 
    : events.find(e => e.id === selectedEventId)?.name || "Tournament Analytics";

  return (
    <div className="analytics-container">
      {/* Header & Filter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2 style={{ margin: 0, color: "var(--accent-primary)" }}>{eventName}</h2>
        <select 
          className="form-input" 
          style={{ width: "300px", cursor: "pointer", background: "rgba(15, 23, 42, 0.9)" }}
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
        >
          <option value="all">All Tournaments (Global)</option>
          {events.map(e => (
            <option key={e.id} value={e.id}>{e.name} - {new Date(e.date || "2026-01-01").toLocaleDateString()}</option>
          ))}
        </select>
      </div>

      {/* Top Level KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
        <div className="glass-card" style={{ padding: "1.5rem", borderTop: "4px solid var(--accent-primary)" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>Gross Revenue</h4>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--text-primary)" }}>
            ${totalRevenue.toLocaleString()}
          </div>
        </div>
        
        <div className="glass-card" style={{ padding: "1.5rem", borderTop: "4px solid #10b981" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>Total Entries</h4>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--text-primary)" }}>
            {totalRegistrations}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1.5rem", borderTop: "4px solid #8b5cf6" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>Unique Wrestlers</h4>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--text-primary)" }}>
            {uniqueWrestlersCount}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1.5rem", borderTop: "4px solid var(--accent-secondary)" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>Double Brackets</h4>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--text-primary)" }}>
            {doubleBracketCount}
          </div>
        </div>
      </div>

      {/* Deeper Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        
        {/* Division Breakdown */}
        <div className="glass-card" style={{ padding: "2rem" }}>
          <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
            Division Heatmap
          </h3>
          
          {sortedDivisions.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>No registration data available.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {sortedDivisions.map(([div, count]) => {
                const percentage = Math.round((count / totalRegistrations) * 100);
                return (
                  <div key={div}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: "500", color: "var(--text-primary)" }}>{div}</span>
                      <span style={{ color: "var(--text-secondary)" }}>{count} ({percentage}%)</span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ 
                        height: "100%", 
                        width: `${percentage}%`, 
                        background: "linear-gradient(90deg, var(--accent-primary), #60a5fa)",
                        borderRadius: "4px"
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Real-time Insights */}
        <div className="glass-card" style={{ padding: "2rem" }}>
          <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
            Tournament Insights
          </h3>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div style={{ background: "rgba(15, 23, 42, 0.5)", padding: "1.5rem", borderRadius: "8px", borderLeft: "4px solid var(--accent-primary)" }}>
              <div style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "0.25rem" }}>Mat Allocation Suggestion</div>
              <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.95rem" }}>
                {sortedDivisions.length > 0 ? (
                  <>Based on volume, prioritize your most heavily staffed mats for the <strong>{sortedDivisions[0][0]}</strong> division, which makes up {Math.round((sortedDivisions[0][1] / totalRegistrations) * 100)}% of your traffic.</>
                ) : (
                  "Insufficient data for mat allocation."
                )}
              </p>
            </div>
            
            <div style={{ background: "rgba(15, 23, 42, 0.5)", padding: "1.5rem", borderRadius: "8px", borderLeft: "4px solid #10b981" }}>
              <div style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "0.25rem" }}>Double Bracket Revenue</div>
              <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.95rem" }}>
                You have generated <strong>${(doubleBracketCount * 30).toLocaleString()}</strong> in additional revenue specifically from wrestlers entering a second division.
              </p>
            </div>
            
            <div style={{ background: "rgba(15, 23, 42, 0.5)", padding: "1.5rem", borderRadius: "8px", borderLeft: "4px solid #8b5cf6" }}>
              <div style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "0.25rem" }}>Registration Ratio</div>
              <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.95rem" }}>
                {uniqueWrestlersCount > 0 ? (
                  <>You are averaging <strong>{(totalRegistrations / uniqueWrestlersCount).toFixed(2)}</strong> entries per unique wrestler.</>
                ) : (
                  "Waiting for wrestlers to register."
                )}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

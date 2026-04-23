"use client";

import { useState } from "react";

export default function RolodexView({ parents, wrestlers, registrations }: { parents: any[], wrestlers: any[], registrations: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);

  // Group wrestlers by parent_id
  const parentWrestlersMap: Record<string, any[]> = {};
  wrestlers.forEach(w => {
    if (!parentWrestlersMap[w.parent_id]) {
      parentWrestlersMap[w.parent_id] = [];
    }
    parentWrestlersMap[w.parent_id].push(w);
  });

  // Calculate total registrations per parent (by finding their wrestlers' registrations)
  const parentRegistrationCounts: Record<string, number> = {};
  registrations.forEach(r => {
    // Registrations might have parent_id or just wrestler_id
    // But since we are looking at parents, let's use the registration's parent_id if available,
    // otherwise the wrestler's parent_id.
    const parentId = r.parent_id;
    if (parentId) {
      parentRegistrationCounts[parentId] = (parentRegistrationCounts[parentId] || 0) + 1;
    }
  });

  // Filter parents based on search query
  const filteredParents = parents.filter(p => {
    if (!searchQuery) return true;
    
    const q = searchQuery.toLowerCase();
    
    // Check if parent matches
    const parentMatches = 
      (p.first_name || "").toLowerCase().includes(q) ||
      (p.last_name || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q);

    if (parentMatches) return true;

    // Check if any of their wrestlers match
    const associatedWrestlers = parentWrestlersMap[p.id] || [];
    const wrestlerMatches = associatedWrestlers.some(w => 
      (w.first_name || "").toLowerCase().includes(q) ||
      (w.last_name || "").toLowerCase().includes(q)
    );

    return wrestlerMatches;
  });

  return (
    <div className="rolodex-container">
      {/* Search Bar */}
      <div style={{ marginBottom: "2rem" }}>
        <input 
          type="text" 
          placeholder="Search by Parent or Wrestler name, email, or phone..." 
          className="form-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ fontSize: "1.1rem", padding: "1rem", borderRadius: "12px", background: "rgba(15, 23, 42, 0.8)" }}
        />
      </div>

      {/* Parents Grid */}
      <div style={{ display: "grid", gap: "1rem" }}>
        {filteredParents.map((parent) => {
          const isExpanded = expandedParentId === parent.id;
          const kids = parentWrestlersMap[parent.id] || [];
          const regCount = parentRegistrationCounts[parent.id] || 0;

          return (
            <div key={parent.id} className="glass-card" style={{ padding: "1.5rem" }}>
              <div 
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                onClick={() => setExpandedParentId(isExpanded ? null : parent.id)}
              >
                <div>
                  <h3 style={{ margin: 0, color: "var(--text-primary)" }}>
                    {parent.first_name} {parent.last_name}
                  </h3>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem", display: "flex", gap: "1rem" }}>
                    <span>✉️ {parent.email}</span>
                    <span>📞 {parent.phone}</span>
                  </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Registrations</div>
                    <div style={{ fontWeight: "bold", color: "var(--accent-primary)", fontSize: "1.2rem" }}>{regCount}</div>
                  </div>
                  
                  <div style={{ 
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", 
                    transition: "transform 0.3s ease",
                    color: "var(--text-secondary)"
                  }}>
                    ▼
                  </div>
                </div>
              </div>

              {/* Expanded Wrestlers List */}
              {isExpanded && (
                <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color)" }}>
                  <h4 style={{ color: "var(--accent-primary)", marginBottom: "1rem", fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Associated Wrestlers ({kids.length})
                  </h4>
                  
                  {kids.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No wrestlers found for this parent.</p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
                      {kids.map((wrestler) => {
                        // Find this wrestler's registrations
                        const wRegs = registrations.filter(r => r.wrestler_id === wrestler.id);
                        
                        return (
                          <div key={wrestler.id} style={{ background: "rgba(15, 23, 42, 0.5)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{wrestler.first_name} {wrestler.last_name}</div>
                            {wrestler.team && <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Team: {wrestler.team}</div>}
                            
                            {wRegs.length > 0 && (
                              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed var(--border-color)" }}>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>History</div>
                                {wRegs.map((r, i) => (
                                  <div key={i} style={{ fontSize: "0.85rem", display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                    <span style={{ color: "var(--text-secondary)" }}>{r.division} / {r.weight_class}</span>
                                    <span style={{ color: r.status === 'pre-registered' ? "var(--accent-primary)" : "var(--text-primary)" }}>{r.status}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filteredParents.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
            No parents or wrestlers found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}

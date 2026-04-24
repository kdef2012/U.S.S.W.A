"use client";

import { useState } from "react";

export default function RegistrationLogModal({ event, registrations, wrestlers, onClose }: { event: any, registrations: any[], wrestlers: any[], onClose: () => void }) {
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

  // Calculate the true count after deduplication
  const totalDeduplicatedCount = Object.values(divisionsMap).reduce((sum, arr) => sum + arr.length, 0);

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

  // Prepare CSV Export
  const handleDownloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Division,Weight Class,First Name,Last Name,Team/Club\n";

    filteredDivisions.forEach(div => {
      const divisionRegs = divisionsMap[div];
      
      // Sort by weight class
      divisionRegs.sort((a, b) => a.weight_class.localeCompare(b.weight_class));

      divisionRegs.forEach(reg => {
        const row = [
          div,
          reg.weight_class,
          reg.wrestler.first_name,
          reg.wrestler.last_name,
          reg.wrestler.team || "N/A"
        ].map(e => `"${e}"`).join(",");
        csvContent += row + "\n";
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${event.name.replace(/\s+/g, '_')}_Registration_Log_${selectedDivision}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="registration-log-modal" style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15, 23, 42, 0.95)", zIndex: 1000,
      overflowY: "auto", padding: "2rem"
    }}>
      {/* Hide controls when printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .registration-log-modal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 100vh !important;
            background: white !important;
          }
          #print-layout, #print-layout * {
            visibility: visible;
          }
          #print-layout {
            position: relative;
            background: white !important;
            color: black !important;
            width: 100%;
          }
          .screen-only {
            display: none !important;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}} />

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1 style={{ color: "var(--accent-primary)", margin: 0 }}>Registration Log: {event.name}</h1>
          <button onClick={onClose} className="btn" style={{ background: "transparent", color: "var(--text-secondary)", fontSize: "2rem", border: "none" }}>&times;</button>
        </div>

        <div className="no-print glass-card" style={{ padding: "1.5rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <label style={{ fontWeight: "bold", marginRight: "1rem" }}>Filter by Division:</label>
            <select 
              className="form-input" 
              style={{ width: "250px", display: "inline-block" }}
              value={selectedDivision} 
              onChange={e => setSelectedDivision(e.target.value)}
            >
              <option value="All">All Divisions</option>
              {availableDivisions.map(div => (
                <option key={div} value={div}>{div}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={handleDownloadCSV} className="btn btn-secondary" style={{ background: "var(--accent-primary)", color: "white" }}>
              Download CSV
            </button>
            <button onClick={handlePrint} className="btn btn-secondary">
              Print Log
            </button>
          </div>
        </div>

        {/* --- SCREEN LAYOUT (By Weight Class Grid) --- */}
        <div className="screen-only">
          <h2 style={{ marginBottom: "0.5rem" }}>{event.name} - Registration Log</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Total Registered: {totalDeduplicatedCount}</p>

          {filteredDivisions.length === 0 && (
            <p style={{ color: "var(--text-secondary)" }}>No registrations found.</p>
          )}

          {filteredDivisions.map(div => {
            const divisionRegs = divisionsMap[div];
            
            // Group by weight class within this division
            const weightClassMap: Record<string, any[]> = {};
            divisionRegs.forEach(reg => {
              if (!weightClassMap[reg.weight_class]) {
                weightClassMap[reg.weight_class] = [];
              }
              weightClassMap[reg.weight_class].push(reg);
            });

            const sortedWeights = Object.keys(weightClassMap).sort();

            return (
              <div key={div} style={{ marginBottom: "3rem" }}>
                <h2 style={{ 
                  color: "white", 
                  borderBottom: "2px solid var(--accent-primary)", 
                  paddingBottom: "0.5rem",
                  marginBottom: "1.5rem",
                  textTransform: "uppercase"
                }}>
                  {div} (Count: {divisionRegs.length})
                </h2>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "1.5rem"
                }}>
                  {sortedWeights.map(weight => {
                    const weightRegs = weightClassMap[weight];
                    return (
                      <div key={weight} className="weight-card" style={{ 
                        background: "rgba(0,0,0,0.2)", 
                        border: "1px solid var(--border-color)", 
                        borderRadius: "8px", 
                        padding: "1rem" 
                      }}>
                        <h3 style={{ color: "var(--accent-primary)", marginBottom: "1rem", fontSize: "1.1rem" }}>
                          Weight Class: {weight} <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginLeft: "0.5rem" }}>({weightRegs.length})</span>
                        </h3>
                        
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                              <th style={{ padding: "0.25rem 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Wrestler Name</th>
                              <th style={{ padding: "0.25rem 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>Team / Club</th>
                            </tr>
                          </thead>
                          <tbody>
                            {weightRegs.map(reg => (
                              <tr key={reg.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <td style={{ padding: "0.5rem 0", fontWeight: "bold", fontSize: "0.95rem" }}>
                                  {reg.wrestler.first_name} {reg.wrestler.last_name}
                                </td>
                                <td style={{ padding: "0.5rem 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                  {reg.wrestler.team || "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* --- PRINT LAYOUT (Alphabetical By Division, No Weights) --- */}
        <div id="print-layout" className="print-only">
          <h1 style={{ marginBottom: "0.5rem", textAlign: "center", textTransform: "uppercase" }}>{event.name}</h1>
          <p style={{ textAlign: "center", marginBottom: "2rem", fontSize: "1.2rem", fontWeight: "bold" }}>Registration Log (Total: {totalDeduplicatedCount})</p>

          {filteredDivisions.length === 0 && (
            <p>No registrations found.</p>
          )}

          {filteredDivisions.map(div => {
            const rawDivisionRegs = divisionsMap[div];
            
            // Deduplicate for PRINT ONLY: Each wrestler gets exactly one row per division, ignoring weight classes
            const printRegs: any[] = [];
            rawDivisionRegs.forEach(reg => {
              const exists = printRegs.some(existing => 
                existing.wrestler.id === reg.wrestler.id || 
                (existing.wrestler.first_name.trim().toLowerCase() === reg.wrestler.first_name.trim().toLowerCase() && 
                 existing.wrestler.last_name.trim().toLowerCase() === reg.wrestler.last_name.trim().toLowerCase())
              );
              if (!exists) {
                printRegs.push(reg);
              }
            });

            // Sort Alphabetically by First Name, then Last Name
            printRegs.sort((a, b) => {
              const nameA = `${a.wrestler.first_name} ${a.wrestler.last_name}`.toLowerCase();
              const nameB = `${b.wrestler.first_name} ${b.wrestler.last_name}`.toLowerCase();
              return nameA.localeCompare(nameB);
            });

            return (
              <div key={`print-${div}`} style={{ marginBottom: "3rem", breakInside: "avoid" }}>
                <h2 style={{ 
                  borderBottom: "2px solid black", 
                  paddingBottom: "0.5rem",
                  marginBottom: "1rem",
                  textTransform: "uppercase"
                }}>
                  {div} <span style={{fontSize: "1.2rem", fontWeight: "normal"}}>({printRegs.length} Wrestlers)</span>
                </h2>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
                      <th style={{ padding: "0.5rem 0", fontSize: "1.1rem" }}>Wrestler Name</th>
                      <th style={{ padding: "0.5rem 0", fontSize: "1.1rem" }}>Team / Club</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printRegs.map(reg => (
                      <tr key={`print-row-${reg.id}`} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "0.5rem 0", fontSize: "1.1rem" }}>
                          {reg.wrestler.first_name} {reg.wrestler.last_name}
                        </td>
                        <td style={{ padding: "0.5rem 0", fontSize: "1.1rem", color: "#555" }}>
                          {reg.wrestler.team || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

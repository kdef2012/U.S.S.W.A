"use client";

import { useState } from "react";
import { submitRegistration } from "@/app/actions/register";

const divisions = {
  "TOT": ["35", "40", "45", "50", "HWT"],
  "BANTAM": ["40", "45", "50", "55", "60", "65", "70", "HWT"],
  "ELEMENTARY": ["50", "55", "60", "65", "70", "75", "80", "85", "90", "95", "100", "105", "110", "115", "120", "125", "135", "145", "155", "HWT"],
  "MIDDLE SCHOOL": ["70", "75", "83", "90", "98", "106", "113", "120", "126", "132", "138", "145", "152", "160", "170", "182", "195", "220", "285"],
  "HIGH SCHOOL BOYS": ["106", "113", "120", "126", "132", "138", "144", "150", "157", "165", "175", "190", "215", "285"],
  "HIGH SCHOOL GIRLS": ["100", "107", "114", "120", "126", "132", "138", "145", "152", "165", "185", "220"],
  "OPEN": ["Madison System"]
};

type WrestlerEntry = {
  id: string;
  firstName: string;
  lastName: string;
  team: string;
  division: string;
  weight: string;
  doubleBracket: boolean;
  doubleDivision: string;
  doubleWeight: string;
  isOpen: boolean;
};

export default function RegistrationForm({ eventId, eventName, eventCost }: { eventId: string, eventName: string, eventCost: number }) {
  const [wrestlers, setWrestlers] = useState<WrestlerEntry[]>([
    { id: "1", firstName: "", lastName: "", team: "", division: "", weight: "", doubleBracket: false, doubleDivision: "", doubleWeight: "", isOpen: true }
  ]);
  const [waiverAgreed, setWaiverAgreed] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const updateWrestler = (id: string, field: keyof WrestlerEntry, value: any) => {
    setWrestlers(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  const removeWrestler = (id: string) => {
    if (wrestlers.length === 1) return;
    setWrestlers(prev => prev.filter(w => w.id !== id));
  };

  const addWrestler = () => {
    // Close others
    const closed = wrestlers.map(w => ({ ...w, isOpen: false }));
    setWrestlers([
      ...closed, 
      { id: Date.now().toString(), firstName: "", lastName: "", team: "", division: "", weight: "", doubleBracket: false, doubleDivision: "", doubleWeight: "", isOpen: true }
    ]);
  };

  const toggleAccordion = (id: string) => {
    setWrestlers(prev => prev.map(w => w.id === id ? { ...w, isOpen: !w.isOpen } : w));
  };

  const handleSubmit = async (formData: FormData) => {
    // Validation
    if (!waiverAgreed || !dataConsent) {
      alert("You must agree to the waiver and data consent to register.");
      return;
    }
    
    // Check if wrestlers are fully filled out
    for (const w of wrestlers) {
      if (!w.firstName || !w.lastName || !w.team || !w.division || !w.weight) {
        alert("Please fill out all required fields for each wrestler.");
        return;
      }
      if (w.doubleBracket && (!w.doubleDivision || !w.doubleWeight)) {
        alert("Please fill out the Double Bracket division and weight class for " + w.firstName);
        return;
      }
    }

    setIsSubmitting(true);
    formData.append("eventId", eventId);
    formData.append("eventName", eventName);
    formData.append("eventCost", eventCost.toString());
    formData.append("wrestlers", JSON.stringify(wrestlers));
    
    const result = await submitRegistration(formData);
    setIsSubmitting(false);
    
    if (result.success) {
      setSuccessMsg(`Successfully registered ${wrestlers.length} wrestler(s)! Check the dashboard.`);
    } else {
      alert(result.message);
    }
  };

  const calculateTotal = () => {
    return wrestlers.reduce((sum, w) => sum + eventCost + (w.doubleBracket ? 30 : 0), 0);
  };

  if (successMsg) {
    return (
      <div className="glass-card" style={{ padding: "3rem", textAlign: "center", border: "2px solid var(--accent-primary)" }}>
        <h2>Registration Complete!</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "1rem" }}>{successMsg}</p>
        <a href="/events" className="btn btn-primary" style={{ marginTop: "2rem" }}>Return to Events</a>
      </div>
    );
  }

  return (
    <form action={handleSubmit} style={{ display: "grid", gap: "2rem", maxWidth: "800px" }}>
      
      {/* Wrestlers List */}
      <div>
        <h3 style={{ marginBottom: "1rem", color: "var(--accent-primary)" }}>Wrestler Roster</h3>
        <div style={{ display: "grid", gap: "1rem" }}>
          {wrestlers.map((wrestler, index) => {
            const availableWeights = wrestler.division ? divisions[wrestler.division as keyof typeof divisions] : [];
            const availableDoubleWeights = wrestler.doubleDivision ? divisions[wrestler.doubleDivision as keyof typeof divisions] : [];
            const wrestlerCost = eventCost + (wrestler.doubleBracket ? 30 : 0);

            return (
              <div key={wrestler.id} className="glass-card" style={{ overflow: "hidden" }}>
                {/* Accordion Header */}
                <div 
                  onClick={() => toggleAccordion(wrestler.id)}
                  style={{ 
                    padding: "1.5rem", 
                    background: wrestler.isOpen ? "rgba(255,255,255,0.05)" : "transparent",
                    cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    borderBottom: wrestler.isOpen ? "1px solid var(--border-color)" : "none"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "var(--accent-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                      {index + 1}
                    </div>
                    <strong style={{ fontSize: "1.1rem" }}>
                      {wrestler.firstName || wrestler.lastName ? `${wrestler.firstName} ${wrestler.lastName}` : "New Wrestler"}
                    </strong>
                  </div>
                  <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                    <strong style={{ color: "var(--accent-primary)" }}>${wrestlerCost.toFixed(2)}</strong>
                    <span style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>
                      {wrestler.isOpen ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Accordion Body */}
                {wrestler.isOpen && (
                  <div style={{ padding: "1.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Wrestler First Name *</label>
                        <input type="text" value={wrestler.firstName} onChange={e => updateWrestler(wrestler.id, "firstName", e.target.value)} className="form-input" required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Wrestler Last Name *</label>
                        <input type="text" value={wrestler.lastName} onChange={e => updateWrestler(wrestler.id, "lastName", e.target.value)} className="form-input" required />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Team / Club *</label>
                      <input type="text" value={wrestler.team} onChange={e => updateWrestler(wrestler.id, "team", e.target.value)} className="form-input" required />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Division *</label>
                        <select className="form-input" value={wrestler.division} onChange={(e) => { updateWrestler(wrestler.id, "division", e.target.value); updateWrestler(wrestler.id, "weight", ""); }} required>
                          <option value="">Select...</option>
                          {Object.keys(divisions).map(div => <option key={div} value={div}>{div}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Weight Class *</label>
                        <select className="form-input" value={wrestler.weight} onChange={(e) => updateWrestler(wrestler.id, "weight", e.target.value)} required disabled={!wrestler.division}>
                          <option value="">Select...</option>
                          {availableWeights.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Double Bracket */}
                    <div style={{ background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", cursor: "pointer", fontWeight: "bold" }}>
                        <input 
                          type="checkbox" 
                          checked={wrestler.doubleBracket} 
                          onChange={(e) => {
                            updateWrestler(wrestler.id, "doubleBracket", e.target.checked);
                            if (!e.target.checked) {
                              updateWrestler(wrestler.id, "doubleDivision", "");
                              updateWrestler(wrestler.id, "doubleWeight", "");
                            }
                          }} 
                        />
                        <span>Add Double Bracket (+$30.00)</span>
                      </label>

                      {wrestler.doubleBracket && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1rem" }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">2nd Division *</label>
                            <select className="form-input" value={wrestler.doubleDivision} onChange={(e) => { updateWrestler(wrestler.id, "doubleDivision", e.target.value); updateWrestler(wrestler.id, "doubleWeight", ""); }} required>
                              <option value="">Select...</option>
                              {Object.keys(divisions).map(div => <option key={div} value={div}>{div}</option>)}
                            </select>
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">2nd Weight Class *</label>
                            <select className="form-input" value={wrestler.doubleWeight} onChange={(e) => updateWrestler(wrestler.id, "doubleWeight", e.target.value)} required disabled={!wrestler.doubleDivision}>
                              <option value="">Select...</option>
                              {availableDoubleWeights.map(w => <option key={w} value={w}>{w}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {wrestlers.length > 1 && (
                      <button type="button" onClick={() => removeWrestler(wrestler.id)} style={{ marginTop: "1rem", color: "var(--accent-secondary)", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem" }}>
                        Remove Wrestler
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <button type="button" onClick={addWrestler} className="btn btn-secondary" style={{ marginTop: "1rem", width: "100%", padding: "1rem", borderStyle: "dashed" }}>
          + Add Another Wrestler
        </button>
      </div>

      {/* Parent/Coach Info */}
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "var(--accent-primary)" }}>Parent/Guardian or Coach Info</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: "bold" }}>First Name *</label>
            <input type="text" name="parentFirstName" className="form-input" required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: "bold" }}>Last Name *</label>
            <input type="text" name="parentLastName" className="form-input" required />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address *</label>
            <input type="email" name="parentEmail" className="form-input" required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Mobile Phone *</label>
            <input type="tel" name="parentPhone" className="form-input" required />
          </div>
        </div>
      </div>

      {/* Liability Waiver */}
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "var(--accent-primary)" }}>Release of Liability</h3>
        <div style={{ 
          height: "150px", 
          overflowY: "auto", 
          padding: "1rem", 
          background: "rgba(0,0,0,0.3)", 
          border: "1px solid var(--border-color)", 
          borderRadius: "8px",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          marginBottom: "1rem",
          lineHeight: "1.4"
        }}>
          In consideration of my child being allowed to participate in any way in this and all other U.S.S.W.A related events and activities, the undersigned acknowledges, appreciates, and agrees that: The risks of injury and illness (ex: communicable diseases such as MRSA, ringworm, influenza, and COVID-19) to my child from the activities involved in these programs are significant, including the potential for permanent disability and death, and while particular rules, equipment, and personal discipline may reduce these risks, the risks of serious injury and illness do exist; and, 
          <br/><br/>
          1. FOR MYSELF, SPOUSE, AND CHILD, I KNOWINGLY AND FREELY ASSUME ALL SUCH RISKS, both known and unknown, EVEN IF ARISING FROM THE NEGLIGENCE OF THE RELEASEES or others, and assume full responsibility for my child’s participation; and, 
          <br/><br/>
          2. I willingly agree to comply with the program’s stated and customary terms and conditions for participation. If I observe any unusual significant concern in my child’s readiness for participation and/or in the program itself, I will remove my child from the participation and bring such attention to the nearest official immediately; and, 
          <br/><br/>
          3. I myself, my spouse, my child, and on behalf of my/our heirs, assigns, personal representatives and next of kin, HEREBY RELEASE AND HOLD HARMLESS U.S.S.W.A and its directors, officers, officials, agents, employees, volunteers, other participants, sponsoring agencies, sponsors, advertisers, and if applicable, owners and lessors of premises used to conduct the event (“Releasees”), WITH RESPECT TO ANY AND ALL INJURY, ILLNESS, DISABILITY, DEATH, or loss or damage to person or property incident to my child’s involvement or participation in these programs, WHETHER ARISING FROM THE NEGLIGENCE OF THE RELEASEES OR OTHERWISE, to the fullest extent permitted by law.
          <br/><br/>
          4. I, for myself, my spouse, my child, and on behalf of my/our heirs, assigns, personal representatives and next of kin, HEREBY INDEMNIFY AND HOLD HARMLESS all the above entities from any and all liabilities incident to my involvement or participation in these programs, EVEN IF ARISING FROM THEIR NEGLIGENCE, to the fullest extent permitted by law.
          <br/><br/>
          5. I, the parent/guardian, assert that I have explained to my child/ward: the risks of the activity, his/her responsibilities for adhering to the rules and regulations, and that my child/ward understands this agreement. I, FOR MYSELF, MY SPOUSE, AND CHILD/WARD, HAVE READ THIS RELEASE OF LIABILITY AND ASSUMPTION OF RISK AGREEMENT, FULLY UNDERSTAND ITS TERMS, UNDERSTAND THAT WE HAVE GIVEN UP SUBSTANTIAL RIGHTS BY SIGNING IT, AND SIGN IT FREELY AND VOLUNTARILY WITHOUT ANY INDUCEMENT.
        </div>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", cursor: "pointer", marginBottom: "1rem" }}>
          <input type="checkbox" style={{ marginTop: "0.25rem" }} checked={waiverAgreed} onChange={(e) => setWaiverAgreed(e.target.checked)} required />
          <span>I have read and agree to the U.S.S.W.A Release of Liability Waiver *</span>
        </label>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", cursor: "pointer" }}>
          <input type="checkbox" style={{ marginTop: "0.25rem" }} checked={dataConsent} onChange={(e) => setDataConsent(e.target.checked)} required />
          <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>I consent to my submitted data being collected and stored for Rolodex and Analytics purposes. *</span>
        </label>
      </div>

      {/* Booking Summary & Submit */}
      <div className="glass-card" style={{ padding: "1.5rem", border: "2px solid var(--accent-primary)" }}>
        <h3 style={{ marginBottom: "1rem" }}>Booking Summary</h3>
        
        <div style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
          {wrestlers.map((w, i) => (
            <div key={w.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>
              <span>Wrestler {i + 1} {w.doubleBracket ? "(w/ Double Bracket)" : ""}</span>
              <span>${(eventCost + (w.doubleBracket ? 30 : 0)).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.5rem", fontWeight: "bold", marginBottom: "2rem" }}>
          <span>Total Price</span>
          <span style={{ color: "var(--accent-primary)" }}>${calculateTotal().toFixed(2)}</span>
        </div>
        
        <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: "100%", fontSize: "1.2rem", padding: "1.25rem" }}>
          {isSubmitting ? "Processing..." : `Complete Registration for ${wrestlers.length} Wrestler(s)`}
        </button>
      </div>

    </form>
  );
}

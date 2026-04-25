import { notFound } from "next/navigation";
import RegistrationForm from "./RegistrationForm";
import { supabase } from "@/utils/supabase/client";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !event) {
    notFound();
  }

  const date = new Date(event.date || "2026-01-01").toLocaleDateString("en-US", {
    timeZone: 'UTC',
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container" style={{ marginTop: "3rem" }}>
      <div className="glass-card" style={{ padding: "3rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", color: "var(--accent-primary)" }}>{event.name}</h1>
          <div style={{ display: "flex", gap: "1.5rem", color: "var(--text-secondary)", fontSize: "1.1rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {date}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {event.location ? (
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", textDecorationStyle: "dotted" }}>
                    {event.location}
                  </a>
                ) : "Location TBA"}
            </span>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border-color)", margin: "2rem 0" }}></div>

        <div style={{ marginBottom: "2rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "1rem", fontSize: "1.5rem" }}>Event Details & Pricing</h2>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "1.5rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <ul style={{ listStyleType: "none", padding: 0, margin: 0, display: "grid", gap: "0.5rem" }}>
              <li><strong style={{ color: "var(--accent-primary)" }}>ENTRY FEE:</strong></li>
              <li>• ${event.cost || 35.00} for pre-registered wrestlers.</li>
              <li>• $30 for entering another division or weight.</li>
              <li>• $50 Walk-in fee</li>
              <li>• $10 Spectator fee</li>
              <li style={{ marginTop: "0.5rem", color: "var(--accent-secondary)", fontWeight: "bold" }}>Checks are not accepted.</li>
              <li style={{ marginTop: "0.5rem" }}>Wrestlers MUST be pre-registered by 5PM on April 24th.</li>
              <li>Final registration and weigh-ins are 8-9 AM the morning of the tournament.</li>
              <li>Wrestling will begin as close to 10 AM as we can get.</li>
            </ul>
          </div>
        </div>

        <div style={{ marginBottom: "3rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "1rem", fontSize: "1.5rem" }}>Divisions & Weight Classes</h2>
          <div style={{ background: "rgba(0,0,0,0.2)", padding: "1.5rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <ul style={{ paddingLeft: "1.2rem", margin: 0, display: "grid", gap: "0.75rem" }}>
              <li><strong>TOT (6 and 7 Years Old)</strong> – 35, 40, 45, 50, HWT</li>
              <li><strong>BANTAM (8 and 9 Years Old)</strong> – 40, 45, 50, 55, 60, 65, 70, HWT</li>
              <li><strong>ELEMENTARY (grades 4/5/6)</strong> (13-year-olds must compete in middle school) – 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 135, 145, 155, HWT</li>
              <li><strong>MIDDLE SCHOOL (grades 7/8/9)</strong> (16-year-olds must compete in high school) – 70, 75, 83, 90, 98, 106, 113, 120, 126, 132, 138, 145, 152, 160, 170, 182, 195, 220, 285</li>
              <li><strong>HIGH SCHOOL BOYS (grades 9/10/11/12)</strong> (19 or older must compete in college/open) – 106, 113, 120, 126, 132, 138, 144, 150, 157, 165, 175, 190, 215, 285</li>
              <li><strong>HIGH SCHOOL GIRLS (grades 9/10/11/12)</strong> - 100, 107, 114, 120, 126, 132, 138, 145, 152, 165, 185, 220</li>
              <li><strong>OPEN (Out of high school)</strong> – Madison System</li>
            </ul>
            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(255, 59, 48, 0.1)", borderRadius: "6px", border: "1px solid rgba(255, 59, 48, 0.3)" }}>
              <strong style={{ color: "var(--accent-secondary)" }}>TENTHS WILL BE DROPPED, BUT THAT IS ONLY WEIGHT ALLOWANCE!</strong><br />
              <span style={{ fontSize: "0.9rem" }}>Tournament Director reserves the right to combine weight classes if necessary.</span>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
          <div>
            <h2 style={{ marginBottom: "1.5rem" }}>Register Now</h2>
            <RegistrationForm eventId={event.id} eventName={event.name} eventCost={event.cost || 35.00} />
          </div>
        </div>
      </div>
    </div>
  );
}

import { supabase } from "@/utils/supabase/client";

export default async function Home() {
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch upcoming events from Supabase
  const { data: eventsData, error } = await supabase
    .from('events')
    .select('*')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(6);

  const featuredEvents = eventsData || [];

  // Fetch all registrations and wrestlers for live counts
  const { data: registrations } = await supabase.from('registrations').select('event_id, division, weight_class, wrestler_id');
  const { data: wrestlers } = await supabase.from('wrestlers').select('id, first_name, last_name');

  const getEventCount = (eventId: string) => {
    const eventRegs = (registrations || []).filter(r => r.event_id === eventId && r.division !== "Multiple Attendees");
    
    const divisionsMap: Record<string, any[]> = {};
    eventRegs.forEach(reg => {
      const wrestler = (wrestlers || []).find(w => w.id === reg.wrestler_id);
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
    <div>
      <section className="hero">
        <div className="container animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h1>Welcome to U.S.S.W.A</h1>
          <p className="hero-subtitle">
            We offer modified scholastic-style wrestling tournaments at centrally located venues in North Carolina.
          </p>
          <a href="/events" className="btn btn-primary" style={{ marginBottom: "2.5rem" }}>
            View All Tournaments
          </a>
          
          <div style={{
            background: "rgba(220, 38, 38, 0.1)",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            color: "#fca5a5",
            padding: "1rem 1.5rem",
            borderRadius: "8px",
            maxWidth: "700px",
            fontSize: "0.95rem",
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(220, 38, 38, 0.05)"
          }}>
            <strong style={{ display: "block", marginBottom: "0.25rem", color: "#f87171", fontSize: "1.05rem" }}>⚠️ Important Notice for Coaches</strong>
            All coaches are required to submit a background check for coaching band and mat access. No exceptions! Coaching cards from other organizations are NOT accepted in lieu of this requirement. On staff coaches at a high school or middle school as verified by the school are exempted from this requirement. Email mauriceatwood@aol.com if you have any questions.
          </div>
        </div>
      </section>

      <section className="container">
        <h2>Featured Tournaments</h2>
        <div className="event-grid">
          {featuredEvents.map((event) => {
            const count = getEventCount(event.id);
            return (
            <div className="glass-card" key={event.id} style={{ '--card-bg-image': event.image_url ? `url(${event.image_url})` : undefined } as React.CSSProperties}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <span className="event-date">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
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
              <h3>{event.name}</h3>
              <div className="event-location">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {event.location ? (
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", textDecorationStyle: "dotted" }}>
                    {event.location}
                  </a>
                ) : 'Location TBA'}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <a href={`/events/${event.id}`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
                  Register Now
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
            );
          })}
        </div>
      </section>
    </div>
  );
}

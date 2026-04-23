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

  return (
    <div>
      <section className="hero">
        <div className="container animate-fade-in">
          <h1>Welcome to U.S.S.W.A</h1>
          <p className="hero-subtitle">
            We offer modified scholastic-style wrestling tournaments at centrally located venues in North Carolina.
          </p>
          <a href="/events" className="btn btn-primary">
            View All Tournaments
          </a>
        </div>
      </section>

      <section className="container">
        <h2>Featured Tournaments</h2>
        <div className="event-grid">
          {featuredEvents.map((event) => (
            <div className="glass-card" key={event.id} style={{ '--card-bg-image': event.image_url ? `url(${event.image_url})` : undefined } as React.CSSProperties}>
              <span className="event-date">
                {new Date(event.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }).toUpperCase()}
              </span>
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
              <a href={`/events/${event.id}`} className="btn btn-secondary" style={{ width: '100%' }}>
                Register Now
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

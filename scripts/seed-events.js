const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const eventsPath = path.join(__dirname, '..', 'src', 'data', 'events.json');
const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

async function seed() {
  console.log(`Found ${eventsData.length} events to seed.`);
  
  for (const event of eventsData) {
    let dateStr = event.startDate || "2026-01-01";
    
    let locationStr = "TBA";
    if (event.location && event.location.name) {
      locationStr = `${event.location.name}, ${event.location.town}, ${event.location.state}`;
    } else if (typeof event.location === 'string') {
      locationStr = event.location;
    }

    const { data, error } = await supabase.from('events').insert({
      name: event.title,
      date: dateStr,
      location: locationStr,
      image_url: event.imageUrl || null
    });
    
    if (error) {
      console.error(`Failed to insert ${event.title}:`, error);
    } else {
      console.log(`Inserted ${event.title}`);
    }
  }
  
  console.log("Seeding complete.");
}

seed();

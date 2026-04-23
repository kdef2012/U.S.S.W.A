const fs = require('fs');
const path = require('path');

const xmlFilePath = 'C:\\Users\\kdnelson\\Downloads\\usswa.WordPress.2026-04-22.xml';
const xmlContent = fs.readFileSync(xmlFilePath, 'utf8');

const parseXmlString = (xml, tag) => {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'g');
  const matches = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1]);
  }
  return matches;
};

const items = parseXmlString(xmlContent, 'item');

const locations = {};
const events = [];

items.forEach(item => {
  const isPostType = (type) => item.includes(`<wp:post_type><![CDATA[${type}]]></wp:post_type>`);
  
  if (isPostType('location')) {
    const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
    const postmeta = parseXmlString(item, 'wp:postmeta');
    
    let id = null, state = '', town = '', address = '';
    
    postmeta.forEach(meta => {
      const keyMatch = meta.match(/<wp:meta_key><!\[CDATA\[(.*?)\]\]><\/wp:meta_key>/);
      const valMatch = meta.match(/<wp:meta_value><!\[CDATA\[([\s\S]*?)\]\]><\/wp:meta_value>/);
      
      if (keyMatch && valMatch) {
        const key = keyMatch[1];
        const val = valMatch[1];
        if (key === '_location_id') id = val;
        if (key === '_location_state') state = val;
        if (key === '_location_town') town = val;
        if (key === '_location_address') address = val;
      }
    });
    
    if (id) {
      locations[id] = {
        name: titleMatch ? titleMatch[1] : 'Unknown Location',
        address,
        town,
        state
      };
    }
  }
  
  if (isPostType('event')) {
    const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
    const slugMatch = item.match(/<wp:post_name><!\[CDATA\[(.*?)\]\]><\/wp:post_name>/);
    const postmeta = parseXmlString(item, 'wp:postmeta');
    
    let locId = null, startDate = '', endDate = '';
    
    postmeta.forEach(meta => {
      const keyMatch = meta.match(/<wp:meta_key><!\[CDATA\[(.*?)\]\]><\/wp:meta_key>/);
      const valMatch = meta.match(/<wp:meta_value><!\[CDATA\[([\s\S]*?)\]\]><\/wp:meta_value>/);
      
      if (keyMatch && valMatch) {
        const key = keyMatch[1];
        const val = valMatch[1];
        if (key === '_location_id') locId = val;
        if (key === '_event_start_date') startDate = val;
        if (key === '_event_end_date') endDate = val;
      }
    });
    
    if (titleMatch) {
      events.push({
        title: titleMatch[1],
        slug: slugMatch ? slugMatch[1] : titleMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        locationId: locId,
        startDate,
        endDate
      });
    }
  }
});

// Map locations to events
const finalEvents = events.map(e => ({
  ...e,
  location: e.locationId ? locations[e.locationId] : null
})).filter(e => e.startDate !== ''); // Only keep events with dates

// Sort by date descending
finalEvents.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

const outputPath = path.join(__dirname, '..', 'src', 'data', 'events.json');
fs.writeFileSync(outputPath, JSON.stringify(finalEvents, null, 2));

console.log(`Extracted ${finalEvents.length} events and saved to ${outputPath}`);

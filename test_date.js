const dStr1 = "2026-05-15T21:00:00"; // No Z
const dStr2 = "2026-05-15T21:00:00Z"; // With Z

const formatForInput = (dateString) => {
  const date = new Date(dateString);
  const tzString = date.toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  return tzString;
};

console.log("No Z: ", formatForInput(dStr1));
console.log("With Z: ", formatForInput(dStr2));

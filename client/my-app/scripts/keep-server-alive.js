const fetch = require('node-fetch');
const url = 'https://licenta2025.onrender.com/';
const intervalMinutes = 5;
const intervalMs = intervalMinutes * 60 * 1000;

console.log(`Starting server keep-alive script.`);
console.log(`Will ping ${url} every ${intervalMinutes} minutes.`);

// Funcția care face request-ul
async function pingServer() {
  const timestamp = new Date().toLocaleTimeString();
  try {
    const response = await fetch(url);
    const data = await response.text();
    console.log(`[${timestamp}] Server ping successful: ${response.status}`);
  } catch (error) {
    console.error(`[${timestamp}] Error pinging server:`, error.message);
  }
}

// Ping imediat la pornire
pingServer();

// Setează un interval pentru ping-uri periodice
setInterval(pingServer, intervalMs);

console.log(`Script running. Press Ctrl+C to stop.`); 
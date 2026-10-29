const http = require('http');

const HEALTH_URL = process.env.HEALTH_URL || 'http://localhost:3000/health';
const INTERVAL = parseInt(process.env.CHECK_INTERVAL) || 30000;

function checkHealth() {
  const start = Date.now();
  
  http.get(HEALTH_URL, (res) => {
    const duration = Date.now() - start;
    
    if (res.statusCode === 200) {
      console.log(`[${new Date().toISOString()}] HEALTHY - ${duration}ms`);
    } else {
      console.error(`[${new Date().toISOString()}] UNHEALTHY - Status: ${res.statusCode}`);
    }
  }).on('error', (err) => {
    console.error(`[${new Date().toISOString()}] ERROR - ${err.message}`);
  });
}

console.log(`Starting health checks every ${INTERVAL}ms`);
setInterval(checkHealth, INTERVAL);
checkHealth();
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CONCURRENCY = parseInt(process.env.CONCURRENCY) || 10;
const DURATION = parseInt(process.env.DURATION) || 10;

let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let responseTimes = [];

async function makeRequest() {
  const start = Date.now();
  
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/health`, (res) => {
      const duration = Date.now() - start;
      responseTimes.push(duration);
      
      if (res.statusCode === 200) {
        successfulRequests++;
      } else {
        failedRequests++;
      }
      
      totalRequests++;
      resolve();
    });
    
    req.on('error', () => {
      failedRequests++;
      totalRequests++;
      resolve();
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      failedRequests++;
      totalRequests++;
      resolve();
    });
  });
}

async function runLoadTest() {
  console.log(`Starting load test: ${CONCURRENCY} concurrent requests for ${DURATION} seconds`);
  console.log(`Target: ${BASE_URL}`);
  
  const endTime = Date.now() + (DURATION * 1000);
  
  while (Date.now() < endTime) {
    const promises = [];
    for (let i = 0; i < CONCURRENCY; i++) {
      promises.push(makeRequest());
    }
    await Promise.all(promises);
  }
  
  responseTimes.sort((a, b) => a - b);
  const p50 = responseTimes[Math.floor(responseTimes.length * 0.50)];
  const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
  const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];
  const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  
  console.log('\n=== Load Test Results ===');
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful: ${successfulRequests}`);
  console.log(`Failed: ${failedRequests}`);
  console.log(`Success Rate: ${((successfulRequests / totalRequests) * 100).toFixed(2)}%`);
  console.log(`Duration: ${DURATION}s`);
  console.log(`Throughput: ${(totalRequests / DURATION).toFixed(2)} req/s`);
  console.log(`Avg Response Time: ${avg.toFixed(2)}ms`);
  console.log(`P50 Response Time: ${p50}ms`);
  console.log(`P95 Response Time: ${p95}ms`);
  console.log(`P99 Response Time: ${p99}ms`);
}

runLoadTest().catch(console.error);
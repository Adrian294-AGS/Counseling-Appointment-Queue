const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

function formatLog(level, message, context = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  return JSON.stringify(entry);
}

function log(level, message, context) {
  if (LOG_LEVELS[level] > currentLevel) return;
  const formatted = formatLog(level, message, context);
  console.log(formatted);
  
  if (process.env.NODE_ENV === 'production') {
    const logDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, 'app.log'), formatted + '\n');
  }
}

module.exports = {
  error: (msg, ctx) => log('ERROR', msg, ctx),
  warn: (msg, ctx) => log('WARN', msg, ctx),
  info: (msg, ctx) => log('INFO', msg, ctx),
  debug: (msg, ctx) => log('DEBUG', msg, ctx),
};
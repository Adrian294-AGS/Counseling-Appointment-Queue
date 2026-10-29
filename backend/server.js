const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/app');
const logger = require('./middleware/logger');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim(), { source: 'http' }) },
}));

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`, { env: config.nodeEnv });
  });
}

module.exports = app;
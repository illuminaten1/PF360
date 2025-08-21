require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const winston = require('winston');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const demandeRoutes = require('./routes/demandes');
const dossierRoutes = require('./routes/dossiers');
const decisionRoutes = require('./routes/decisions');
const conventionRoutes = require('./routes/conventions');
const paiementRoutes = require('./routes/paiements');
const avocatRoutes = require('./routes/avocats');
const sgamiRoutes = require('./routes/sgami');
const badgeRoutes = require('./routes/badges');
const pceRoutes = require('./routes/pce');
const gradeRoutes = require('./routes/grades');
const visaRoutes = require('./routes/visa');
const diligenceRoutes = require('./routes/diligence');
const logRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 3001;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/demandes', demandeRoutes);
app.use('/api/dossiers', dossierRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/conventions', conventionRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/avocats', avocatRoutes);
app.use('/api/sgami', sgamiRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/pce', pceRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/visa', visaRoutes);
app.use('/api/diligences', diligenceRoutes);
app.use('/api/logs', logRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
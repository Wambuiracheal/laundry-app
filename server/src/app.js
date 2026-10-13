const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { createSessionStore, publishEvent } = require('./utils/redis');

const serviceRoutes = require('./routes/services');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const orderItemRoutes = require('./routes/order-items');
const paymentRoutes = require('./routes/payments');
const mpesaRoutes = require('./routes/mpesa');
const riderRoutes = require('./routes/riders');
const settingsRoutes = require('./routes/settings');
const trackingRoutes = require('./routes/tracking');
const transactionRoutes = require('./routes/transactions');
const orderStatusHistoryRoutes = require('./routes/order-status-history');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const actionsRoutes = require('./routes/actions');

const app = express();

// Behind Render's proxy in production: trust it so req.ip and secure cookies reflect the client.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CLIENT_URL: comma-separated origins allowed to call the API (e.g. the Netlify site).
// Left unset (local development), any origin is allowed.
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));
app.use(express.json());

// Sessions need Redis. No route reads req.session today (auth uses bearer tokens), so without
// Redis the middleware is simply skipped.
const sessionStore = createSessionStore();
if (sessionStore) app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'dev-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 2,
  },
}));

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/order-items', orderItemRoutes);
app.use('/api/payments/mpesa', mpesaRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/riders', riderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/order-status-history', orderStatusHistoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/actions', actionsRoutes);

app.get('/', (req, res) => {
  res.send('Laundry API is running!');
});

app.post('/api/redis/publish', async (req, res) => {
  try {
    const { channel = 'laundry-events', message } = req.body;
    const published = await publishEvent(channel, {
      message,
      timestamp: new Date().toISOString(),
    });

    res.json({ published, channel });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to publish Redis event',
      details: error.message,
    });
  }
});

module.exports = app;

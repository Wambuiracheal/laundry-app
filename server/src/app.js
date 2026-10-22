const express = require('express');
const cors = require('cors');

const serviceRoutes = require('./routes/services');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const mpesaRoutes = require('./routes/mpesa');
const riderRoutes = require('./routes/riders');
const settingsRoutes = require('./routes/settings');
const trackingRoutes = require('./routes/tracking');
const actionsRoutes = require('./routes/actions');
const notificationRoutes = require('./routes/notifications');

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

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments/mpesa', mpesaRoutes);
app.use('/api/riders', riderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/actions', actionsRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('Laundry API is running!');
});

module.exports = app;

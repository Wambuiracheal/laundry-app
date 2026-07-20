const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { createSessionStore, publishEvent } = require('./utils/redis');

const serviceRoutes = require('./routes/services');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const orderItemRoutes = require('./routes/order-items');
const paymentRoutes = require('./routes/payments');
const transactionRoutes = require('./routes/transactions');
const orderStatusHistoryRoutes = require('./routes/order-status-history');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');

const app = express();

app.use(cors());
app.use(express.json());

// Synchronous configuration
// We pass the store directly, assuming the client is initialized in server.js
app.use(session({
  store: createSessionStore(),
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
app.use('/api/payments', paymentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/order-status-history', orderStatusHistoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);

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

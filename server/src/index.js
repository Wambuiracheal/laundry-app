const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { initRedis, createSessionStore, publishEvent } = require('./lib/redis');
require('dotenv').config();


// ROUTES
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
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

(async () => {
  try {
    const redisClient = await initRedis();
    if (redisClient) {
      app.use(session({
        store: createSessionStore(),
        secret: process.env.SESSION_SECRET || 'dev-session-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: false,
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 2,
        },
      }));
    }
  } catch (error) {
    console.warn('Session middleware setup skipped:', error.message);
  }
})();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/order-items', orderItemRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/order-status-history', orderStatusHistoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/', (req, res) => {
  res.send("Laundry API is running!");
});

app.post('/api/redis/publish', async (req, res) => {
  try {
    const { channel = 'laundry-events', message } = req.body;
    const published = await publishEvent(channel, { message, timestamp: new Date().toISOString() });
    res.json({ published, channel });
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish Redis event', details: error.message });
  }
});

const PORT = process.env.BE_PORT || 5000;

async function startServer() {
  try {
    console.log("Connecting to database...");
    await prisma.$connect();
    console.log("✅ Database connected successfully!");
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Laundry Backend is ACTIVE and listening on http://localhost:${PORT}`);
      console.log("Press Ctrl+C to stop.");
    });

    // Keep the process alive explicitly
    setInterval(() => {
      // Heartbeat to keep event loop active
    }, 1000 * 60 * 60);

  } catch (error) {
    console.error("❌ Server failed to start:");
    console.error(error.message);
    console.log("\nTIP: Make sure MySQL is running ('sudo service mysql start') and credentials in .env are correct.");
    process.exit(1);
  }
}

startServer();
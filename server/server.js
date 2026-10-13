require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { initRedis } = require('./src/utils/redis');

const prisma = new PrismaClient();
// Render (and most hosts) assign the port through PORT; BE_PORT is the local/Docker setting.
const PORT = process.env.PORT || process.env.BE_PORT || 5000;

async function startServer() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Database connected successfully!');

    console.log('Connecting to Redis...');
    await initRedis();

    // Load app after Redis init so session store can be created.
    const app = require('./src/app');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Laundry backend is listening on http://localhost:${PORT}`);
      console.log('Press Ctrl+C to stop.');
    });
  } catch (error) {
    console.error('Server failed to start:');
    console.error(error.message);
    console.log('TIP: Ensure PostgreSQL is reachable and DATABASE_URL in .env is correct.');
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
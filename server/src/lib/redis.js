const { createClient } = require('redis');
const RedisStore = require('connect-redis').default || require('connect-redis');

let redisClient = null;
let subscriberClient = null;
let redisReady = false;

// Initialize Redis client and subscriber
async function initRedis() {
  if (redisClient) {
    return redisClient;
  }

// Check for Redis configuration in environment variables
  const redisUrl = process.env.REDIS_URL || null;
  const redisHost = process.env.REDIS_HOST;
  const redisPort = Number(process.env.REDIS_PORT);

//  IF Redis URL is provided, use it; otherwise, use host and port
  redisClient = createClient({
    url: redisUrl,
    socket: {
      host: redisHost,
      port: redisPort,
    },
  });

//   Handle Redis client events

  redisClient.on('error', (err) => {
    console.error('Redis client error:', err.message);
    redisReady = false;
  });

  redisClient.on('connect', () => {
    console.log('Redis client connecting...');
  });

  redisClient.on('ready', () => {
    redisReady = true;
    console.log('Redis client ready');
  });

//   Connect to Redis server
  try {
    await redisClient.connect();

    // Subscribe to a test channel to verify Redis is working
  } catch (error) {
    console.warn('Redis unavailable, continuing without cache:', error.message);
    redisReady = false;
  }

  if (redisReady) {
    subscriberClient = redisClient.duplicate();
    subscriberClient.on('error', (err) => {
      console.error('Redis subscriber error:', err.message);
    });

    try {
      await subscriberClient.connect();
      await subscriberClient.subscribe('laundry-events', (message) => {
        console.log('[Redis event]', message);
      });
    } catch (error) {
      console.warn('Redis subscriber unavailable:', error.message);
    }
  }

  return redisClient;
}

async function getRedisClient() {
  if (!redisClient) {
    await initRedis();
  }
  return redisClient;
}

function createSessionStore() {
  if (!redisClient) {
    throw new Error('Redis client has not been initialized yet');
  }

  return new RedisStore({
    client: redisClient,
    prefix: 'laundry:sess:',
  });
}

async function cacheValue(key, value, ttlSeconds = 300) {
  try {
    const client = await getRedisClient();
    if (!redisReady || !client) {
      return false;
    }

    await client.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('Redis cache write failed:', error.message);
    return false;
  }
}

async function getCachedValue(key) {
  try {
    const client = await getRedisClient();
    if (!redisReady || !client) {
      return null;
    }

    const raw = await client.get(key);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.warn('Redis cache read failed:', error.message);
    return null;
  }
}

async function deleteCacheValue(key) {
  try {
    const client = await getRedisClient();
    if (!redisReady || !client) {
      return false;
    }

    await client.del(key);
    return true;
  } catch (error) {
    console.warn('Redis cache delete failed:', error.message);
    return false;
  }
}

async function publishEvent(channel, payload) {
  try {
    const client = await getRedisClient();
    if (!redisReady || !client) {
      return false;
    }

    await client.publish(channel, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.warn('Redis publish failed:', error.message);
    return false;
  }
}

module.exports = {
  initRedis,
  getRedisClient,
  createSessionStore,
  cacheValue,
  getCachedValue,
  deleteCacheValue,
  publishEvent,
};

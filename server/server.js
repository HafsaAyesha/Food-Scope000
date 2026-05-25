require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const app = require('./src/app')
const { connectRedis } = require('./src/services/redis.service');

const connectDB = require('./src/database/connection');
connectDB();
connectRedis().catch((error) => {
  console.warn('Redis connection failed, geo caching will use in-memory fallback:', error.message);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`The server is running on ${PORT}`);
});

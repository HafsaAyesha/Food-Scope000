const path = require('path');
const dotenv = require('dotenv');
const Joi = require('joi');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  MONGO_URI: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().required(),
  FRONTEND_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
  REFRESH_TOKEN_COOKIE_NAME: Joi.string().default('foodscope_refresh_token'),
  COOKIE_SAME_SITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),
  COOKIE_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),
  COOKIE_DOMAIN: Joi.string().optional(),
  COOKIE_SECRET: Joi.string().min(32).required(),
  MAIL_HOST: Joi.string().required(),
  GEO_MAX_RADIUS_KM: Joi.number().min(1).max(50).default(50),
  GEO_MIN_RADIUS_KM: Joi.number().min(0.1).max(5).default(0.1),
  GEO_DEFAULT_RADIUS_KM: Joi.number().min(0.1).max(50).default(5),
  GEO_NEARBY_CACHE_TTL_SECONDS: Joi.number().integer().min(30).default(90),
  GEO_IP_CACHE_TTL_SECONDS: Joi.number().integer().min(60).default(900),
  GEO_REVERSE_CACHE_TTL_SECONDS: Joi.number().integer().min(300).default(3600),
  GEO_PROVIDER_URL: Joi.string().uri().default('https://nominatim.openstreetmap.org'),
  IP_GEOLOCATION_URL: Joi.string().uri().default('https://ipapi.co'),
  MAIL_PORT: Joi.number().required(),
  MAIL_USER: Joi.string().required(),
  MAIL_PASS: Joi.string().required(),
  MAIL_FROM: Joi.string().email().required(),
  AUTH_TOKEN_LENGTH: Joi.number().integer().min(32).default(48)
}).unknown(true);

const { value: env, error } = schema.validate(process.env, { abortEarly: false, convert: true });

if (error) {
  console.error('Environment validation failed:');
  error.details.forEach((detail) => console.error(`  - ${detail.message}`));
  process.exit(1);
}

const config = {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  MONGO_URI: env.MONGO_URI,
  REDIS_URL: env.REDIS_URL,
  FRONTEND_URL: env.FRONTEND_URL,
  JWT_SECRET: env.JWT_SECRET,
  JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRATION: env.JWT_ACCESS_EXPIRATION,
  JWT_REFRESH_EXPIRATION: env.JWT_REFRESH_EXPIRATION,
  REFRESH_TOKEN_COOKIE_NAME: env.REFRESH_TOKEN_COOKIE_NAME,
  COOKIE_SAME_SITE: env.COOKIE_SAME_SITE,
  COOKIE_SECURE: env.COOKIE_SECURE || env.NODE_ENV === 'production',
  COOKIE_DOMAIN: env.COOKIE_DOMAIN || undefined,
  COOKIE_SECRET: env.COOKIE_SECRET,
  MAIL_HOST: env.MAIL_HOST,
  MAIL_PORT: env.MAIL_PORT,
  MAIL_USER: env.MAIL_USER,
  MAIL_PASS: env.MAIL_PASS,
  MAIL_FROM: env.MAIL_FROM,
  AUTH_TOKEN_LENGTH: env.AUTH_TOKEN_LENGTH,
  GEO_MAX_RADIUS_KM: env.GEO_MAX_RADIUS_KM,
  GEO_MIN_RADIUS_KM: env.GEO_MIN_RADIUS_KM,
  GEO_DEFAULT_RADIUS_KM: env.GEO_DEFAULT_RADIUS_KM,
  GEO_NEARBY_CACHE_TTL_SECONDS: env.GEO_NEARBY_CACHE_TTL_SECONDS,
  GEO_IP_CACHE_TTL_SECONDS: env.GEO_IP_CACHE_TTL_SECONDS,
  GEO_REVERSE_CACHE_TTL_SECONDS: env.GEO_REVERSE_CACHE_TTL_SECONDS,
  GEO_PROVIDER_URL: env.GEO_PROVIDER_URL,
  IP_GEOLOCATION_URL: env.IP_GEOLOCATION_URL
};

module.exports = config;

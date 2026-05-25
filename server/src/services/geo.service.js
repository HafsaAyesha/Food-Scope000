const { URL } = require('url');
const Restaurant = require('../models/restaurant.model');
const cacheService = require('./cache.service');
const config = require('../config');
const { createApiError } = require('../utils/api-error');

const GEO_NEARBY_TTL = config.GEO_NEARBY_CACHE_TTL_SECONDS;
const GEO_IP_TTL = config.GEO_IP_CACHE_TTL_SECONDS;
const GEO_REVERSE_TTL = config.GEO_REVERSE_CACHE_TTL_SECONDS;
const GEO_RESOLVE_TTL = config.GEO_REVERSE_TTL;
const PROVIDER_BASE = config.GEO_PROVIDER_URL;
const IP_PROVIDER_BASE = config.IP_GEOLOCATION_URL;

const clampRadiusKm = (radius) => {
  const parsed = Number(radius);
  if (Number.isNaN(parsed)) throw createApiError(400, 'GEO_INVALID_RADIUS', 'VALIDATION_ERROR', 'radius must be a number.');
  if (parsed < config.GEO_MIN_RADIUS_KM) throw createApiError(422, 'GEO_RADIUS_TOO_SMALL', 'VALIDATION_ERROR', `Minimum radius is ${config.GEO_MIN_RADIUS_KM} km.`);
  if (parsed > config.GEO_MAX_RADIUS_KM) throw createApiError(422, 'GEO_RADIUS_EXCEEDED', 'VALIDATION_ERROR', `Maximum radius is ${config.GEO_MAX_RADIUS_KM} km.`);
  return parsed;
};

const normalizeCoordinates = (lat, lng) => {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  if (
    Number.isNaN(parsedLat) ||
    Number.isNaN(parsedLng) ||
    parsedLat < -90 ||
    parsedLat > 90 ||
    parsedLng < -180 ||
    parsedLng > 180
  ) {
    throw createApiError(422, 'GEO_INVALID_COORDINATES', 'VALIDATION_ERROR', 'Invalid latitude or longitude values.');
  }
  return { lat: parsedLat, lng: parsedLng };
};

const buildCacheKey = ({ type, lat, lng, radius, page, limit, cluster, query }) => {
  const normalized = [type, lat, lng, radius, page, limit, cluster, query].filter((value) => value !== undefined && value !== null);
  return `geo:${normalized.join(':')}`;
};

const safeNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toApiLocation = ({ coordinates = [] }) => ({
  lat: coordinates[1],
  lng: coordinates[0]
});

const coordinateBuckets = (latitude, longitude, clusterResolutionMeters) => {
  const metersPerDegreeLat = 111_000;
  const latStep = clusterResolutionMeters / metersPerDegreeLat;
  const lngStep = clusterResolutionMeters / Math.max(1, Math.cos((latitude * Math.PI) / 180) * metersPerDegreeLat);
  return {
    latBucket: Math.floor(latitude / latStep),
    lngBucket: Math.floor(longitude / lngStep)
  };
};

const httpGetJson = async (url, headers = {}) => {
  if (typeof fetch === 'function') {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  const https = require('https');
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        try {
          resolve(JSON.parse(raw));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
};

const getNearByRestaurants = async ({ lat, lng, radiusKm, page = 1, limit = 20, cluster = false, clusterResolutionMeters = 800 }) => {
  const cacheKey = buildCacheKey({ type: 'nearby', lat, lng, radius: radiusKm, page, limit, cluster, clusterResolutionMeters });
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const radiusMeters = radiusKm * 1000;
  const skip = Math.max(0, page - 1) * limit;
  const distanceField = 'distance_meters';
  const gridSize = Math.max(200, Number(clusterResolutionMeters));

  const geoNearStage = {
    $geoNear: {
      near: { type: 'Point', coordinates: [lng, lat] },
      distanceField,
      key: 'location',
      maxDistance: radiusMeters,
      spherical: true,
      query: { status: 'approved' }
    }
  };

  const addFieldsStage = {
    $addFields: {
      distance_km: { $divide: [`$${distanceField}`, 1000] },
      lat: { $arrayElemAt: ['$location.coordinates', 1] },
      lng: { $arrayElemAt: ['$location.coordinates', 0] }
    }
  };

  const clusterPipeline = [
    {
      $group: {
        _id: {
          latBucket: {
            $floor: { $divide: ['$lat', gridSize / 111000] }
          },
          lngBucket: {
            $floor: { $divide: ['$lng', gridSize / 111000] }
          }
        },
        count: { $sum: 1 },
        avg_lat: { $avg: '$lat' },
        avg_lng: { $avg: '$lng' },
        min_distance_km: { $min: '$distance_km' }
      }
    },
    {
      $project: {
        _id: 0,
        count: 1,
        center: { lat: '$avg_lat', lng: '$avg_lng' },
        distance_km: '$min_distance_km'
      }
    },
    { $sort: { distance_km: 1 } },
    { $limit: 50 }
  ];

  const pipeline = [geoNearStage, addFieldsStage];

  const facet = {
    restaurants: [
      { $sort: { distance_meters: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          name: 1,
          avg_rating: 1,
          address: 1,
          thumbnail: 1,
          location: 1,
          distance_km: { $round: ['$distance_km', 2] }
        }
      }
    ],
    total: [ { $count: 'count' } ]
  };

  if (cluster) {
    facet.clusters = clusterPipeline;
  }

  pipeline.push({ $facet: facet });

  const [aggregateResult] = await Restaurant.aggregate(pipeline);

  const total = (aggregateResult.total[0] && aggregateResult.total[0].count) || 0;
  const restaurants = (aggregateResult.restaurants || []).map((r) => ({
    id: r._id,
    name: r.name,
    avg_rating: r.avg_rating,
    address: r.address,
    distance_km: Number(r.distance_km.toFixed(2)),
    lat: r.location?.coordinates?.[1],
    lng: r.location?.coordinates?.[0]
  }));

  const response = {
    restaurants,
    total,
    page,
    limit,
    cluster_resolution_meters: gridSize,
    clusters: aggregateResult.clusters || []
  };

  await cacheService.set(cacheKey, response, GEO_NEARBY_TTL);
  return response;
};

const getIpLocation = async (req) => {
  const ip = String((req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.ip || '').split(',')[0] || '').trim();
  if (!ip || ip.startsWith('127.') || ip.startsWith('::1') || ip === 'localhost') {
    throw createApiError(422, 'GEO_IP_FALLBACK_UNAVAILABLE', 'GEO_FALLBACK_ERROR', 'Unable to derive approximate location from local IP.');
  }

  const cacheKey = buildCacheKey({ type: 'ip', query: ip });
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const url = new URL(`${IP_PROVIDER_BASE}/${encodeURIComponent(ip)}/json/`);
  const payload = await httpGetJson(url.toString(), { 'User-Agent': 'FoodScope/1.0' });
  if (!payload || !payload.latitude || !payload.longitude) {
    throw createApiError(502, 'GEO_IP_FALLBACK_FAILED', 'GEO_FALLBACK_ERROR', 'IP-based location lookup failed.');
  }

  const result = {
    location: {
      lat: Number(payload.latitude),
      lng: Number(payload.longitude),
      city: payload.city || payload.region || null,
      region: payload.region || null,
      country: payload.country_name || null,
      accuracy: 'approximate',
      source: 'ip'
    }
  };

  await cacheService.set(cacheKey, result, GEO_IP_TTL);
  return result;
};

const reverseGeocode = async (lat, lng) => {
  const { lat: parsedLat, lng: parsedLng } = normalizeCoordinates(lat, lng);
  const cacheKey = buildCacheKey({ type: 'reverse', lat: parsedLat, lng: parsedLng });
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const url = new URL(`${PROVIDER_BASE}/reverse`);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', parsedLat);
  url.searchParams.set('lon', parsedLng);
  const payload = await httpGetJson(url.toString(), { 'User-Agent': 'FoodScope/1.0' });

  if (!payload || (!payload.display_name && !payload.address)) {
    throw createApiError(502, 'GEO_REVERSE_FAILED', 'GEO_SERVICE_ERROR', 'Unable to resolve coordinates to a readable address.');
  }

  const location = {
    display_name: payload.display_name,
    city: payload.address?.city || payload.address?.town || payload.address?.village || payload.address?.state || null,
    region: payload.address?.state || payload.address?.county || null,
    country: payload.address?.country || null,
    raw: payload.address || null
  };

  const result = { location };
  await cacheService.set(cacheKey, result, GEO_REVERSE_TTL);
  return result;
};

const resolveLocationQuery = async (query) => {
  if (!query || String(query).trim().length < 2) {
    throw createApiError(400, 'GEO_RESOLVE_QUERY_INVALID', 'VALIDATION_ERROR', 'query is required and must be at least 2 characters.');
  }

  const cacheKey = buildCacheKey({ type: 'resolve', query: String(query).trim().toLowerCase() });
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const url = new URL(`${PROVIDER_BASE}/search`);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', String(query).trim());
  url.searchParams.set('limit', '8');

  const payload = await httpGetJson(url.toString(), { 'User-Agent': 'FoodScope/1.0' });
  if (!Array.isArray(payload)) {
    throw createApiError(502, 'GEO_RESOLVE_FAILED', 'GEO_SERVICE_ERROR', 'Unable to resolve manual location.');
  }

  const locations = payload.map((item) => ({
    label: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
    type: item.type || null,
    importance: item.importance || 0,
    boundingbox: item.boundingbox || null
  })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

  const result = { locations };
  await cacheService.set(cacheKey, result, GEO_RESOLVE_TTL);
  return result;
};

module.exports = {
  clampRadiusKm,
  normalizeCoordinates,
  getNearByRestaurants,
  getIpLocation,
  reverseGeocode,
  resolveLocationQuery
};

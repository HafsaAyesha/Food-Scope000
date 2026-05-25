const { createApiError, handleError } = require('../utils/api-error');
const geoService = require('../services/geo.service');

const nearby = async (req, res) => {
  try {
    const { lat, lng, radius, page = 1, limit = 20, cluster, cluster_resolution } = req.query;
    const { lat: parsedLat, lng: parsedLng } = geoService.normalizeCoordinates(lat, lng);
    const radiusKm = geoService.clampRadiusKm(radius ?? undefined);
    const currentPage = Math.max(1, Number(page) || 1);
    const currentLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const clusterEnabled = cluster === 'true' || cluster === '1';
    const clusterResolution = Number(cluster_resolution) || 800;

    const payload = await geoService.getNearByRestaurants({
      lat: parsedLat,
      lng: parsedLng,
      radiusKm,
      page: currentPage,
      limit: currentLimit,
      cluster: clusterEnabled,
      clusterResolutionMeters: clusterResolution
    });

    res.json({ success: true, data: payload });
  } catch (err) {
    handleError(res, err);
  }
};

const resolve = async (req, res) => {
  try {
    const { query } = req.query;
    const result = await geoService.resolveLocationQuery(query);
    res.json({ success: true, data: result });
  } catch (err) {
    handleError(res, err);
  }
};

const reverse = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const result = await geoService.reverseGeocode(lat, lng);
    res.json({ success: true, data: result });
  } catch (err) {
    handleError(res, err);
  }
};

const ipLocation = async (req, res) => {
  try {
    const result = await geoService.getIpLocation(req);
    res.json({ success: true, data: result });
  } catch (err) {
    handleError(res, err);
  }
};

module.exports = { nearby, resolve, reverse, ipLocation };

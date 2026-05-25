const restaurantRepo = require('../repositories/restaurant.repository');
const { createApiError } = require('../utils/api-error');

const listRestaurants = async ({ filters = {}, page = 1, limit = 10, sort = {} } = {}) => {
  const skip = Math.max(0, page - 1) * limit;
  const [restaurants, total] = await Promise.all([
    restaurantRepo.findAll(filters, { sort, skip, limit, select: 'name cuisine_type price_range avg_rating address thumbnail' }),
    restaurantRepo.count(filters)
  ]);

  return { restaurants, total, page };
};

const getRestaurant = async (id, requesterRole = null) => {
  const restaurant = await restaurantRepo.findById(id);
  if (!restaurant || restaurant.status === 'deleted') throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Restaurant not found.');
  if (restaurant.status === 'pending' && requesterRole !== 'admin') throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Restaurant not found.');
  return restaurant;
};

const createRestaurant = async ({ payload, user }) => {
  const { name, address } = payload;
  const nameNormalized = String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const addressNormalized = String(address || '').trim().toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ');
  const duplicate = await require('../models/restaurant.model').findOne({ name_normalized: nameNormalized, address_normalized: addressNormalized, status: { $ne: 'deleted' } });
  if (duplicate) throw createApiError(409, 'RESTAURANTS_DUPLICATE', 'CONFLICT_ERROR', 'Duplicate restaurant name at same address.');

  const restaurant = await restaurantRepo.create({ ...payload, owner_id: user.id, status: user.role === 'admin' ? 'approved' : 'pending' });
  return restaurant;
};

const updateRestaurant = async (id, payload) => {
  const allowedFields = ['name', 'description', 'price_range', 'tags'];
  const providedFields = Object.keys(payload);
  const invalidFields = providedFields.filter((f) => !allowedFields.includes(f));
  if (providedFields.length === 0 || invalidFields.length > 0) throw createApiError(400, 'RESTAURANTS_INVALID_FIELDS', 'VALIDATION_ERROR', 'Invalid update fields.');
  if (payload.price_range !== undefined && !['$', '$$', '$$$'].includes(payload.price_range)) throw createApiError(400, 'RESTAURANTS_INVALID_PRICE_RANGE', 'VALIDATION_ERROR', 'Invalid price_range value.');
  if (payload.tags !== undefined && !Array.isArray(payload.tags)) throw createApiError(400, 'RESTAURANTS_INVALID_TAGS', 'VALIDATION_ERROR', 'tags must be an array.');

  const updated = await restaurantRepo.updateById(id, payload);
  if (!updated) throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Restaurant not found.');
  return updated;
};

const deleteRestaurant = async (id) => {
  const updated = await restaurantRepo.updateById(id, { status: 'deleted', deleted_at: new Date() });
  if (!updated) throw createApiError(404, 'RESTAURANTS_NOT_FOUND', 'NOT_FOUND_ERROR', 'Restaurant not found.');
  return updated;
};

module.exports = {
  listRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
};

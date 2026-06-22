const mongoose = require('mongoose');
const Dish = require('../models/dish.model');
const { createApiError, handleError } = require('../utils/api-error');

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))].slice(0, 10);
};

// ── Controllers ───────────────────────────────────────────────────────────────

const listDishes = async (req, res) => {
  try {
    const dishes = await Dish.find({ restaurant_id: req.restaurant._id }).sort({ createdAt: -1 });
    res.json({
      dishes: dishes.map((d) => ({
        id: d._id,
        name: d.name,
        description: d.description,
        price: d.price,
        category: d.category || '',
        available: d.available !== false,
        dietary_tags: d.dietary_tags,
        tags: d.tags || [],
        image_url: d.image_url,
        restaurant_id: d.restaurant_id
      }))
    });
  } catch (err) {
    handleError(res, err);
  }
};

const addDish = async (req, res) => {
  try {
    const { name, description, price, category, available, tags, dietary_tags, image_url } = req.body;

    if (!name || price === undefined) throw createApiError(400, 'DISHES_MISSING_FIELDS', 'VALIDATION_ERROR', 'Missing name or price.');
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) throw createApiError(422, 'DISHES_INVALID_PRICE', 'VALIDATION_ERROR', 'Price must be a positive float.');

    const dish = await Dish.create({
      name: String(name).trim(),
      description: description || '',
      price: numericPrice,
      category: category ? String(category).trim() : '',
      available: available !== false,
      tags: normalizeTags(tags),
      dietary_tags: Array.isArray(dietary_tags) ? dietary_tags : [],
      image_url: image_url || '',
      restaurant_id: req.restaurant._id
    });

    res.status(201).json({
      id: dish._id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      category: dish.category || '',
      available: dish.available,
      tags: dish.tags || [],
      restaurant_id: dish.restaurant_id,
      created_at: dish.createdAt
    });
  } catch (err) {
    handleError(res, err);
  }
};

const updateDish = async (req, res) => {
  try {
    const { dish_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(dish_id)) throw createApiError(404, 'DISHES_NOT_FOUND', 'NOT_FOUND_ERROR', 'Dish not found.');

    const allowedFields = ['name', 'description', 'price', 'category', 'available', 'tags', 'dietary_tags', 'image_url'];
    const payload = req.body;
    const providedFields = Object.keys(payload);
    const invalidFields = providedFields.filter((f) => !allowedFields.includes(f));
    if (providedFields.length === 0 || invalidFields.length > 0) throw createApiError(400, 'DISHES_INVALID_FIELDS', 'VALIDATION_ERROR', 'Invalid fields.');

    const dish = await Dish.findOne({ _id: dish_id, restaurant_id: req.restaurant._id });
    if (!dish) throw createApiError(404, 'DISHES_NOT_FOUND', 'NOT_FOUND_ERROR', 'Dish not found.');

    if (payload.price !== undefined) {
      const numericPrice = Number(payload.price);
      if (Number.isNaN(numericPrice) || numericPrice <= 0) throw createApiError(422, 'DISHES_INVALID_PRICE', 'VALIDATION_ERROR', 'Price must be a positive float.');
      dish.price = numericPrice;
    }
    if (payload.name !== undefined) dish.name = String(payload.name).trim();
    if (payload.description !== undefined) dish.description = payload.description;
    if (payload.category !== undefined) dish.category = String(payload.category).trim();
    if (payload.available !== undefined) dish.available = Boolean(payload.available);
    if (payload.tags !== undefined) {
      if (!Array.isArray(payload.tags)) throw createApiError(400, 'DISHES_INVALID_FIELDS', 'VALIDATION_ERROR', 'tags must be an array.');
      dish.tags = normalizeTags(payload.tags);
    }
    if (payload.dietary_tags !== undefined) {
      if (!Array.isArray(payload.dietary_tags)) throw createApiError(400, 'DISHES_INVALID_FIELDS', 'VALIDATION_ERROR', 'dietary_tags must be an array.');
      dish.dietary_tags = payload.dietary_tags;
    }
    if (payload.image_url !== undefined) dish.image_url = payload.image_url;
    await dish.save();

    res.json({
      id: dish._id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      category: dish.category || '',
      available: dish.available,
      tags: dish.tags || [],
      updated_at: dish.updatedAt
    });
  } catch (err) {
    handleError(res, err);
  }
};

const deleteDish = async (req, res) => {
  try {
    const { dish_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(dish_id)) throw createApiError(404, 'DISHES_NOT_FOUND', 'NOT_FOUND_ERROR', 'Dish not found.');

    const dish = await Dish.findOne({ _id: dish_id, restaurant_id: req.restaurant._id });
    if (!dish) throw createApiError(404, 'DISHES_NOT_FOUND', 'NOT_FOUND_ERROR', 'Dish not found.');

    await Dish.deleteOne({ _id: dish._id });
    res.json({ message: 'Dish deleted.' });
  } catch (err) {
    handleError(res, err);
  }
};

module.exports = { listDishes, addDish, updateDish, deleteDish };

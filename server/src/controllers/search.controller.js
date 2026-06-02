const Restaurant = require('../models/restaurant.model');
const Dish = require('../models/dish.model');
const { buildSearchQuery } = require('../utils/search.helpers');
const { handleError } = require('../utils/api-error');

// ── Controllers ───────────────────────────────────────────────────────────────

const search = async (req, res) => {
  try {
    const { type, page, limit, text, regex, restaurantQuery, dishQuery } = buildSearchQuery(req.query);
    const skip = (page - 1) * limit;

    let restaurants = [];
    let dishes = [];

    if (type === 'restaurant' || type === 'all') {
      restaurants = await Restaurant.find({
        ...restaurantQuery,
        $text: { $search: text }
      })
        .sort({ score: { $meta: 'textScore' }, avg_rating: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('name description cuisine_type tags price_range avg_rating address thumbnail');
    }

    if (type === 'dish' || type === 'all') {
      dishes = await Dish.find({ ...dishQuery, $or: [{ name: regex }, { description: regex }] })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('name description price dietary_tags image_url restaurant_id');
    }

    res.json({
      restaurants: restaurants.map((r) => ({
        id: r._id, name: r.name, description: r.description, cuisine_type: r.cuisine_type,
        tags: r.tags, price_range: r.price_range, avg_rating: r.avg_rating, address: r.address, thumbnail: r.thumbnail
      })),
      dishes: dishes.map((d) => ({
        id: d._id, name: d.name, description: d.description, price: d.price,
        dietary_tags: d.dietary_tags, image_url: d.image_url, restaurant_id: d.restaurant_id
      })),
      total_results: restaurants.length + dishes.length
    });
  } catch (err) {
    handleError(res, err);
  }
};

module.exports = { search };

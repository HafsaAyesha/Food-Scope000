const Restaurant = require('../models/restaurant.model');
const BaseRepository = require('./base.repository');

class RestaurantRepository extends BaseRepository {
  constructor() {
    super(Restaurant);
  }

  /**
   * Find restaurants by approval status
   */
  async findByStatus(status, options = {}) {
    const filters = { status };
    return this.findAll(filters, options);
  }

  /**
   * Find nearby restaurants by geolocation
   */
  async findNearby(coordinates, maxDistance = 5000, options = {}) {
    const pipeline = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates
          },
          distanceField: 'distance',
          maxDistance,
          spherical: true,
          query: { status: 'approved' }
        }
      },
      { $limit: options.limit || 20 }
    ];

    return this.aggregate(pipeline);
  }

  /**
   * Find restaurants by cuisine type with pagination
   */
  async findByCuisine(cuisineType, options = {}) {
    const filters = { cuisine_type: cuisineType, status: 'approved' };
    return this.paginate(filters, options);
  }

  /**
   * Find restaurants by tag
   */
  async findByTag(tag, options = {}) {
    const filters = { tags: tag.toLowerCase(), status: 'approved' };
    return this.paginate(filters, options);
  }

  /**
   * Search restaurants by name or description
   */
  async search(query, options = {}) {
    const filters = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ],
      status: 'approved'
    };
    return this.paginate(filters, options);
  }

  /**
   * Update restaurant average rating
   */
  async updateAverageRating(restaurantId, avgRating) {
    return this.updateById(restaurantId, { avg_rating: avgRating });
  }

  /**
   * Archive a restaurant (soft delete)
   */
  async archive(restaurantId) {
    return this.updateById(restaurantId, { status: 'deleted' });
  }
}

module.exports = new RestaurantRepository();


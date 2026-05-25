const Tag = require('../models/tag.model');
const BaseRepository = require('./base.repository');

class TagRepository extends BaseRepository {
  constructor() {
    super(Tag);
  }

  /**
   * Find tags by approval status
   */
  async findByStatus(status, options = {}) {
    const filters = { status };
    return this.paginate(filters, options);
  }

  /**
   * Find approved tags
   */
  async findApproved(options = {}) {
    const filters = { status: 'approved' };
    return this.findAll(filters, options);
  }

  /**
   * Find tag by name (case-insensitive)
   */
  async findByName(name) {
    return this.findOne({ name_lower: String(name).trim().toLowerCase() });
  }

  /**
   * Search tags by name
   */
  async search(query, options = {}) {
    const filters = {
      name_lower: { $regex: String(query).trim().toLowerCase(), $options: 'i' },
      status: 'approved'
    };
    return this.paginate(filters, options);
  }

  /**
   * Get popular tags
   */
  async getPopularTags(limit = 10) {
    const result = await this.model.find({ status: 'approved' })
      .sort({ usage_count: -1 })
      .limit(limit)
      .select('name usage_count')
      .lean();
    return result;
  }

  /**
   * Increment tag usage count
   */
  async incrementUsage(tagId) {
    return this.model.findByIdAndUpdate(
      tagId,
      { $inc: { usage_count: 1 } },
      { new: true }
    );
  }

  /**
   * Approve a tag
   */
  async approve(tagId) {
    return this.updateById(tagId, { status: 'approved' });
  }

  /**
   * Reject a tag
   */
  async reject(tagId) {
    return this.updateById(tagId, { status: 'rejected' });
  }
}

module.exports = new TagRepository();

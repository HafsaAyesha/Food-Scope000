/**
 * BaseRepository - Abstract base class for all repositories
 * Provides common CRUD operations and query helpers
 */

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * Find all documents with optional filters and pagination
   */
  async findAll(filters = {}, options = {}) {
    const {
      sort = { createdAt: -1 },
      skip = 0,
      limit = 10,
      select = null,
      lean = true
    } = options;

    let query = this.model.find(filters);

    if (select) query = query.select(select);
    if (skip > 0) query = query.skip(skip);
    if (limit > 0) query = query.limit(limit);
    if (sort) query = query.sort(sort);
    if (lean) query = query.lean();

    const docs = await query.exec();
    return docs;
  }

  /**
   * Find a single document by ID
   */
  async findById(id, options = {}) {
    const { select = null, lean = true } = options;
    let query = this.model.findById(id);

    if (select) query = query.select(select);
    if (lean) query = query.lean();

    return query.exec();
  }

  /**
   * Find a single document by filters
   */
  async findOne(filters = {}, options = {}) {
    const { select = null, lean = true } = options;
    let query = this.model.findOne(filters);

    if (select) query = query.select(select);
    if (lean) query = query.lean();

    return query.exec();
  }

  /**
   * Create a new document
   */
  async create(data) {
    const doc = await this.model.create(data);
    return doc;
  }

  /**
   * Update a document by ID
   */
  async updateById(id, data, options = {}) {
    const { new: returnNew = true, lean = true } = options;
    const doc = await this.model.findByIdAndUpdate(id, data, { new: returnNew, lean: returnNew ? lean : false });
    return doc;
  }

  /**
   * Update multiple documents
   */
  async updateMany(filters = {}, data) {
    const result = await this.model.updateMany(filters, data);
    return result;
  }

  /**
   * Delete a document by ID
   */
  async deleteById(id) {
    const doc = await this.model.findByIdAndDelete(id);
    return doc;
  }

  /**
   * Delete multiple documents
   */
  async deleteMany(filters = {}) {
    const result = await this.model.deleteMany(filters);
    return result;
  }

  /**
   * Count documents matching filters
   */
  async count(filters = {}) {
    return this.model.countDocuments(filters);
  }

  /**
   * Check if a document exists
   */
  async exists(filters = {}) {
    const doc = await this.model.findOne(filters).select('_id').lean();
    return !!doc;
  }

  /**
   * Run aggregation pipeline
   */
  async aggregate(pipeline = []) {
    return this.model.aggregate(pipeline);
  }

  /**
   * Paginate results
   */
  async paginate(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 }, select = null } = options;
    const normalizedPage = Math.max(1, parseInt(page, 10) || 1);
    const normalizedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (normalizedPage - 1) * normalizedLimit;

    const [docs, total] = await Promise.all([
      this.findAll(filters, { sort, skip, limit: normalizedLimit, select }),
      this.count(filters)
    ]);

    return {
      docs,
      total,
      page: normalizedPage,
      limit: normalizedLimit,
      pages: Math.ceil(total / normalizedLimit)
    };
  }
}

module.exports = BaseRepository;

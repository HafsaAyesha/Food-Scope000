const mongoose = require('mongoose');

const normalizeText = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 120
  },
  name_normalized: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  cuisine_type: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  price_range: {
    type: String,
    required: true,
    enum: ['$', '$$', '$$$'],
    index: true
  },
  avg_rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    index: true
  },
  address: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 300
  },
  address_normalized: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (coords) => Array.isArray(coords) && coords.length === 2,
        message: 'Location coordinates must be [lng, lat].'
      }
    }
  },
  tags: {
    type: [String],
    default: [],
    set: (value) => Array.isArray(value)
      ? [...new Set(value.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))]
      : []
  },
  thumbnail: {
    type: String,
    default: ''
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended', 'deleted'],
    default: 'pending',
    index: true
  },
  deleted_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

restaurantSchema.virtual('lat').get(function () {
  return this.location?.coordinates?.[1];
});

restaurantSchema.virtual('lng').get(function () {
  return this.location?.coordinates?.[0];
});

restaurantSchema.pre('validate', function syncDerivedFields() {
  if (this.name) {
    this.name_normalized = normalizeText(this.name);
  }
  if (this.address) {
    this.address_normalized = normalizeText(this.address.replace(/[.,]/g, ''));
  }

  if (this.location && Array.isArray(this.location.coordinates) && this.location.coordinates.length === 2) {
    const [lng, lat] = this.location.coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number' || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Location coordinates must be valid numbers in [lng, lat] format.');
    }
    this.location = {
      type: 'Point',
      coordinates: [lng, lat]
    };
  }
});

restaurantSchema.index({ name: 'text', description: 'text' });
restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ name_normalized: 1, address_normalized: 1 }, { unique: true, partialFilterExpression: { status: { $ne: 'deleted' } } });
restaurantSchema.index({ cuisine_type: 1, price_range: 1, avg_rating: -1, status: 1 });
restaurantSchema.index({ tags: 1 });

module.exports = mongoose.model('Restaurant', restaurantSchema);

// Deprecated runtime startup sync logic.
// This file now serves as a manual migration helper; avoid running it on each application boot in production.
const Restaurant = require('../models/restaurant.model');
const Tag = require('../models/tag.model');

/**
 * Repairs common seed-data inconsistencies (missing status, location, tag fields)
 * without changing API behaviour or business rules.
 */
const syncDatabase = async () => {
  await Restaurant.syncIndexes();
  await Tag.syncIndexes();

  await Restaurant.updateMany(
    {
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: '' },
        { status: 'active' }
      ]
    },
    { $set: { status: 'approved' } }
  );

  await Tag.updateMany(
    {
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: '' }
      ]
    },
    { $set: { status: 'approved' } }
  );

  const restaurantsNeedingLocation = await Restaurant.find({
    lat: { $type: 'number' },
    lng: { $type: 'number' },
    $or: [
      { location: { $exists: false } },
      { 'location.coordinates': { $exists: false } },
      { 'location.coordinates': { $size: 0 } }
    ]
  }).select('_id lat lng');

  for (const restaurant of restaurantsNeedingLocation) {
    restaurant.location = {
      type: 'Point',
      coordinates: [restaurant.lng, restaurant.lat]
    };
    await restaurant.save();
  }

  await Restaurant.updateMany(
    {
      lat: { $exists: true },
      lng: { $exists: true }
    },
    { $unset: { lat: '', lng: '' } }
  );

  const tagsNeedingLower = await Tag.find({
    name: { $exists: true, $ne: '' },
    $or: [
      { name_lower: { $exists: false } },
      { name_lower: null },
      { name_lower: '' }
    ]
  });

  for (const tag of tagsNeedingLower) {
    tag.name_lower = String(tag.name).trim().toLowerCase();
    await tag.save();
  }

  if (restaurantsNeedingLocation.length > 0 || tagsNeedingLower.length > 0) {
    console.log(
      `Database sync: ${restaurantsNeedingLocation.length} restaurant location(s), ${tagsNeedingLower.length} tag(s) updated.`
    );
  }
};

module.exports = syncDatabase;

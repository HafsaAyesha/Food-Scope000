require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const User = require('../models/auth.model');
const Restaurant = require('../models/restaurant.model');
const Tag = require('../models/tag.model');
const Dish = require('../models/dish.model');
const Review = require('../models/review.model');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI not set');
  process.exit(1);
}

const seed = async () => {
  await mongoose.connect(MONGO_URI, { family: 4 });
  console.log('Connected to MongoDB');

  // ── Clear existing seed data ──────────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    Restaurant.deleteMany({}),
    Tag.deleteMany({}),
    Dish.deleteMany({}),
    Review.deleteMany({})
  ]);
  console.log('Cleared existing data');

  // ── Users ─────────────────────────────────────────────────────────────────
  const [admin, reviewer1, reviewer2, user1, user2, user3] = await Promise.all([
    User.create({ name: 'Admin User', email: 'admin@foodscope.com', password: 'Admin1234!', role: 'admin', isVerified: true }),
    User.create({ name: 'Alice Chen', email: 'alice@foodscope.com', password: 'Reviewer123!', role: 'reviewer', isVerified: true }),
    User.create({ name: 'Bob Tanaka', email: 'bob@foodscope.com', password: 'Reviewer123!', role: 'reviewer', isVerified: true }),
    User.create({ name: 'Carlos Mendez', email: 'carlos@example.com', password: 'User1234!', role: 'user', isVerified: true }),
    User.create({ name: 'Diana Osei', email: 'diana@example.com', password: 'User1234!', role: 'user', isVerified: true }),
    User.create({ name: 'Ethan Park', email: 'ethan@example.com', password: 'User1234!', role: 'user', isVerified: true })
  ]);
  console.log('Created 6 users');

  // ── Tags ──────────────────────────────────────────────────────────────────
  const tagData = [
    // cuisine
    { name: 'Italian', type: 'cuisine' },
    { name: 'Japanese', type: 'cuisine' },
    { name: 'Mexican', type: 'cuisine' },
    { name: 'Indian', type: 'cuisine' },
    { name: 'American', type: 'cuisine' },
    { name: 'Thai', type: 'cuisine' },
    { name: 'Chinese', type: 'cuisine' },
    { name: 'Mediterranean', type: 'cuisine' },
    // dietary
    { name: 'Vegan Friendly', type: 'dietary' },
    { name: 'Gluten Free', type: 'dietary' },
    { name: 'Halal', type: 'dietary' },
    { name: 'Vegetarian', type: 'dietary' },
    // feature
    { name: 'Outdoor Seating', type: 'feature' },
    { name: 'Live Music', type: 'feature' },
    { name: 'Family Friendly', type: 'feature' },
    { name: 'Takeaway', type: 'feature' },
    { name: 'Delivery', type: 'feature' },
    { name: 'Rooftop', type: 'feature' }
  ];

  const tags = await Promise.all(
    tagData.map(t =>
      Tag.create({
        name: t.name,
        name_lower: t.name.toLowerCase(),
        type: t.type,
        status: 'approved',
        created_by: admin._id,
        usage_count: Math.floor(Math.random() * 30)
      })
    )
  );
  console.log(`Created ${tags.length} tags`);

  const tagByName = Object.fromEntries(tags.map(t => [t.name, t.name.toLowerCase()]));

  // ── Restaurants ───────────────────────────────────────────────────────────
  const restaurants = await Promise.all([
    Restaurant.create({
      name: 'Bella Roma',
      description: 'Authentic Italian trattoria serving handmade pasta, wood-fired pizzas, and traditional antipasti. A taste of Rome in the heart of the city.',
      cuisine_type: 'Italian',
      price_range: '$$',
      avg_rating: 4.5,
      address: '12 Via Roma Street, New York, NY 10001',
      location: { type: 'Point', coordinates: [-74.0060, 40.7128] },
      tags: [tagByName['Italian'], tagByName['Outdoor Seating'], tagByName['Family Friendly']],
      thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      owner_id: reviewer1._id,
      status: 'approved'
    }),
    Restaurant.create({
      name: 'Sakura Garden',
      description: 'A serene Japanese dining experience featuring fresh sushi, sashimi, ramen, and an extensive sake selection. All fish is sourced daily.',
      cuisine_type: 'Japanese',
      price_range: '$$$',
      avg_rating: 4.8,
      address: '45 Cherry Blossom Ave, San Francisco, CA 94102',
      location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
      tags: [tagByName['Japanese'], tagByName['Gluten Free'], tagByName['Rooftop']],
      thumbnail: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800',
      owner_id: reviewer1._id,
      status: 'approved'
    }),
    Restaurant.create({
      name: 'El Rancho Taqueria',
      description: 'Family-owned Mexican taqueria serving slow-cooked meats, fresh salsas made daily, and the best margaritas in town. Viva México!',
      cuisine_type: 'Mexican',
      price_range: '$',
      avg_rating: 4.3,
      address: '78 Calle Ocho, Miami, FL 33135',
      location: { type: 'Point', coordinates: [-80.2141, 25.7617] },
      tags: [tagByName['Mexican'], tagByName['Halal'], tagByName['Takeaway'], tagByName['Delivery']],
      thumbnail: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
      owner_id: reviewer2._id,
      status: 'approved'
    }),
    Restaurant.create({
      name: 'Spice Route',
      description: 'Award-winning Indian restaurant offering classic curries, tandoori specials, and regional dishes from across the subcontinent. Vegetarian paradise.',
      cuisine_type: 'Indian',
      price_range: '$$',
      avg_rating: 4.6,
      address: '22 Curry Lane, Chicago, IL 60601',
      location: { type: 'Point', coordinates: [-87.6298, 41.8781] },
      tags: [tagByName['Indian'], tagByName['Vegan Friendly'], tagByName['Vegetarian'], tagByName['Delivery']],
      thumbnail: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
      owner_id: reviewer2._id,
      status: 'approved'
    }),
    Restaurant.create({
      name: 'The Smokehouse',
      description: 'Texas-style BBQ smokehouse with 12-hour smoked brisket, fall-off-the-bone ribs, and homemade sides. Live country music every Friday night.',
      cuisine_type: 'American',
      price_range: '$$',
      avg_rating: 4.2,
      address: '9 Lone Star Blvd, Austin, TX 78701',
      location: { type: 'Point', coordinates: [-97.7431, 30.2672] },
      tags: [tagByName['American'], tagByName['Live Music'], tagByName['Outdoor Seating'], tagByName['Family Friendly']],
      thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
      owner_id: reviewer1._id,
      status: 'approved'
    }),
    Restaurant.create({
      name: 'Bangkok Street',
      description: 'Vibrant Thai street food experience in a modern setting. Authentic Pad Thai, green curries, and mango sticky rice crafted by a Bangkok-born chef.',
      cuisine_type: 'Thai',
      price_range: '$',
      avg_rating: 4.4,
      address: '33 Silom Road, Los Angeles, CA 90012',
      location: { type: 'Point', coordinates: [-118.2437, 34.0522] },
      tags: [tagByName['Thai'], tagByName['Vegan Friendly'], tagByName['Takeaway']],
      thumbnail: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800',
      owner_id: reviewer2._id,
      status: 'approved'
    }),
    Restaurant.create({
      name: 'Dragon Palace',
      description: 'Dim sum and Cantonese cuisine at its finest. Choose from over 60 dim sum varieties on weekends, or enjoy our a la carte dinner menu.',
      cuisine_type: 'Chinese',
      price_range: '$$',
      avg_rating: 4.1,
      address: '88 Fortune Street, Seattle, WA 98101',
      location: { type: 'Point', coordinates: [-122.3321, 47.6062] },
      tags: [tagByName['Chinese'], tagByName['Family Friendly'], tagByName['Delivery']],
      thumbnail: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800',
      owner_id: reviewer1._id,
      status: 'approved'
    }),
    Restaurant.create({
      name: 'Olive & Sea',
      description: 'Mediterranean coastal cuisine with fresh seafood, mezze platters, and wood-fired flatbreads. Rooftop bar with stunning city views.',
      cuisine_type: 'Mediterranean',
      price_range: '$$$',
      avg_rating: 4.7,
      address: '5 Harbor View Drive, Boston, MA 02101',
      location: { type: 'Point', coordinates: [-71.0589, 42.3601] },
      tags: [tagByName['Mediterranean'], tagByName['Rooftop'], tagByName['Gluten Free'], tagByName['Live Music']],
      thumbnail: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      owner_id: reviewer2._id,
      status: 'approved'
    })
  ]);
  console.log(`Created ${restaurants.length} restaurants`);

  // ── Dishes ────────────────────────────────────────────────────────────────
  const dishEntries = [
    // Bella Roma
    { name: 'Spaghetti Carbonara', description: 'Classic Roman pasta with guanciale, egg, pecorino and black pepper', price: 18.5, dietary_tags: [], restaurant_id: restaurants[0]._id },
    { name: 'Margherita Pizza', description: 'Wood-fired pizza with San Marzano tomatoes, buffalo mozzarella and basil', price: 16.0, dietary_tags: ['vegetarian'], restaurant_id: restaurants[0]._id },
    { name: 'Tiramisu', description: 'Traditional ladyfinger dessert with mascarpone and espresso', price: 9.0, dietary_tags: ['vegetarian'], restaurant_id: restaurants[0]._id },
    // Sakura Garden
    { name: 'Omakase Sushi Set', description: 'Chef\'s selection of 12 premium nigiri pieces', price: 65.0, dietary_tags: ['gluten-free'], restaurant_id: restaurants[1]._id },
    { name: 'Tonkotsu Ramen', description: 'Rich pork bone broth with chashu, soft egg, nori and bamboo shoots', price: 22.0, dietary_tags: [], restaurant_id: restaurants[1]._id },
    { name: 'Matcha Cheesecake', description: 'Japanese-style cheesecake with ceremonial matcha glaze', price: 12.0, dietary_tags: ['vegetarian'], restaurant_id: restaurants[1]._id },
    // El Rancho
    { name: 'Street Tacos (3)', description: 'Corn tortillas with slow-cooked al pastor, onion, cilantro and salsa verde', price: 12.0, dietary_tags: ['halal'], restaurant_id: restaurants[2]._id },
    { name: 'Nachos Grande', description: 'Loaded nachos with beans, cheese, guacamole, jalapeños and sour cream', price: 14.5, dietary_tags: ['vegetarian'], restaurant_id: restaurants[2]._id },
    // Spice Route
    { name: 'Butter Chicken', description: 'Tender chicken in a rich, creamy tomato-butter sauce with basmati rice', price: 17.0, dietary_tags: ['gluten-free', 'halal'], restaurant_id: restaurants[3]._id },
    { name: 'Dal Makhani', description: 'Slow-cooked black lentils in a velvety tomato and butter sauce', price: 14.0, dietary_tags: ['vegetarian', 'gluten-free'], restaurant_id: restaurants[3]._id },
    { name: 'Garlic Naan', description: 'Freshly baked flatbread with roasted garlic and butter', price: 4.0, dietary_tags: ['vegetarian'], restaurant_id: restaurants[3]._id },
    // The Smokehouse
    { name: 'Brisket Platter', description: '12-hour smoked beef brisket with coleslaw, pickles and two sides', price: 26.0, dietary_tags: [], restaurant_id: restaurants[4]._id },
    { name: 'Baby Back Ribs (Full Rack)', description: 'Tender pork ribs with house dry rub and BBQ sauce', price: 32.0, dietary_tags: [], restaurant_id: restaurants[4]._id },
    // Bangkok Street
    { name: 'Pad Thai', description: 'Stir-fried rice noodles with tofu, bean sprouts, peanuts and lime', price: 13.0, dietary_tags: ['vegan', 'gluten-free'], restaurant_id: restaurants[5]._id },
    { name: 'Green Curry', description: 'Aromatic green curry with coconut milk, Thai eggplant and jasmine rice', price: 15.0, dietary_tags: ['vegan'], restaurant_id: restaurants[5]._id },
    // Dragon Palace
    { name: 'Dim Sum Basket (Har Gow)', description: 'Steamed shrimp dumplings in translucent wrappers (4 pieces)', price: 8.5, dietary_tags: [], restaurant_id: restaurants[6]._id },
    { name: 'Peking Duck (Half)', description: 'Crispy duck served with pancakes, hoisin sauce and spring onion', price: 38.0, dietary_tags: [], restaurant_id: restaurants[6]._id },
    // Olive & Sea
    { name: 'Mezze Platter for Two', description: 'Hummus, tzatziki, falafel, stuffed grape leaves and warm pita', price: 24.0, dietary_tags: ['vegetarian', 'vegan'], restaurant_id: restaurants[7]._id },
    { name: 'Grilled Whole Sea Bass', description: 'Fresh sea bass with lemon, herbs, olive oil and seasonal vegetables', price: 36.0, dietary_tags: ['gluten-free'], restaurant_id: restaurants[7]._id }
  ];

  await Promise.all(dishEntries.map(d => Dish.create(d)));
  console.log(`Created ${dishEntries.length} dishes`);

  // ── Reviews ───────────────────────────────────────────────────────────────
  const reviewers = [user1, user2, user3, admin];
  const reviewData = [
    { restaurant: restaurants[0], user: user1, rating: 5, body: 'The carbonara was absolutely divine — creamy, perfectly seasoned and cooked to perfection. The ambiance feels like stepping into a real Roman trattoria. Will definitely be back!' },
    { restaurant: restaurants[0], user: user2, rating: 4, body: 'Great pasta and warm atmosphere. The wood-fired pizza was excellent too. Slightly pricey but worth it for a special occasion.' },
    { restaurant: restaurants[1], user: user2, rating: 5, body: 'Best sushi I\'ve had outside of Tokyo. The omakase set was incredible — each piece was a work of art. The rooftop setting made it even more special.' },
    { restaurant: restaurants[1], user: user3, rating: 5, body: 'Sakura Garden is in a league of its own. The tonkotsu ramen broth was rich and complex, clearly made with love. The matcha cheesecake was the perfect ending.' },
    { restaurant: restaurants[2], user: user1, rating: 4, body: 'Authentic street tacos just like in Mexico City. The al pastor is beautifully marinated and the salsa verde has the perfect kick. Great value for money!' },
    { restaurant: restaurants[2], user: user3, rating: 5, body: 'El Rancho never disappoints. The nachos are massive and loaded with toppings. The margaritas are outstanding — fresh lime, none of that sour mix stuff.' },
    { restaurant: restaurants[3], user: user1, rating: 5, body: 'Spice Route takes Indian food to another level. The butter chicken sauce was so silky and flavourful, perfectly paired with their garlic naan. Excellent vegetarian options too.' },
    { restaurant: restaurants[3], user: user2, rating: 4, body: 'The dal makhani was slow-cooked to perfection. Rich, hearty and full of flavour. Service was attentive and knowledgeable about the dishes.' },
    { restaurant: restaurants[4], user: user3, rating: 4, body: 'Solid Texas BBQ. The brisket was tender with a great smoke ring. The live music on Friday nights really adds to the experience. A must-visit in Austin.' },
    { restaurant: restaurants[4], user: user1, rating: 4, body: 'The ribs were fall-off-the-bone perfect. Generous portions and the sides — especially the mac and cheese — were comfort food at its finest.' },
    { restaurant: restaurants[5], user: user2, rating: 4, body: 'Genuinely authentic Thai flavours. The pad thai is fresh, light and perfectly balanced. Great vegan options — the green curry is outstanding.' },
    { restaurant: restaurants[5], user: user3, rating: 5, body: 'Bangkok Street has ruined pad thai for me everywhere else. The chef clearly knows what they\'re doing. Fresh ingredients, bold flavours and affordable prices.' },
    { restaurant: restaurants[6], user: user1, rating: 4, body: 'Weekend dim sum here is a must. So many varieties, all freshly steamed. The har gow were silky and plump. Go early or expect a queue!' },
    { restaurant: restaurants[7], user: user2, rating: 5, body: 'Olive & Sea is a gem. The mezze platter for two is incredible value and the grilled sea bass was cooked flawlessly. The rooftop views are breathtaking.' },
    { restaurant: restaurants[7], user: user3, rating: 5, body: 'An exceptional Mediterranean experience from start to finish. The food, the views, the service — all world-class. The live music on weekends is a lovely touch.' }
  ];

  const usedPairs = new Set();
  for (const { restaurant, user, rating, body } of reviewData) {
    const key = `${user._id}-${restaurant._id}`;
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);
    await Review.create({ user_id: user._id, restaurant_id: restaurant._id, rating, body, status: 'active' });
  }
  console.log(`Created ${usedPairs.size} reviews`);

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!');
  console.log('─────────────────────────────');
  console.log('Admin login:    admin@foodscope.com  / Admin1234!');
  console.log('Reviewer login: alice@foodscope.com  / Reviewer123!');
  console.log('User login:     carlos@example.com   / User1234!');
  console.log('─────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

/**
 * FoodScope Seed Script — Islamabad / Chattar / COMSATS Edition
 *
 * ROLES:
 *  admin    : Platform administrator
 *  reviewer : Restaurant owner (can list/manage restaurants)
 *  user     : Regular customer (browse & review only)
 *
 * Run: npm run seed  (from /server)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const User       = require('../models/auth.model');
const Restaurant = require('../models/restaurant.model');
const Tag        = require('../models/tag.model');
const Dish       = require('../models/dish.model');
const Review     = require('../models/review.model');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('MONGO_URI not set'); process.exit(1); }

const seed = async () => {
  await mongoose.connect(MONGO_URI, { family: 4 });
  console.log('✔ Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}), Restaurant.deleteMany({}),
    Tag.deleteMany({}),  Dish.deleteMany({}), Review.deleteMany({})
  ]);
  console.log('✔ Cleared existing data');

  // ── 1. USERS ──────────────────────────────────────────────────────────────
  const [
    admin,
    ownerZara, ownerAhmed, ownerSana, ownerKamran, ownerFatima, ownerBilal,
    userAli, userMariam, userOmar, userSofia, userHamza, userAyesha, userUsman
  ] = await Promise.all([
    User.create({ name: 'Admin', email: 'admin@foodscope.com', password: 'Admin1234!', role: 'admin', isVerified: true }),

    User.create({ name: 'Zara Sheikh',   email: 'zara.sheikh@foodscope.com',   password: 'Owner1234!', role: 'reviewer', isVerified: true }),
    User.create({ name: 'Ahmed Raza',    email: 'ahmed.raza@foodscope.com',    password: 'Owner1234!', role: 'reviewer', isVerified: true }),
    User.create({ name: 'Sana Mirza',    email: 'sana.mirza@foodscope.com',    password: 'Owner1234!', role: 'reviewer', isVerified: true }),
    User.create({ name: 'Kamran Butt',   email: 'kamran.butt@foodscope.com',   password: 'Owner1234!', role: 'reviewer', isVerified: true }),
    User.create({ name: 'Fatima Malik',  email: 'fatima.malik@foodscope.com',  password: 'Owner1234!', role: 'reviewer', isVerified: true }),
    User.create({ name: 'Bilal Chaudhry', email: 'bilal.chaudhry@foodscope.com', password: 'Owner1234!', role: 'reviewer', isVerified: true }),

    User.create({ name: 'Ali Hassan',    email: 'ali@example.com',      password: 'User1234!', role: 'user', isVerified: true }),
    User.create({ name: 'Mariam Tariq',  email: 'mariam@example.com',   password: 'User1234!', role: 'user', isVerified: true }),
    User.create({ name: 'Omar Farooq',   email: 'omar@example.com',     password: 'User1234!', role: 'user', isVerified: true }),
    User.create({ name: 'Sofia Khan',    email: 'sofia@example.com',    password: 'User1234!', role: 'user', isVerified: true }),
    User.create({ name: 'Hamza Iqbal',   email: 'hamza@example.com',    password: 'User1234!', role: 'user', isVerified: true }),
    User.create({ name: 'Ayesha Noor',   email: 'ayesha@example.com',   password: 'User1234!', role: 'user', isVerified: true }),
    User.create({ name: 'Usman Ghani',   email: 'usman@example.com',    password: 'User1234!', role: 'user', isVerified: true }),
  ]);
  console.log('✔ Created 14 users (1 admin, 6 restaurant owners, 7 customers)');

  // ── 2. TAGS ───────────────────────────────────────────────────────────────
  const tagData = [
    { name: 'Pakistani',       type: 'cuisine' },
    { name: 'BBQ & Grills',    type: 'cuisine' },
    { name: 'Street Food',     type: 'cuisine' },
    { name: 'Afghan',          type: 'cuisine' },
    { name: 'Continental',     type: 'cuisine' },
    { name: 'Chinese',         type: 'cuisine' },
    { name: 'Italian',         type: 'cuisine' },
    { name: 'Japanese',        type: 'cuisine' },
    { name: 'Mediterranean',   type: 'cuisine' },
    { name: 'Fast Food',       type: 'cuisine' },
    { name: 'Halal',           type: 'dietary' },
    { name: 'Vegetarian',      type: 'dietary' },
    { name: 'Vegan Friendly',  type: 'dietary' },
    { name: 'Gluten Free',     type: 'dietary' },
    { name: 'Outdoor Seating', type: 'feature' },
    { name: 'Sea View',        type: 'feature' },
    { name: 'Rooftop',         type: 'feature' },
    { name: 'Family Friendly', type: 'feature' },
    { name: 'Live Music',      type: 'feature' },
    { name: 'Takeaway',        type: 'feature' },
    { name: 'Delivery',        type: 'feature' },
    { name: 'Late Night',      type: 'feature' },
    { name: 'Fine Dining',     type: 'feature' },
    { name: 'Student Friendly', type: 'feature' },
  ];

  const tags = await Promise.all(
    tagData.map(t => Tag.create({
      name: t.name,
      name_lower: t.name.toLowerCase(),
      type: t.type,
      status: 'approved',
      created_by: admin._id,
      usage_count: Math.floor(Math.random() * 80) + 10
    }))
  );
  const T = Object.fromEntries(tags.map(t => [t.name, t.name.toLowerCase()]));
  console.log(`✔ Created ${tags.length} tags`);

  // ── 3. RESTAURANTS ────────────────────────────────────────────────────────
  // Coordinates: [longitude, latitude]
  // Focus areas: Islamabad city, Chattar (Murree Road), near COMSATS H-8

  const restaurants = await Promise.all([

    // ── NEAR COMSATS UNIVERSITY (H-8 / G-9 / I-8) ────────────────────────

    Restaurant.create({
      name: 'Desi Dhaba COMSATS',
      description: 'The go-to dhaba for COMSATS students and faculty, tucked just off the H-8/4 gate. Famous for its generous daal chawal, freshly made parathas, and steaming karahi that hits different after a long lecture. The aloo gosht is slow-cooked daily and the lassi is the thickest in the area. Budget-friendly, filling, and honest desi food every single day.',
      cuisine_type: 'Pakistani',
      price_range: '$',
      avg_rating: 4.3,
      address: 'H-8/4, Near COMSATS University, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0855, 33.6842] },
      tags: [T['Pakistani'], T['Street Food'], T['Halal'], T['Student Friendly'], T['Takeaway'], T['Delivery'], T['Late Night']],
      thumbnail: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
      owner_id: ownerBilal._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Campus Grill House',
      description: 'A beloved student hangout just a five-minute walk from COMSATS main gate in H-8. Specialising in charcoal-grilled bun kebabs, crispy chicken rolls, and the iconic campus-style fries loaded with chilli sauce and mayo. The half-and-half burger — beef patty plus chicken tikka — has a cult following. Open till 2 AM for post-deadline cravings.',
      cuisine_type: 'Fast Food',
      price_range: '$',
      avg_rating: 4.2,
      address: 'Street 4, H-8/4, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0870, 33.6855] },
      tags: [T['Fast Food'], T['Street Food'], T['Halal'], T['Student Friendly'], T['Takeaway'], T['Late Night'], T['Delivery']],
      thumbnail: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',
      owner_id: ownerAhmed._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'G-9 Karahi House',
      description: 'A no-frills karahi institution in G-9 Markaz that has been packed every evening since it opened. The mutton karahi arrives in a scorching wok, fragrant with tomatoes, ginger julienne and green chillies. The chicken handi is equally outstanding. Everything is made fresh to order, the naans are pulled straight from the tandoor, and the bill is always a pleasant surprise.',
      cuisine_type: 'Pakistani',
      price_range: '$',
      avg_rating: 4.5,
      address: 'G-9 Markaz, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0638, 33.6915] },
      tags: [T['Pakistani'], T['BBQ & Grills'], T['Halal'], T['Family Friendly'], T['Takeaway'], T['Late Night']],
      thumbnail: 'https://images.unsplash.com/photo-1567529692333-de9fd6772897?w=800',
      owner_id: ownerZara._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'I-8 Food Street',
      description: 'A lively open-air food street in I-8 Markaz, within cycling distance of COMSATS, that comes alive every evening with the aroma of sizzling seekh kababs and nihari. A cluster of family-run stalls serves everything from paya and paye ki nihari to chargha and biryani. The coal-smoked seekh kababs from the corner stall are legendary among university students and local residents alike.',
      cuisine_type: 'Pakistani',
      price_range: '$',
      avg_rating: 4.4,
      address: 'I-8 Markaz, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0921, 33.6769] },
      tags: [T['Pakistani'], T['Street Food'], T['BBQ & Grills'], T['Halal'], T['Student Friendly'], T['Late Night'], T['Family Friendly'], T['Takeaway']],
      thumbnail: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800',
      owner_id: ownerSana._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Tandoori Nights G-11',
      description: 'A warmly lit neighbourhood restaurant in G-11 Markaz, popular with COMSATS hostelites for its unbeatable value and generous portions. The tandoori platter — reshmi kabab, chicken boti, seekh, and fresh-baked naan — is the staple order. The house daal makhani simmers for hours and the gulab jamun is made from scratch. Perfect for group dinners on a student budget.',
      cuisine_type: 'Pakistani',
      price_range: '$',
      avg_rating: 4.1,
      address: 'G-11 Markaz, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0263, 33.6836] },
      tags: [T['Pakistani'], T['BBQ & Grills'], T['Halal'], T['Student Friendly'], T['Family Friendly'], T['Takeaway'], T['Delivery']],
      thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
      owner_id: ownerKamran._id,
      status: 'approved'
    }),

    // ── CHATTAR & MURREE ROAD ────────────────────────────────────────────────

    Restaurant.create({
      name: 'Chattar Chowk Kabab Corner',
      description: 'The most famous roadside stop on the Islamabad–Murree road, Chattar Chowk Kabab Corner has been the default pit stop for weekend travellers, hikers, and families heading up to the hills since 1998. The coal-fired seekh kababs are hand-minced in-house every morning, the mint chutney is made hourly, and the chai is perfectly sweet and milky. There is always a queue, and it always moves fast.',
      cuisine_type: 'Pakistani',
      price_range: '$',
      avg_rating: 4.6,
      address: 'Chattar Chowk, Murree Road, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.2138, 33.7658] },
      tags: [T['Pakistani'], T['BBQ & Grills'], T['Street Food'], T['Halal'], T['Takeaway'], T['Family Friendly'], T['Outdoor Seating']],
      thumbnail: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
      owner_id: ownerFatima._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Pine View Café & Grill — Chattar',
      description: 'Perched in the pine-forested hills above Chattar with sweeping views over the Islamabad valley, Pine View is a beloved weekend escape for city residents. The menu balances hearty Pakistani grills with continental comfort food — the stuffed chicken breast, creamy pasta, and wood-fired pizzas are all excellent. The outdoor deck is spectacular on a clear day and magical when the mist rolls in.',
      cuisine_type: 'Continental',
      price_range: '$$',
      avg_rating: 4.5,
      address: 'Chattar, Murree Road, Rawalpindi, Pakistan',
      location: { type: 'Point', coordinates: [73.2200, 33.7700] },
      tags: [T['Continental'], T['Pakistani'], T['Halal'], T['Outdoor Seating'], T['Family Friendly'], T['Fine Dining']],
      thumbnail: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      owner_id: ownerBilal._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Murree Road Nihari House',
      description: 'A roadside institution on the old Murree Road that draws early-morning commuters and late-night travellers alike. The nihari here is a 12-hour affair — whole spices, slow heat, and beef so tender it falls apart at the touch. The naan is baked fresh all day, and the paya shorba on Sunday mornings is a local ritual. Simple, powerful, utterly satisfying Pakistani cooking.',
      cuisine_type: 'Pakistani',
      price_range: '$',
      avg_rating: 4.4,
      address: 'Old Murree Road, Near Chattar, Rawalpindi, Pakistan',
      location: { type: 'Point', coordinates: [73.1900, 33.7575] },
      tags: [T['Pakistani'], T['Street Food'], T['Halal'], T['Late Night'], T['Takeaway'], T['Family Friendly']],
      thumbnail: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
      owner_id: ownerZara._id,
      status: 'approved'
    }),

    // ── F-7 / F-6 / JINNAH SUPER ────────────────────────────────────────────

    Restaurant.create({
      name: 'Monal Restaurant',
      description: 'Islamabad\'s most iconic dining destination, perched at the summit of the Margalla Hills with a sweeping 360° panorama of the capital. Monal offers an extensive menu ranging from traditional Pakistani sajji and biryani to continental grills. The sunset views from the open-air terrace are among the most spectacular in all of Pakistan. Book ahead — tables fill up fast every evening.',
      cuisine_type: 'Pakistani',
      price_range: '$$$',
      avg_rating: 4.9,
      address: '9km Pir Sohawa Road, Margalla Hills, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0617, 33.7483] },
      tags: [T['Pakistani'], T['Continental'], T['Rooftop'], T['Outdoor Seating'], T['Halal'], T['Fine Dining'], T['Family Friendly']],
      thumbnail: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      owner_id: ownerFatima._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Chaaye Khana F-7',
      description: 'Islamabad\'s most beloved chai café, set in a charming heritage-style building in F-7 Markaz. Famous for its extraordinary chai menu with 30+ varieties — from classic doodh patti to saffron kahwa and Kashmiri pink chai. The pakoras, samosas and aloo paratha pair perfectly. A cultural institution that is always full of students, poets, artists and anyone who just needs a slow afternoon.',
      cuisine_type: 'Pakistani',
      price_range: '$',
      avg_rating: 4.5,
      address: 'F-7 Markaz, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0503, 33.7240] },
      tags: [T['Pakistani'], T['Street Food'], T['Halal'], T['Outdoor Seating'], T['Live Music'], T['Late Night'], T['Delivery'], T['Student Friendly']],
      thumbnail: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800',
      owner_id: ownerSana._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Kabul Restaurant',
      description: 'A legendary Islamabad institution in the heart of Jinnah Super, F-7, serving authentic Afghan cuisine for over 30 years. The slow-cooked Kabuli Pulao — long-grain rice in rich lamb broth, topped with julienned carrots, raisins and braised lamb — is the best in the capital. The lamb chops, marinated overnight and grilled over charcoal, are exceptional. A diplomatic quarter favourite.',
      cuisine_type: 'Afghan',
      price_range: '$$',
      avg_rating: 4.6,
      address: 'Plot 17, Jinnah Super Market, F-7 Markaz, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0531, 33.7214] },
      tags: [T['Afghan'], T['Pakistani'], T['Halal'], T['Family Friendly'], T['Outdoor Seating'], T['Takeaway'], T['Fine Dining']],
      thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
      owner_id: ownerAhmed._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Tabaq Restaurant',
      description: 'An elegant multi-cuisine restaurant in F-6 Supermarket that has become a favourite for Islamabad\'s food-savvy crowd. Tabaq is known for its polished Pakistani dishes — the karahi, nihari and biryani are all excellent — alongside a strong continental selection. The rooftop terrace overlooking Supermarket is one of the most pleasant places to dine in the city, especially in autumn.',
      cuisine_type: 'Pakistani',
      price_range: '$$',
      avg_rating: 4.4,
      address: 'F-6 Supermarket, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0530, 33.7292] },
      tags: [T['Pakistani'], T['Continental'], T['Rooftop'], T['Halal'], T['Family Friendly'], T['Fine Dining'], T['Outdoor Seating']],
      thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      owner_id: ownerKamran._id,
      status: 'approved'
    }),

    // ── BLUE AREA / F-10 / G-7 ───────────────────────────────────────────────

    Restaurant.create({
      name: 'Savour Foods',
      description: 'An iconic Islamabad institution that has been serving the best Pulao Kabab in the capital since 1980. The famous deal — a steaming plate of fragrant mutton pulao paired with two seekh kababs and raita — is deceptively simple and endlessly satisfying. The queue at lunchtime is a testament to the quality. One of the great cheap eats of Pakistan and a mandatory stop for every first-time visitor to Islamabad.',
      cuisine_type: 'Pakistani',
      price_range: '$',
      avg_rating: 4.7,
      address: 'Fortune Plaza, Jinnah Avenue, Blue Area, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0685, 33.7099] },
      tags: [T['Pakistani'], T['Street Food'], T['Halal'], T['Takeaway'], T['Family Friendly'], T['Late Night'], T['Student Friendly']],
      thumbnail: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
      owner_id: ownerZara._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Lord of the Wings F-10',
      description: 'Islamabad\'s go-to destination for buffalo-style chicken wings and loaded burgers in F-10 Markaz. Over 20 wing sauces range from mild honey-garlic to the face-melting Ghost Pepper challenge. The crispy loaded fries, mac-and-cheese bites, and thick milkshakes complete the experience. Loud, fun, and always packed with students and young professionals.',
      cuisine_type: 'Fast Food',
      price_range: '$$',
      avg_rating: 4.3,
      address: 'F-10 Markaz, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0165, 33.7003] },
      tags: [T['Fast Food'], T['Halal'], T['Student Friendly'], T['Takeaway'], T['Delivery'], T['Late Night']],
      thumbnail: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',
      owner_id: ownerBilal._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Melody BBQ & Grill',
      description: 'A classic open-air BBQ spot in the Melody area of G-7, famous with Islamabadis for its coal-fired kababs and charsi karahi prepared in full view of diners. The half-chicken tikka, dunked in yoghurt and spices overnight before hitting the charcoal, is spectacular. The atmosphere on a busy Friday evening — the glow of coals, the smell of smoke, the bustle of waiters — is quintessentially Islamabad.',
      cuisine_type: 'Pakistani',
      price_range: '$',
      avg_rating: 4.4,
      address: 'Melody Market, G-7, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0699, 33.7155] },
      tags: [T['Pakistani'], T['BBQ & Grills'], T['Street Food'], T['Halal'], T['Outdoor Seating'], T['Late Night'], T['Family Friendly'], T['Takeaway']],
      thumbnail: 'https://images.unsplash.com/photo-1567529692333-de9fd6772897?w=800',
      owner_id: ownerFatima._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Nomad Coffee & Kitchen',
      description: 'A cosy specialty coffee shop and brunch café in F-11 Markaz that has quickly become a favourite among Islamabad\'s creative crowd. Excellent single-origin pour-overs and flat whites, avocado toast, eggs Benedict, and the best overnight oats in the city. The industrial-chic interiors and reliable WiFi make it a popular remote-work spot throughout the day. Also does a strong all-day breakfast menu.',
      cuisine_type: 'Continental',
      price_range: '$$',
      avg_rating: 4.5,
      address: 'F-11 Markaz, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0042, 33.7164] },
      tags: [T['Continental'], T['Vegetarian'], T['Vegan Friendly'], T['Gluten Free'], T['Halal'], T['Outdoor Seating'], T['Student Friendly'], T['Delivery']],
      thumbnail: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      owner_id: ownerSana._id,
      status: 'approved'
    }),

    // ── ADDITIONAL ISLAMABAD SPOTS ───────────────────────────────────────────

    Restaurant.create({
      name: 'Tuscany Courtyard',
      description: 'Islamabad\'s finest Italian restaurant, tucked inside a beautiful colonial courtyard in F-7. The handmade pasta is prepared daily in-house, the wood-fired pizza oven was imported from Naples, and the tiramisu is the best in Pakistan. The candlelit outdoor courtyard with its climbing vines is one of the most romantic settings in the city. A proper Italian escape in the heart of Islamabad.',
      cuisine_type: 'Italian',
      price_range: '$$$',
      avg_rating: 4.8,
      address: 'House 13, Street 9, F-7/2, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0522, 33.7230] },
      tags: [T['Italian'], T['Fine Dining'], T['Outdoor Seating'], T['Halal'], T['Family Friendly'], T['Vegetarian']],
      thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      owner_id: ownerKamran._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Cinnamon Café',
      description: 'A charming all-day café and brunch spot in F-6 Supermarket beloved by Islamabad\'s working crowd. Famous for its flaky croissants, shakshuka, eggs Benedict, and an outstanding coffee menu. The signature cinnamon rolls — warm, sticky and enormous — have earned a devoted following. A calm, friendly atmosphere that makes it equally good for a laptop workday or a leisurely weekend brunch.',
      cuisine_type: 'Continental',
      price_range: '$$',
      avg_rating: 4.6,
      address: 'F-6 Supermarket, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0518, 33.7305] },
      tags: [T['Continental'], T['Vegetarian'], T['Halal'], T['Outdoor Seating'], T['Student Friendly'], T['Delivery']],
      thumbnail: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      owner_id: ownerZara._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Salt\'n Pepper F-8',
      description: 'A Islamabad family dining institution in F-8 Markaz, going strong for over two decades. Salt\'n Pepper is known for its vast menu that does justice to both Pakistani classics — the karahi and biryani are excellent — and continental grills, pastas, and wood-fired dishes. Generous portions, fair prices, attentive service, and a comfortable setting make it the default choice for family celebrations.',
      cuisine_type: 'Pakistani',
      price_range: '$$',
      avg_rating: 4.3,
      address: 'F-8 Markaz, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0315, 33.7080] },
      tags: [T['Pakistani'], T['Continental'], T['Halal'], T['Family Friendly'], T['Delivery'], T['Takeaway']],
      thumbnail: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
      owner_id: ownerFatima._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Hotspot Restaurant F-10',
      description: 'A lively, no-frills fast food and grill spot in F-10 Markaz hugely popular with COMSATS and NUST students. The charcoal-grilled burgers, crispy fried chicken, and freshly made pizza are all reliable and generously sized. The loaded nachos and thick milkshakes have a cult following. Open until 3 AM — the place to be when you have a deadline and an empty stomach.',
      cuisine_type: 'Fast Food',
      price_range: '$',
      avg_rating: 4.1,
      address: 'F-10 Markaz, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0180, 33.7015] },
      tags: [T['Fast Food'], T['Halal'], T['Student Friendly'], T['Takeaway'], T['Delivery'], T['Late Night']],
      thumbnail: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',
      owner_id: ownerBilal._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'H-8 Charsi Karahi',
      description: 'A legendary open-air karahi spot in H-8/1 that has been drawing students and locals from across south Islamabad for over 15 years. The "charsi" mutton karahi — cooked in a screaming-hot wok with tomatoes, green chillies, fresh ginger and a secret spice blend — is ready in under 10 minutes and arrives still sizzling. The naans are pulled fresh from the tandoor. Cash only, plastic seating, extraordinary food.',
      cuisine_type: 'Pakistani',
      price_range: '$',
      avg_rating: 4.6,
      address: 'H-8/1, Near Poly Clinic, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0780, 33.6960] },
      tags: [T['Pakistani'], T['BBQ & Grills'], T['Halal'], T['Late Night'], T['Takeaway'], T['Student Friendly'], T['Family Friendly']],
      thumbnail: 'https://images.unsplash.com/photo-1567529692333-de9fd6772897?w=800',
      owner_id: ownerAhmed._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Pappasalis Pizza',
      description: 'Islamabad\'s most popular home-grown pizza brand, with a flagship in F-7. Pappasalis is famous for its generous toppings, thick-crust pizzas, and signature creamy white sauce. The BBQ chicken pizza and the four-cheese pizza are bestsellers. Also does excellent garlic bread, pastas, and a brilliant chocolate lava cake. Reliable delivery across the F and G sectors.',
      cuisine_type: 'Italian',
      price_range: '$$',
      avg_rating: 4.4,
      address: 'F-7 Markaz, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0490, 33.7250] },
      tags: [T['Italian'], T['Fast Food'], T['Halal'], T['Delivery'], T['Takeaway'], T['Student Friendly'], T['Family Friendly']],
      thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      owner_id: ownerSana._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Masoom\'s Restaurant',
      description: 'A much-loved family restaurant in F-6 that has been a staple of Islamabad dining for decades. Masoom\'s excels at traditional Pakistani cooking — the daal makhani, butter chicken, and biryani are consistently excellent — alongside a solid Chinese menu. The warm hospitality and reliably good food make it the kind of place families return to for every occasion, from birthday dinners to post-exam celebrations.',
      cuisine_type: 'Pakistani',
      price_range: '$$',
      avg_rating: 4.3,
      address: 'F-6/3, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0498, 33.7315] },
      tags: [T['Pakistani'], T['Chinese'], T['Halal'], T['Family Friendly'], T['Delivery'], T['Takeaway']],
      thumbnail: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
      owner_id: ownerKamran._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Chattar Forest Retreat',
      description: 'A secluded hilltop restaurant above Chattar hidden among tall pine trees, offering one of the most peaceful dining experiences near Islamabad. The menu is a curated selection of Pakistani grills, BBQ platters and simple continental dishes, all made with fresh ingredients. The open-air seating surrounded by forest is magical in the monsoon season when the mist rolls in over the hills.',
      cuisine_type: 'Pakistani',
      price_range: '$$',
      avg_rating: 4.5,
      address: 'Chattar Hill Road, Near Chattar, Murree Road, Pakistan',
      location: { type: 'Point', coordinates: [73.2280, 33.7740] },
      tags: [T['Pakistani'], T['BBQ & Grills'], T['Halal'], T['Outdoor Seating'], T['Family Friendly'], T['Fine Dining']],
      thumbnail: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      owner_id: ownerFatima._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Naan Stop — H-9',
      description: 'A fast, affordable Pakistani grill and paratha spot in H-9 catering specifically to students and staff from COMSATS and Quaid-i-Azam University. The breakfast paratha deal — two stuffed parathas, chai, and an omelette for Rs 280 — is legendary in the area. Lunch specials change daily and always include a karahi, a daal, and a biryani. Efficient, clean, and extremely student-friendly.',
      cuisine_type: 'Pakistani',
      price_range: '$',
      avg_rating: 4.2,
      address: 'H-9, Near QAU Gate 2, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0720, 33.6780] },
      tags: [T['Pakistani'], T['Street Food'], T['Halal'], T['Student Friendly'], T['Takeaway'], T['Delivery'], T['Late Night']],
      thumbnail: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800',
      owner_id: ownerBilal._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'The Bunker Café',
      description: 'A quirky, industrial-themed café in G-10 Markaz popular with COMSATS students for its strong coffee, filling sandwiches, and free high-speed WiFi. The all-day breakfast menu, grilled sandwiches, and cold brews are the highlights. Board games on every table and a playlist that always hits right. The go-to spot for study groups, project meetings, and anyone who just needs a good cup of coffee far from the lecture hall.',
      cuisine_type: 'Continental',
      price_range: '$',
      avg_rating: 4.3,
      address: 'G-10 Markaz, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0380, 33.6910] },
      tags: [T['Continental'], T['Fast Food'], T['Halal'], T['Vegetarian'], T['Student Friendly'], T['Delivery'], T['Late Night']],
      thumbnail: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      owner_id: ownerZara._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Andaaz Rooftop — F-7',
      description: 'A stylish rooftop restaurant above Jinnah Super with panoramic views of the Margalla Hills. Andaaz serves refined Pakistani and Mughal-inspired cuisine — the dum biryani is prepared in sealed degs, the haleem is silky and complex, and the dessert platter of kheer, gajar halwa and sohan halwa is a proper finale. Dress smart, book a table for sunset, and enjoy some of the finest food in Islamabad.',
      cuisine_type: 'Pakistani',
      price_range: '$$$',
      avg_rating: 4.7,
      address: 'Jinnah Super Market, F-7/2, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0545, 33.7225] },
      tags: [T['Pakistani'], T['Rooftop'], T['Fine Dining'], T['Halal'], T['Family Friendly'], T['Outdoor Seating']],
      thumbnail: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
      owner_id: ownerAhmed._id,
      status: 'approved'
    }),

  ]);
  console.log(`✔ Created ${restaurants.length} restaurants across Islamabad, Chattar & near COMSATS`);

  const [
    desiDhaba, campusGrill, g9Karahi, i8FoodStreet, tandooriNights,
    chattarKabab, pineView, murrreeNihari,
    monal, chaayeKhana, kabul, tabaq,
    savourFoods, lordOfWings, melodyBBQ, nomadCoffee,
    tuscany, cinnamonCafe, saltNPepper, hotspot, h8Charsi,
    pappasalis, masooms, chattarForest, naanStop, bunkerCafe,
    andaaz
  ] = restaurants;

  // ── 4. DISHES ─────────────────────────────────────────────────────────────
  const dishes = [

    // Desi Dhaba COMSATS
    { name: 'Daal Chawal', description: 'Classic yellow daal served over steaming basmati rice with a dollop of ghee and achaar on the side', price: 180, dietary_tags: ['halal', 'vegetarian'], restaurant_id: desiDhaba._id },
    { name: 'Aloo Gosht', description: 'Slow-cooked mutton and potato curry with a rich, deeply spiced shorba and fresh naan', price: 320, dietary_tags: ['halal', 'gluten-free'], restaurant_id: desiDhaba._id },
    { name: 'Special Lassi', description: 'Thick, creamy full-fat yoghurt lassi sweetened with sugar and topped with malai — the thickest in H-8', price: 120, dietary_tags: ['vegetarian', 'gluten-free'], restaurant_id: desiDhaba._id },
    { name: 'Aloo Paratha (2 pcs)', description: 'Golden spiced potato-stuffed flatbread served with fresh white butter and house pickle', price: 150, dietary_tags: ['vegetarian'], restaurant_id: desiDhaba._id },

    // Campus Grill House
    { name: 'Half-and-Half Burger', description: 'The cult-favourite: double-stacked beef patty and chicken tikka fillet in a toasted bun with garlic mayo and crispy onions', price: 350, dietary_tags: ['halal'], restaurant_id: campusGrill._id },
    { name: 'Loaded Campus Fries', description: 'Crispy fries loaded with chilli sauce, mayo, cheddar and pickled jalapeños', price: 220, dietary_tags: ['vegetarian', 'halal'], restaurant_id: campusGrill._id },
    { name: 'Chicken Roll', description: 'Crispy fried chicken strips wrapped in a soft roti with lettuce, tomato and house chilli sauce', price: 260, dietary_tags: ['halal'], restaurant_id: campusGrill._id },

    // G-9 Karahi House
    { name: 'Mutton Karahi (1 kg)', description: 'Wok-tossed mutton with fresh tomatoes, ginger julienne, green chillies and a heavy hand of bhuna spices. Served with 4 naans', price: 1800, dietary_tags: ['halal', 'gluten-free'], restaurant_id: g9Karahi._id },
    { name: 'Chicken Handi', description: 'Tender chicken slow-cooked in a clay pot with cream, cashew paste and aromatic desi spices', price: 950, dietary_tags: ['halal', 'gluten-free'], restaurant_id: g9Karahi._id },
    { name: 'Rosh (Lamb Brain Masala)', description: 'A local delicacy — lamb brain cooked with green chillies, ginger and tomatoes, served with naan', price: 480, dietary_tags: ['halal'], restaurant_id: g9Karahi._id },

    // I-8 Food Street
    { name: 'Seekh Kabab (4 pcs)', description: 'Coal-fired hand-minced beef seekh kababs with herbs and house spice blend, served with mint chutney and paratha', price: 380, dietary_tags: ['halal'], restaurant_id: i8FoodStreet._id },
    { name: 'Nihari', description: 'Slow-cooked overnight beef shank stew with bone marrow and a rich shorba — the Sunday morning special', price: 420, dietary_tags: ['halal'], restaurant_id: i8FoodStreet._id },
    { name: 'Biryani (Full)', description: 'Aromatic Islamabad-style biryani with tender chicken, whole spices and saffron-tinted basmati', price: 380, dietary_tags: ['halal'], restaurant_id: i8FoodStreet._id },

    // Tandoori Nights G-11
    { name: 'Tandoori Platter for 2', description: 'Reshmi kabab, chicken boti, seekh kabab, malai tikka and 4 fresh naans — perfect for sharing', price: 1200, dietary_tags: ['halal'], restaurant_id: tandooriNights._id },
    { name: 'Daal Makhani', description: 'Black lentils simmered for hours in butter and tomatoes with a smoky finish', price: 380, dietary_tags: ['vegetarian', 'gluten-free'], restaurant_id: tandooriNights._id },
    { name: 'Gulab Jamun (3 pcs)', description: 'House-made melt-in-the-mouth gulab jamun in a fragrant rose sugar syrup', price: 160, dietary_tags: ['vegetarian'], restaurant_id: tandooriNights._id },

    // Chattar Chowk Kabab Corner
    { name: 'Seekh Kabab Roll', description: 'Fresh coal-fired seekh kabab wrapped in a rumali roti with mint chutney and sliced onions — the iconic Chattar Chowk combo', price: 280, dietary_tags: ['halal'], restaurant_id: chattarKabab._id },
    { name: 'Bun Kabab', description: 'Spiced beef patty in a soft bun with chilli sauce, ketchup and pickled cucumbers — a roadside classic', price: 160, dietary_tags: ['halal'], restaurant_id: chattarKabab._id },
    { name: 'Doodh Patti Chai', description: 'Strong milk tea simmered with tea leaves, cardamom and a touch of ginger — the perfect roadside chai', price: 80, dietary_tags: ['vegetarian', 'gluten-free'], restaurant_id: chattarKabab._id },

    // Pine View Café & Grill
    { name: 'Stuffed Chicken Breast', description: 'Grilled chicken breast filled with sun-dried tomatoes, spinach and mozzarella, served with roasted vegetables and garlic bread', price: 1400, dietary_tags: ['halal', 'gluten-free'], restaurant_id: pineView._id },
    { name: 'Creamy Arabiata Pasta', description: 'Penne in a spicy tomato-cream sauce with roasted bell peppers, olives and fresh basil', price: 1100, dietary_tags: ['vegetarian'], restaurant_id: pineView._id },
    { name: 'Pine View BBQ Platter', description: 'Chicken tikka, seekh kabab, boti and grilled vegetables with naan, raita and chutney', price: 1800, dietary_tags: ['halal'], restaurant_id: pineView._id },

    // Murree Road Nihari House
    { name: 'Beef Nihari', description: '12-hour slow-cooked beef shank nihari with bone marrow served with freshly baked naan and condiments', price: 480, dietary_tags: ['halal'], restaurant_id: murrreeNihari._id },
    { name: 'Paya Shorba', description: 'Rich, gelatinous trotters in a deeply spiced broth — the Sunday morning ritual on Murree Road', price: 420, dietary_tags: ['halal', 'gluten-free'], restaurant_id: murrreeNihari._id },

    // Monal Islamabad
    { name: 'Monal Sajji', description: 'Whole roasted chicken marinated in rock salt and spices, slow-cooked over embers — Balochi style', price: 2200, dietary_tags: ['halal', 'gluten-free'], restaurant_id: monal._id },
    { name: 'Cheese Naan', description: 'Monal\'s legendary cheese-stuffed tandoor naan — a must-order for every table', price: 380, dietary_tags: ['vegetarian'], restaurant_id: monal._id },
    { name: 'Monal Special Karahi', description: 'Aromatic karahi with tender mutton, tomatoes and fresh coriander — cooked in a wok over live flame', price: 2400, dietary_tags: ['halal', 'gluten-free'], restaurant_id: monal._id },

    // Chaaye Khana F-7
    { name: 'Kashmiri Chai', description: 'Pink Kashmiri salt tea brewed with cardamom and topped with crushed pistachios and cream', price: 250, dietary_tags: ['vegetarian', 'gluten-free'], restaurant_id: chaayeKhana._id },
    { name: 'Samosa Platter (4 pcs)', description: 'Crispy hand-folded samosas with spiced potato-pea filling, served with tamarind and mint chutneys', price: 320, dietary_tags: ['vegan', 'halal'], restaurant_id: chaayeKhana._id },
    { name: 'Aloo Paratha', description: 'Spiced potato-stuffed flatbread served with white butter and house pickle', price: 280, dietary_tags: ['vegetarian'], restaurant_id: chaayeKhana._id },

    // Kabul Restaurant
    { name: 'Kabuli Pulao', description: 'Afghanistan\'s national dish: long-grain rice in lamb broth with raisins, carrots and whole spices, topped with tender braised lamb', price: 1400, dietary_tags: ['halal', 'gluten-free'], restaurant_id: kabul._id },
    { name: 'Lamb Chops (4 pcs)', description: 'Overnight-marinated lamb chops grilled over charcoal with Afghan spice rub', price: 1800, dietary_tags: ['halal', 'gluten-free'], restaurant_id: kabul._id },

    // Tabaq F-6
    { name: 'Dum Biryani (2 pax)', description: 'Slow-cooked biryani sealed in a deg with saffron, fried onions and whole spices — served with raita and salad', price: 1600, dietary_tags: ['halal'], restaurant_id: tabaq._id },
    { name: 'Tabaq Mixed Grill', description: 'Seekh, chicken tikka, reshmi kabab and boti with rooftop views and fresh naan', price: 2200, dietary_tags: ['halal'], restaurant_id: tabaq._id },

    // Savour Foods
    { name: 'Pulao Kabab Deal', description: 'The iconic Islamabad combo: steaming mutton pulao with two seekh kababs and raita', price: 450, dietary_tags: ['halal', 'gluten-free'], restaurant_id: savourFoods._id },
    { name: 'Mutton Pulao (Full)', description: 'Aromatic basmati slow-cooked in mutton stock with whole spices and tender meat', price: 780, dietary_tags: ['halal', 'gluten-free'], restaurant_id: savourFoods._id },

    // Lord of the Wings
    { name: 'Classic Buffalo Wings (8 pcs)', description: 'Crispy fried wings tossed in classic buffalo sauce, served with blue cheese dip and celery sticks', price: 980, dietary_tags: ['halal'], restaurant_id: lordOfWings._id },
    { name: 'Ghost Pepper Challenge (12 pcs)', description: 'For the brave — wings coated in ghost pepper sauce. Finish alone and get on the wall of fame', price: 1400, dietary_tags: ['halal'], restaurant_id: lordOfWings._id },
    { name: 'Loaded Mac & Cheese Bites', description: 'Crispy fried mac and cheese bites with a smoky chipotle dipping sauce', price: 650, dietary_tags: ['vegetarian'], restaurant_id: lordOfWings._id },

    // Melody BBQ
    { name: 'Half Chicken Tikka', description: 'Overnight-marinated half chicken grilled over live coal — crispy outside, perfectly juicy inside', price: 850, dietary_tags: ['halal', 'gluten-free'], restaurant_id: melodyBBQ._id },
    { name: 'Charsi Karahi (1 kg)', description: 'Islamabad\'s beloved charsi-style mutton karahi — fiery, fragrant and cooked in front of you', price: 2000, dietary_tags: ['halal', 'gluten-free'], restaurant_id: melodyBBQ._id },

    // Nomad Coffee
    { name: 'Single Origin Pour-Over', description: 'Rotating single-origin beans from Ethiopia, Colombia or Guatemala — ask the barista for the current selection', price: 450, dietary_tags: ['vegan', 'gluten-free', 'vegetarian'], restaurant_id: nomadCoffee._id },
    { name: 'Avocado Toast', description: 'Sourdough toast with smashed avocado, poached eggs, chilli flakes, and microgreens', price: 850, dietary_tags: ['vegetarian'], restaurant_id: nomadCoffee._id },
    { name: 'Overnight Oats', description: 'Rolled oats soaked in almond milk with chia seeds, mango, and a drizzle of honey', price: 650, dietary_tags: ['vegan', 'gluten-free', 'vegetarian'], restaurant_id: nomadCoffee._id },

    // Tuscany Courtyard
    { name: 'Handmade Tagliatelle al Ragù', description: 'Daily-made egg pasta with a slow-cooked beef ragù, parmesan and fresh basil', price: 1800, dietary_tags: ['halal'], restaurant_id: tuscany._id },
    { name: 'Margherita from the Wood Fire', description: 'San Marzano tomato, fior di latte mozzarella and fresh basil on a Neapolitan-style thin crust', price: 1400, dietary_tags: ['vegetarian', 'halal'], restaurant_id: tuscany._id },
    { name: 'Tiramisu', description: 'Made fresh every morning with mascarpone, Ladyfinger biscuits, espresso and a dusting of Valrhona cocoa', price: 850, dietary_tags: ['vegetarian'], restaurant_id: tuscany._id },

    // Cinnamon Café
    { name: 'Cinnamon Roll', description: 'Giant, warm, gooey cinnamon roll with cream cheese frosting — baked fresh every two hours', price: 380, dietary_tags: ['vegetarian'], restaurant_id: cinnamonCafe._id },
    { name: 'Shakshuka', description: 'Two eggs poached in a spiced tomato-pepper sauce with feta, olives and sourdough soldiers', price: 680, dietary_tags: ['vegetarian'], restaurant_id: cinnamonCafe._id },
    { name: 'Flat White', description: 'Double-shot espresso with velvety microfoam milk — available with almond or oat milk', price: 320, dietary_tags: ['vegetarian', 'gluten-free'], restaurant_id: cinnamonCafe._id },

    // Salt'n Pepper F-8
    { name: 'Chicken Karahi (Half)', description: 'Classic wok-fired chicken karahi with tomatoes, green chillies and fresh coriander, served with naan', price: 760, dietary_tags: ['halal', 'gluten-free'], restaurant_id: saltNPepper._id },
    { name: 'Grilled Chicken Steak', description: 'Marinated 200g chicken breast, grilled and served with sautéed vegetables, mash and peppercorn sauce', price: 980, dietary_tags: ['halal', 'gluten-free'], restaurant_id: saltNPepper._id },
    { name: 'Chicken Pulao', description: 'Fragrant whole-spice chicken pulao in the Islamabad style, served with raita and salad', price: 520, dietary_tags: ['halal', 'gluten-free'], restaurant_id: saltNPepper._id },

    // Hotspot F-10
    { name: 'Hotspot Signature Burger', description: 'Double beef patty with cheddar, caramelised onions, pickles and the secret Hotspot sauce in a brioche bun', price: 480, dietary_tags: ['halal'], restaurant_id: hotspot._id },
    { name: 'Crispy Fried Chicken Meal', description: 'Three pieces of golden crispy fried chicken with coleslaw, fries and a drink', price: 550, dietary_tags: ['halal'], restaurant_id: hotspot._id },
    { name: 'Thick Chocolate Milkshake', description: 'Blended Belgian chocolate ice cream, fresh milk and chocolate syrup — served in a mason jar', price: 320, dietary_tags: ['vegetarian'], restaurant_id: hotspot._id },

    // H-8 Charsi Karahi
    { name: 'Charsi Mutton Karahi (500g)', description: 'The real thing — wok-tossed mutton in a screaming-hot kahai with tomatoes, ginger and green chillies. Ready in 8 minutes.', price: 980, dietary_tags: ['halal', 'gluten-free'], restaurant_id: h8Charsi._id },
    { name: 'Chicken Charsi Karahi (Half)', description: 'H-8\'s famous charsi-style chicken karahi — bold, peppery and sizzling hot', price: 680, dietary_tags: ['halal', 'gluten-free'], restaurant_id: h8Charsi._id },
    { name: 'Tandoori Naan', description: 'Freshly pulled naan from the tandoor — plain, buttered or with garlic', price: 60, dietary_tags: ['vegetarian', 'halal'], restaurant_id: h8Charsi._id },

    // Pappasalis
    { name: 'BBQ Chicken Pizza (Large)', description: 'Smoky BBQ sauce base, grilled chicken, red onions, peppers and mozzarella on a thick golden crust', price: 1350, dietary_tags: ['halal'], restaurant_id: pappasalis._id },
    { name: 'Four Cheese Pizza (Medium)', description: 'Mozzarella, cheddar, parmesan and cream cheese on a white garlic sauce base', price: 1100, dietary_tags: ['vegetarian', 'halal'], restaurant_id: pappasalis._id },
    { name: 'Chocolate Lava Cake', description: 'Warm dark chocolate fondant with a molten centre, served with a scoop of vanilla ice cream', price: 420, dietary_tags: ['vegetarian'], restaurant_id: pappasalis._id },

    // Masoom's
    { name: 'Butter Chicken', description: 'Tender chicken tikka pieces in a velvety tomato-butter-cream gravy — a Masoom\'s classic since day one', price: 780, dietary_tags: ['halal', 'gluten-free'], restaurant_id: masooms._id },
    { name: 'Daal Makhani', description: 'Black lentils slow-simmered overnight with butter, cream and a touch of fenugreek', price: 420, dietary_tags: ['vegetarian', 'gluten-free'], restaurant_id: masooms._id },
    { name: 'Chicken Fried Rice', description: 'Fragrant wok-fried rice with egg, spring onion, chicken and soy — from the Chinese side of the menu', price: 550, dietary_tags: ['halal'], restaurant_id: masooms._id },

    // Chattar Forest Retreat
    { name: 'Forest BBQ Platter', description: 'Chicken tikka, seekh kabab, boti and grilled vegetables in a pine-forest setting — served with naan and dips', price: 2200, dietary_tags: ['halal'], restaurant_id: chattarForest._id },
    { name: 'Monsoon Karahi', description: 'Slow-cooked mutton karahi with mountain herbs, served in a clay pot on the open-air deck', price: 1600, dietary_tags: ['halal', 'gluten-free'], restaurant_id: chattarForest._id },
    { name: 'Kahwa', description: 'Kashmiri green tea with cardamom, cinnamon, saffron and crushed almonds', price: 250, dietary_tags: ['vegetarian', 'vegan', 'gluten-free'], restaurant_id: chattarForest._id },

    // Naan Stop H-9
    { name: 'Breakfast Paratha Deal', description: 'Two stuffed parathas (aloo or keema), masala omelette and a cup of doodh patti chai', price: 280, dietary_tags: ['halal', 'vegetarian'], restaurant_id: naanStop._id },
    { name: 'Chicken Karahi (Full)', description: 'Fresh charsi-style chicken karahi cooked to order with naan — daily lunch special', price: 680, dietary_tags: ['halal', 'gluten-free'], restaurant_id: naanStop._id },
    { name: 'Student Biryani (Half)', description: 'Spiced chicken biryani with raita and salad — the most popular lunch on campus', price: 220, dietary_tags: ['halal', 'gluten-free'], restaurant_id: naanStop._id },

    // Bunker Café
    { name: 'All-Day Breakfast Plate', description: 'Two eggs any style, grilled tomato, baked beans, sourdough toast and your choice of coffee or tea', price: 580, dietary_tags: ['vegetarian', 'halal'], restaurant_id: bunkerCafe._id },
    { name: 'Grilled Club Sandwich', description: 'Triple-decker with grilled chicken, streaky beef, lettuce, tomato, cheddar and mayo on toasted sourdough', price: 480, dietary_tags: ['halal'], restaurant_id: bunkerCafe._id },
    { name: 'Cold Brew Coffee', description: 'Slow-steeped 18-hour cold brew, served over ice — strong, smooth and perfect for late-night studying', price: 380, dietary_tags: ['vegan', 'vegetarian', 'gluten-free'], restaurant_id: bunkerCafe._id },

    // Andaaz Rooftop
    { name: 'Dum Biryani (Deg Style)', description: 'Sealed-deg biryani with tender mutton, saffron and fried onions — prepared the traditional way', price: 2200, dietary_tags: ['halal'], restaurant_id: andaaz._id },
    { name: 'Haleem', description: 'Silky, complex haleem slow-cooked with wheat, barley, lentils and mutton — topped with ginger, lemon and crispy shallots', price: 950, dietary_tags: ['halal'], restaurant_id: andaaz._id },
    { name: 'Dessert Platter', description: 'Kheer, gajar halwa and sohan halwa — a trio of classic Pakistani sweets to finish your meal', price: 680, dietary_tags: ['vegetarian', 'gluten-free'], restaurant_id: andaaz._id },
  ];

  await Promise.all(dishes.map(d => Dish.create(d)));
  console.log(`✔ Created ${dishes.length} dishes`);

  // ── 5. REVIEWS ────────────────────────────────────────────────────────────
  const reviewData = [
    // Desi Dhaba COMSATS
    { r: desiDhaba, u: userAli,    rating: 5, body: 'As a COMSATS student this dhaba has literally saved my life. The daal chawal is exactly what you need after a 3-hour lab session — warm, filling and so affordable. The aloo gosht on Fridays is incredible. I eat here at least 4 times a week.' },
    { r: desiDhaba, u: userUsman,  rating: 4, body: 'Best value food near COMSATS without a doubt. The aloo paratha and lassi combo in the morning is unbeatable at Rs 270. The uncle who runs it is also very friendly with students. Only downside is it gets packed between 1-2pm.' },
    { r: desiDhaba, u: userAyesha, rating: 4, body: 'The aloo gosht here is really something special — slow-cooked and deeply flavoured. Perfect quick lunch between classes. Their tea is also really good!' },

    // Campus Grill House
    { r: campusGrill, u: userHamza,  rating: 5, body: 'The Half-and-Half Burger is my favourite thing near COMSATS. No competition. Beef patty and chicken tikka together — it sounds weird but it is absolutely brilliant. The loaded fries are also top tier. Open till 2am which is a lifesaver during finals.' },
    { r: campusGrill, u: userOmar,   rating: 4, body: 'Solid fast food spot that understands students. Everything is fresh, the portions are generous and the price is right. The chicken roll is great for when you are in a hurry between lectures.' },
    { r: campusGrill, u: userUsman,  rating: 4, body: 'Great late-night option when you are studying. The loaded fries are addictive. The burger could use a bit more sauce but still very tasty for the price.' },

    // G-9 Karahi House
    { r: g9Karahi, u: userAli,    rating: 5, body: 'The mutton karahi here is the real deal. Sizzling hot, perfectly spiced, and the meat is so tender. I come here with my family every other weekend from the H-8 area and nobody has ever been disappointed. The naans are also excellent.' },
    { r: g9Karahi, u: userMariam, rating: 4, body: 'One of the best karahis in Islamabad. The chicken handi is rich and creamy without being too heavy. Decent prices for the quality. Gets busy on weekends so try to go early.' },
    { r: g9Karahi, u: userSofia,  rating: 5, body: 'I have tried karahi all over Islamabad and this G-9 spot is consistently among the very best. The tomato-ginger combination with fresh coriander is perfect. Large portions too.' },

    // I-8 Food Street
    { r: i8FoodStreet, u: userHamza, rating: 5, body: 'I-8 food street is where I take everyone who visits Islamabad. The seekh kababs on coal are outstanding and the nihari on Sunday morning is a sacred ritual for me. Great prices, great atmosphere, very close to COMSATS.' },
    { r: i8FoodStreet, u: userOmar,  rating: 4, body: 'The biryani here is genuinely good — fragrant and well-portioned. The seekh kabab stall in particular is legendary. Best visited in the evening when it is really buzzing.' },

    // Tandoori Nights G-11
    { r: tandooriNights, u: userAyesha, rating: 4, body: 'Discovered this place during exam week when we needed a proper dinner on a budget. The tandoori platter for 2 is excellent value — everything was freshly grilled. The daal makhani is very good. Will definitely return.' },
    { r: tandooriNights, u: userUsman,  rating: 4, body: 'A hidden gem in G-11. Good quality Pakistani food at student-friendly prices. The gulab jamun is made in-house and it shows. Friendly staff too.' },

    // Chattar Kabab Corner
    { r: chattarKabab, u: userAli,    rating: 5, body: 'This place is legendary on the Murree Road. Every single time we pass through Chattar we stop here, no exceptions. The seekh kabab roll is the perfect road-trip food — juicy, fresh, and the mint chutney is extraordinary. Worth the detour if you are anywhere near Islamabad.' },
    { r: chattarKabab, u: userMariam, rating: 5, body: 'The Chattar kabab stop is a Islamabad institution that every local knows. The coal-fired kababs smell incredible from the road and taste even better. The chai is perfectly made and costs almost nothing. An essential stop.' },
    { r: chattarKabab, u: userSofia,  rating: 4, body: 'Classic roadside kabab experience done perfectly. The bun kabab is simple but so satisfying. Great place to stop when heading to Murree.' },

    // Pine View Chattar
    { r: pineView, u: userHamza,  rating: 5, body: 'Pine View is one of those rare spots where everything works — the food, the view, the vibe. The stuffed chicken breast is beautifully done and sitting on the outdoor deck looking out over Islamabad while the mist drifts through the pines is absolutely magical. Perfect for a weekend lunch.' },
    { r: pineView, u: userOmar,   rating: 4, body: 'Great food in a stunning setting above Chattar. The BBQ platter was well-grilled and the pasta was genuinely creamy and flavourful. The view is the real showstopper though — tables on the deck fill up fast, book ahead.' },

    // Murree Road Nihari House
    { r: murrreeNihari, u: userAyesha, rating: 4, body: 'The nihari here is a serious labour of love — 12 hours of slow cooking and you can taste every single one of them. The bone marrow is incredible. Perfect roadside stop when heading up to Murree or coming back late into Islamabad.' },
    { r: murrreeNihari, u: userUsman,  rating: 4, body: 'Simple but exceptional nihari. The paya shorba on Sunday is something I look forward to every week. Very affordable and the naan is always fresh. An honest, hardworking kitchen.' },

    // Monal
    { r: monal, u: userMariam, rating: 5, body: 'Monal is one of the greatest dining experiences in all of Pakistan. The hilltop location, the cool Margalla breeze, and the sajji cooked to absolute perfection — crispy outside, impossibly juicy inside. Go at sunset and book the outdoor table. Unforgettable.' },
    { r: monal, u: userHamza,  rating: 5, body: 'I have taken every single person who visits Islamabad to Monal and nobody has ever been disappointed. The cheese naan alone justifies the drive up the hill. The view at night with the capital spread below you is breathtaking.' },
    { r: monal, u: userSofia,  rating: 5, body: 'Absolutely iconic. The karahi is smoky and perfectly spiced and the sajji may be the best in Pakistan. Book ahead or expect a very long wait on weekends. Worth every minute.' },

    // Chaaye Khana
    { r: chaayeKhana, u: userSofia,  rating: 5, body: 'Chaaye Khana is my favourite spot in all of Islamabad. The Kashmiri chai is the best in the city — creamy, lightly salty, topped with pistachios. The whole vibe of the old building with books and good music is just perfect. The samosas pair beautifully with the chai.' },
    { r: chaayeKhana, u: userOmar,   rating: 4, body: 'A wonderful place to spend an afternoon. The chai menu is genuinely impressive with dozens of varieties. The food is tasty and affordable. Always full of the most interesting crowd in Islamabad.' },
    { r: chaayeKhana, u: userAli,    rating: 4, body: 'My go-to study spot in F-7. The WiFi works, the chai keeps coming, the samosas are excellent and nobody rushes you. Ideal for long afternoons with a book or laptop.' },

    // Kabul
    { r: kabul, u: userMariam, rating: 5, body: 'The Kabuli Pulao here is absolutely the best in Islamabad — deeply aromatic, the lamb is perfectly braised, and the sweet carrots and raisins give it that distinctive character that transports you completely. Exceptional.' },
    { r: kabul, u: userHamza,  rating: 4, body: 'The lamb chops were phenomenal — marinated overnight and grilled beautifully. Solid, reliable Afghan food in a comfortable F-7 setting. One of Islamabad\'s most consistent restaurants.' },

    // Tabaq
    { r: tabaq, u: userSofia,  rating: 4, body: 'Tabaq on the rooftop in F-6 is a lovely evening out. The dum biryani is excellent — properly slow-cooked in the deg, nicely spiced. The view from the terrace looking towards the Margallas is very pleasant. Good service too.' },
    { r: tabaq, u: userAyesha, rating: 4, body: 'Really enjoyable dinner at Tabaq. The mixed grill is generous and everything was well-cooked. The rooftop setting in autumn is especially nice. Slightly on the pricier side but worth it for the quality and ambiance.' },

    // Savour Foods
    { r: savourFoods, u: userAli,  rating: 5, body: 'The pulao kabab deal is one of the great cheap eats of Pakistan. At this price point the quality is staggering. The mutton pulao is aromatic and perfectly balanced. I have been eating here since university and it never changes — and it never needs to.' },
    { r: savourFoods, u: userOmar, rating: 4, body: 'Savour Foods has been nailing the pulao for over 40 years and you can taste that experience. Always a queue at lunch but it moves fast. Perfect Blue Area stop.' },

    // Lord of the Wings
    { r: lordOfWings, u: userHamza,  rating: 4, body: 'The buffalo wings are genuinely excellent — proper crispy, great sauce selection. The ghost pepper challenge is no joke; my friend made it through 8 and gave up. The mac and cheese bites are the underrated star. Fun, loud, good for groups.' },
    { r: lordOfWings, u: userUsman,  rating: 4, body: 'Great spot in F-10 for wings and burgers. The loaded fries are addictive. Prices are fair for the quality. Gets lively in the evenings — good atmosphere.' },

    // Melody BBQ
    { r: melodyBBQ, u: userAli,    rating: 5, body: 'Melody BBQ on a Friday evening is peak Islamabad. The charsi karahi is prepared right in front of you, the coal glow, the sizzle, the aroma — it is a full sensory experience. The half chicken tikka is outstanding. An institution.' },
    { r: melodyBBQ, u: userMariam, rating: 4, body: 'Really good BBQ in an outdoor setting. The chicken tikka was juicy and perfectly charred. The karahi arrives absolutely sizzling and the spice level is exactly right. Great for a casual family dinner.' },

    // Nomad Coffee
    { r: nomadCoffee, u: userSofia,  rating: 5, body: 'Finally a proper specialty coffee shop in Islamabad. The Ethiopian pour-over was exceptional — bright, fruity, beautiful clarity. The avocado toast is the best I\'ve had in Pakistan. Also the best place to work remotely with reliable WiFi and a calm atmosphere.' },
    { r: nomadCoffee, u: userAyesha, rating: 5, body: 'Nomad has completely spoiled me for regular coffee. The overnight oats are so good and the flat white is consistently excellent. The industrial decor is lovely and it never feels overcrowded. My favourite café in Islamabad.' },

    // Tuscany Courtyard
    { r: tuscany, u: userMariam, rating: 5, body: 'The best Italian restaurant in Pakistan, full stop. The handmade pasta is extraordinary — you can taste the freshness in every bite. The courtyard at night, lit by candles with vines overhead, is the most romantic setting in Islamabad. The tiramisu is a masterclass.' },
    { r: tuscany, u: userSofia,  rating: 5, body: 'I have been to Italy and Tuscany Courtyard genuinely holds its own. The wood-fired margherita is perfect — the crust has exactly the right char, the mozzarella is fresh. Pricey but absolutely worth it for a special occasion.' },

    // Cinnamon Café
    { r: cinnamonCafe, u: userAyesha, rating: 5, body: 'The cinnamon rolls here are life-changing. Warm, gooey, enormous — I look forward to them every weekend. The shakshuka is also brilliant and the flat white is consistently the best coffee I have had in Islamabad. My favourite café in the city.' },
    { r: cinnamonCafe, u: userOmar,   rating: 4, body: 'A lovely all-day café in F-6. The vibe is calm and welcoming, the WiFi is fast and the food is genuinely tasty. The shakshuka is perfectly spiced. Good place to work from for a few hours on a Saturday morning.' },

    // Salt'n Pepper F-8
    { r: saltNPepper, u: userAli,    rating: 4, body: 'A true Islamabad institution. The chicken karahi is consistently good and the grilled steak is impressive for a Pakistani family restaurant. Great for family dinners — the menu is wide enough for everyone to find something they love.' },
    { r: saltNPepper, u: userUsman,  rating: 4, body: 'Salt\'n Pepper has been around for years and for good reason. Reliable, generous portions and the chicken pulao is very tasty. A solid, dependable choice for family gatherings in the F-8 area.' },

    // Hotspot F-10
    { r: hotspot, u: userHamza, rating: 4, body: 'The Hotspot signature burger is genuinely one of the best fast-food burgers near COMSATS. The double patty with that secret sauce is outstanding. Open till 3am which is a lifesaver during finals week. The chocolate milkshake is thick and brilliant.' },
    { r: hotspot, u: userOmar,  rating: 4, body: 'Great late-night option for students in the F-10 / G-10 corridor. The crispy fried chicken meal is good value and the milkshakes are properly thick. Lively atmosphere in the evenings. Highly recommend for group dinners.' },

    // H-8 Charsi Karahi
    { r: h8Charsi, u: userAli,   rating: 5, body: 'The best charsi karahi within 5km of COMSATS, no contest. The mutton is incredibly tender and the sauce has that perfect bhuna spice. The naan is pulled fresh from the tandoor while you wait. Cash only and worth every rupee.' },
    { r: h8Charsi, u: userUsman, rating: 4, body: 'Legendary open-air karahi spot in H-8. The chicken charsi karahi is ready in minutes and tastes like it has been cooking all day. Very popular with students — get there early on weekends or you will be waiting.' },

    // Pappasalis
    { r: pappasalis, u: userHamza,  rating: 4, body: 'The BBQ chicken pizza is exactly what you want from a pizza place — generous toppings, great crust, good sauce. The four-cheese pizza is brilliant too. The chocolate lava cake dessert is a must. Reliable delivery across F-7 and surrounding areas.' },
    { r: pappasalis, u: userAyesha, rating: 4, body: 'One of the best local pizza brands in Islamabad. The thick crust pizzas are excellent and the toppings are always fresh. The lava cake is dangerously good. Good value for the quality and the delivery is always on time.' },

    // Masoom's
    { r: masooms, u: userMariam, rating: 4, body: 'Masoom\'s has been a staple of our family dinners for as long as I can remember. The butter chicken is rich and velvety — the recipe clearly has not changed in decades. The Chinese menu is also surprisingly good. Consistent, welcoming, excellent value.' },
    { r: masooms, u: userSofia,  rating: 4, body: 'A dependable classic in F-6. The daal makhani is exactly as a daal makhani should be — rich, creamy and deeply flavoured. The chicken fried rice from the Chinese menu is very good. Genuinely family-friendly pricing and atmosphere.' },

    // Chattar Forest Retreat
    { r: chattarForest, u: userHamza, rating: 5, body: 'One of the most magical dining experiences near Islamabad. The forest BBQ platter in the middle of pine trees is unlike anything else. The monsoon karahi arrived sizzling in a clay pot. If you are driving anywhere near Chattar, stop here.' },
    { r: chattarForest, u: userOmar,  rating: 4, body: 'Stunning setting — pine trees all around and total peace and quiet. The food is well above average for an outdoor grill spot. The kahwa is beautifully made. A great escape from the city for a long lunch on a weekend.' },

    // Naan Stop H-9
    { r: naanStop, u: userAyesha, rating: 4, body: 'The Rs 280 breakfast paratha deal is one of the great bargains in Islamabad. Two stuffed parathas, an omelette and a full cup of chai — I start most of my uni mornings here. The biryani at lunch is also excellent for the price.' },
    { r: naanStop, u: userUsman,  rating: 4, body: 'Exactly the kind of spot you need near a university. Fast, clean, generous portions and everything is properly halal. The student biryani at Rs 220 is almost comically good value. The aloo paratha is the best breakfast deal near QAU.' },

    // Bunker Café
    { r: bunkerCafe, u: userSofia,  rating: 4, body: 'The Bunker is my go-to study café in G-10. Fast WiFi, good music, board games, and the cold brew is excellent. The all-day breakfast plate is very generous. Nobody rushes you out even if you sit for 4 hours on a laptop. Exactly what a student café should be.' },
    { r: bunkerCafe, u: userAyesha, rating: 4, body: 'Lovely industrial-chic café in G-10 Markaz. The grilled club sandwich is the best I have had near COMSATS — very generous and the sourdough is properly toasted. The cold brew is strong and smooth. A great place to get through a project in peace.' },

    // Andaaz Rooftop
    { r: andaaz, u: userOmar,   rating: 5, body: 'Andaaz is the finest Pakistani dining in Islamabad. The dum biryani from the deg is extraordinary — fragrant, properly rested, with tender mutton throughout. The haleem is silky and complex. The rooftop with Margalla views at sunset is just perfect.' },
    { r: andaaz, u: userHamza,  rating: 5, body: 'A truly special restaurant. The dessert platter is a brilliant way to end — the sohan halwa alone is worth the visit. Service is attentive without being intrusive. The best high-end Pakistani restaurant in the city.' },
    { r: andaaz, u: userSofia,  rating: 4, body: 'Beautiful rooftop setting and excellent food. The dum biryani is superb. Slightly pricier than other options in F-7 but the quality and the ambiance absolutely justify it for a special occasion.' },
  ];

  const usedPairs = new Set();
  let reviewCount = 0;
  for (const { r, u, rating, body } of reviewData) {
    const key = `${u._id}-${r._id}`;
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);
    await Review.create({ user_id: u._id, restaurant_id: r._id, rating, body, status: 'active' });
    reviewCount++;
  }
  console.log(`✔ Created ${reviewCount} reviews`);

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete! — Islamabad / Chattar / COMSATS Edition\n');
  console.log('AREAS COVERED:');
  console.log('  Near COMSATS H-8  → Desi Dhaba, Campus Grill House, H-8 Charsi Karahi');
  console.log('  G-9 / I-8 / G-11  → G-9 Karahi House, I-8 Food Street, Tandoori Nights');
  console.log('  H-9 / G-10        → Naan Stop, Bunker Café');
  console.log('  Chattar/Murree Rd → Chattar Kabab, Pine View, Nihari House, Chattar Forest');
  console.log('  F-7 / F-6         → Monal, Chaaye Khana, Kabul, Tabaq, Andaaz, Nomad, Tuscany, Cinnamon Café, Masoom\'s, Pappasalis');
  console.log('  F-8               → Salt\'n Pepper');
  console.log('  F-10              → Lord of the Wings, Hotspot');
  console.log('  Blue Area / G-7   → Savour Foods, Melody BBQ');
  console.log('─────────────────────────────────────────────────────────');
  console.log('Admin:              admin@foodscope.com        / Admin1234!');
  console.log('Restaurant Owner 1: zara.sheikh@foodscope.com  / Owner1234!');
  console.log('Restaurant Owner 2: ahmed.raza@foodscope.com   / Owner1234!');
  console.log('Customer:           ali@example.com             / User1234!');
  console.log('Customer:           mariam@example.com          / User1234!');
  console.log('Customer:           ayesha@example.com          / User1234!');
  console.log('─────────────────────────────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

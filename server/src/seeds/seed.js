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
    savourFoods, lordOfWings, melodyBBQ, nomadCoffee, andaaz
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
  console.log('  Near COMSATS H-8  → Desi Dhaba, Campus Grill House');
  console.log('  G-9 / I-8 / G-11  → G-9 Karahi House, I-8 Food Street, Tandoori Nights');
  console.log('  Chattar/Murree Rd → Chattar Chowk Kabab Corner, Pine View Café, Nihari House');
  console.log('  F-7 / F-6 / F-11  → Monal, Chaaye Khana, Kabul, Tabaq, Andaaz, Nomad');
  console.log('  Blue Area / G-7   → Savour Foods, Melody BBQ');
  console.log('  F-10              → Lord of the Wings');
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

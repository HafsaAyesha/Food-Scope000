/**
 * FoodScope Seed Script
 *
 * ROLES EXPLAINED:
 *  - admin    : Platform administrator — full control over users, restaurants, reviews
 *  - reviewer : Restaurant OWNER — can list and manage their own restaurant(s) on FoodScope
 *  - user     : Regular customer — can browse restaurants and post reviews, but cannot list restaurants
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
  // role: 'reviewer' = restaurant OWNER (can create / manage listings)
  // role: 'user'     = regular customer (browse & review only)

  const [
    admin,
    // Restaurant owners (role: 'reviewer')
    ownerZara, ownerAhmed, ownerSana, ownerKamran, ownerFatima,
    // Regular customers (role: 'user')
    userAli, userMariam, userOmar, userSofia, userHamza
  ] = await Promise.all([
    // Admin
    User.create({ name: 'Admin', email: 'admin@foodscope.com', password: 'Admin1234!', role: 'admin', isVerified: true }),

    // Restaurant owners — these are real restaurant proprietors on the platform
    User.create({ name: 'Zara Sheikh',   email: 'zara.sheikh@foodscope.com',   password: 'Owner1234!', role: 'reviewer', isVerified: true }),
    User.create({ name: 'Ahmed Raza',    email: 'ahmed.raza@foodscope.com',    password: 'Owner1234!', role: 'reviewer', isVerified: true }),
    User.create({ name: 'Sana Mirza',    email: 'sana.mirza@foodscope.com',    password: 'Owner1234!', role: 'reviewer', isVerified: true }),
    User.create({ name: 'Kamran Butt',   email: 'kamran.butt@foodscope.com',   password: 'Owner1234!', role: 'reviewer', isVerified: true }),
    User.create({ name: 'Fatima Malik',  email: 'fatima.malik@foodscope.com',  password: 'Owner1234!', role: 'reviewer', isVerified: true }),

    // Regular customers — browse and review only
    User.create({ name: 'Ali Hassan',    email: 'ali@example.com',    password: 'User1234!', role: 'user', isVerified: true }),
    User.create({ name: 'Mariam Tariq',  email: 'mariam@example.com', password: 'User1234!', role: 'user', isVerified: true }),
    User.create({ name: 'Omar Farooq',   email: 'omar@example.com',   password: 'User1234!', role: 'user', isVerified: true }),
    User.create({ name: 'Sofia Khan',    email: 'sofia@example.com',  password: 'User1234!', role: 'user', isVerified: true }),
    User.create({ name: 'Hamza Iqbal',   email: 'hamza@example.com',  password: 'User1234!', role: 'user', isVerified: true }),
  ]);
  console.log('✔ Created 11 users (1 admin, 5 restaurant owners, 5 customers)');

  // ── 2. TAGS ───────────────────────────────────────────────────────────────
  const tagData = [
    // cuisine
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
    // dietary
    { name: 'Halal',           type: 'dietary' },
    { name: 'Vegetarian',      type: 'dietary' },
    { name: 'Vegan Friendly',  type: 'dietary' },
    { name: 'Gluten Free',     type: 'dietary' },
    // feature
    { name: 'Outdoor Seating', type: 'feature' },
    { name: 'Sea View',        type: 'feature' },
    { name: 'Rooftop',         type: 'feature' },
    { name: 'Family Friendly', type: 'feature' },
    { name: 'Live Music',      type: 'feature' },
    { name: 'Takeaway',        type: 'feature' },
    { name: 'Delivery',        type: 'feature' },
    { name: 'Late Night',      type: 'feature' },
    { name: 'Fine Dining',     type: 'feature' },
  ];

  const tags = await Promise.all(
    tagData.map(t => Tag.create({
      name: t.name,
      name_lower: t.name.toLowerCase(),
      type: t.type,
      status: 'approved',
      created_by: admin._id,
      usage_count: Math.floor(Math.random() * 50) + 5
    }))
  );
  const T = Object.fromEntries(tags.map(t => [t.name, t.name.toLowerCase()]));
  console.log(`✔ Created ${tags.length} tags`);

  // ── 3. RESTAURANTS ────────────────────────────────────────────────────────
  // Real-world Pakistani restaurants across Karachi, Lahore & Islamabad
  // Coordinates format: [longitude, latitude]

  const restaurants = await Promise.all([

    // ── KARACHI ──────────────────────────────────────────────────────────────

    Restaurant.create({
      name: 'Kolachi Restaurant',
      description: 'Karachi\'s most iconic seafront restaurant, famous for its spectacular views of the Arabian Sea and legendary "Spirit of Karachi" barbecue platter. Kolachi has been serving traditional Pakistani grills, fresh seafood, and classic desi favourites since 1995. The outdoor tables right on the water\'s edge make it a bucket-list dining experience.',
      cuisine_type: 'Pakistani',
      price_range: '$$$',
      avg_rating: 4.7,
      address: 'Beach Avenue, Phase 8, DHA, Karachi, Pakistan',
      location: { type: 'Point', coordinates: [67.0545, 24.7702] },
      tags: [T['Pakistani'], T['BBQ & Grills'], T['Sea View'], T['Outdoor Seating'], T['Halal'], T['Family Friendly'], T['Fine Dining']],
      thumbnail: 'https://images.unsplash.com/photo-1567529692333-de9fd6772897?w=800',
      owner_id: ownerZara._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Okra',
      description: 'An intimate and sophisticated Mediterranean restaurant in the heart of DHA Karachi. Okra is celebrated for its consistent quality, impeccably fresh ingredients, and refined European cooking techniques. The menu changes seasonally and features housemade pastas, wood-fired dishes, and an exceptional dessert selection.',
      cuisine_type: 'Mediterranean',
      price_range: '$$$',
      avg_rating: 4.6,
      address: '12-C, 10th Commercial Lane, Zamzama, Phase 5, DHA, Karachi',
      location: { type: 'Point', coordinates: [67.0355, 24.8211] },
      tags: [T['Mediterranean'], T['Continental'], T['Fine Dining'], T['Gluten Free'], T['Outdoor Seating']],
      thumbnail: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      owner_id: ownerAhmed._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Boat Basin Food Street',
      description: 'The beating heart of Karachi\'s late-night food scene. Boat Basin is a bustling open-air food street in Clifton famous for its Nihari, Handi, and Karahi joints that have been feeding Karachiites for decades. The aroma of slow-cooked spices fills the air from dusk till dawn.',
      cuisine_type: 'Pakistani',
      price_range: '$',
      avg_rating: 4.4,
      address: 'Boat Basin, Block 5, Clifton, Karachi, Pakistan',
      location: { type: 'Point', coordinates: [67.0252, 24.8145] },
      tags: [T['Pakistani'], T['Street Food'], T['Halal'], T['Late Night'], T['Family Friendly'], T['Takeaway']],
      thumbnail: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800',
      owner_id: ownerSana._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'BBQ Tonight',
      description: 'One of Karachi\'s most beloved BBQ institutions. BBQ Tonight is renowned for its sizzling seekh kababs, juicy chicken tikka, and the signature mixed grill platter. With multiple locations across the city, it remains a go-to destination for families celebrating milestones and friends catching up over great food.',
      cuisine_type: 'Pakistani',
      price_range: '$$',
      avg_rating: 4.5,
      address: 'Clifton Block 9, Karachi, Pakistan',
      location: { type: 'Point', coordinates: [67.0315, 24.8203] },
      tags: [T['BBQ & Grills'], T['Pakistani'], T['Halal'], T['Family Friendly'], T['Outdoor Seating'], T['Delivery']],
      thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
      owner_id: ownerKamran._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Student Biryani',
      description: 'A Karachi legend since 1969. Student Biryani has perfected the art of dum biryani over more than five decades. Their signature Karachi-style biryani — fragrant basmati rice layered with tender beef, whole spices, and the signature masala — is what locals call home. Budget-friendly and endlessly satisfying.',
      cuisine_type: 'Pakistani',
      price_range: '$',
      avg_rating: 4.3,
      address: 'Burns Road, Karachi, Pakistan',
      location: { type: 'Point', coordinates: [67.0139, 24.8578] },
      tags: [T['Pakistani'], T['Street Food'], T['Halal'], T['Takeaway'], T['Delivery'], T['Late Night']],
      thumbnail: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
      owner_id: ownerFatima._id,
      status: 'approved'
    }),

    // ── LAHORE ───────────────────────────────────────────────────────────────

    Restaurant.create({
      name: 'Andaz Restaurant',
      description: 'Perched inside a restored haveli directly overlooking the majestic Badshahi Mosque, Andaz delivers traditional Punjabi cuisine with a royal touch and some of the most breathtaking views in Lahore. The rooftop tables at sunset are unforgettable. Signature dishes include Lahori Karahi, Paya, and Shahi Haleem.',
      cuisine_type: 'Pakistani',
      price_range: '$$$',
      avg_rating: 4.8,
      address: '2180-A, Food Street Fort Road, Shahi Mohallah, Walled City, Lahore',
      location: { type: 'Point', coordinates: [74.3105, 31.5882] },
      tags: [T['Pakistani'], T['Rooftop'], T['Fine Dining'], T['Halal'], T['Family Friendly'], T['Outdoor Seating']],
      thumbnail: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
      owner_id: ownerZara._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Bundu Khan',
      description: 'A legendary name in Pakistani BBQ culture since 1948. Bundu Khan\'s signature crispy parathas, melt-in-your-mouth seekh kababs, and perfectly spiced chicken tikka have made it a Lahore institution. Family-run across three generations, every recipe is jealously guarded and every meal is an event.',
      cuisine_type: 'Pakistani',
      price_range: '$$',
      avg_rating: 4.5,
      address: 'Liberty Market, Gulberg III, Lahore, Pakistan',
      location: { type: 'Point', coordinates: [74.3361, 31.5118] },
      tags: [T['BBQ & Grills'], T['Pakistani'], T['Halal'], T['Takeaway'], T['Delivery'], T['Family Friendly'], T['Late Night']],
      thumbnail: 'https://images.unsplash.com/photo-1567529692333-de9fd6772897?w=800',
      owner_id: ownerAhmed._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Fujiyama',
      description: 'Lahore\'s premier Japanese dining destination, situated within the Avari Hotel. Fujiyama is famous for its theatrical Teppanyaki tables where chefs grill your meal in front of you, alongside an excellent sushi bar and a menu of refined Japanese classics. A sophisticated escape in the heart of the city.',
      cuisine_type: 'Japanese',
      price_range: '$$$',
      avg_rating: 4.4,
      address: 'Avari Hotel, 87 Shahrah-e-Quaid-e-Azam, Lahore, Pakistan',
      location: { type: 'Point', coordinates: [74.3315, 31.5545] },
      tags: [T['Japanese'], T['Fine Dining'], T['Gluten Free'], T['Rooftop']],
      thumbnail: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800',
      owner_id: ownerSana._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Haveli Restaurant',
      description: 'An architectural marvel on Lahore\'s famed Gawalmandi Food Street, Haveli is set inside a restored 200-year-old haveli with intricate frescoes, carved woodwork, and sweeping views of the Badshahi Mosque. The menu is a celebration of Mughal-era Punjabi cuisine — slow-cooked, aromatic, and utterly indulgent.',
      cuisine_type: 'Pakistani',
      price_range: '$$',
      avg_rating: 4.6,
      address: 'Fort Road Food Street, near Lahore Fort, Lahore, Pakistan',
      location: { type: 'Point', coordinates: [74.3082, 31.5882] },
      tags: [T['Pakistani'], T['Rooftop'], T['Outdoor Seating'], T['Halal'], T['Family Friendly'], T['Fine Dining']],
      thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      owner_id: ownerKamran._id,
      status: 'approved'
    }),

    // ── ISLAMABAD ─────────────────────────────────────────────────────────────

    Restaurant.create({
      name: 'Monal Restaurant',
      description: 'Islamabad\'s most famous dining destination, perched at the summit of the Margalla Hills with a sweeping panoramic view of the capital. Monal offers an extensive menu ranging from traditional Pakistani karahi and biryani to continental grills and wood-fired dishes. The sunset views from the terrace are utterly spectacular.',
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
      name: 'Savour Foods',
      description: 'An iconic Islamabad institution that has been serving the best Pulao Kabab in the capital since 1980. Savour Foods\' famous deal — a steaming plate of mutton pulao paired with seekh kababs — is deceptively simple and impossibly delicious. The queue at lunchtime tells you everything you need to know.',
      cuisine_type: 'Pakistani',
      price_range: '$',
      avg_rating: 4.6,
      address: 'Fortune Plaza, 72 East Jinnah Avenue, Blue Area, Islamabad',
      location: { type: 'Point', coordinates: [73.0685, 33.7099] },
      tags: [T['Pakistani'], T['Street Food'], T['Halal'], T['Takeaway'], T['Family Friendly'], T['Late Night']],
      thumbnail: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',
      owner_id: ownerZara._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Kabul Restaurant',
      description: 'A legendary Islamabad institution in the heart of F-7 Markaz serving authentic Afghan cuisine. Kabul\'s slow-cooked Kabuli Pulao, succulent lamb chops marinated overnight, and fresh-from-the-tandoor bread have earned it a devoted following among diplomats, locals, and food lovers for over 30 years.',
      cuisine_type: 'Afghan',
      price_range: '$$',
      avg_rating: 4.5,
      address: 'Plot 17, Jinnah Super Market, F-7 Markaz, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0531, 33.7214] },
      tags: [T['Afghan'], T['Pakistani'], T['Halal'], T['Family Friendly'], T['Outdoor Seating'], T['Takeaway']],
      thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
      owner_id: ownerAhmed._id,
      status: 'approved'
    }),

    Restaurant.create({
      name: 'Chaaye Khana',
      description: 'Islamabad\'s most beloved chai café, a cosy heritage-style tearoom spread across multiple floors of a colonial building. Famous for its extraordinary chai menu with 30+ varieties, pakoras, samosas, and light bites. It doubles as a cultural hub — poets, students, and artists are always in residence.',
      cuisine_type: 'Pakistani',
      price_range: '$',
      avg_rating: 4.4,
      address: 'F-7 Markaz, Islamabad, Pakistan',
      location: { type: 'Point', coordinates: [73.0503, 33.7240] },
      tags: [T['Pakistani'], T['Street Food'], T['Halal'], T['Outdoor Seating'], T['Live Music'], T['Late Night'], T['Delivery']],
      thumbnail: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800',
      owner_id: ownerSana._id,
      status: 'approved'
    }),
  ]);
  console.log(`✔ Created ${restaurants.length} restaurants (Karachi, Lahore, Islamabad)`);

  // Assign shorthand names for readability
  const [
    kolachi, okra, boatBasin, bbqTonight, studentBiryani,
    andaz, bunduKhan, fujiyama, haveli,
    monal, savourFoods, kabul, chaayeKhana
  ] = restaurants;

  // ── 4. DISHES ─────────────────────────────────────────────────────────────
  // Prices in PKR
  const dishes = [
    // Kolachi
    { name: 'Spirit of Karachi Platter', description: 'Signature mixed BBQ platter: seekh kabab, chicken tikka, boti, reshmi kabab, grilled fish, naans and chutney', price: 3200, dietary_tags: ['halal'], restaurant_id: kolachi._id },
    { name: 'Grilled Pomfret', description: 'Whole pomfret marinated in green masala and grilled over charcoal', price: 2800, dietary_tags: ['gluten-free', 'halal'], restaurant_id: kolachi._id },
    { name: 'Karahi Gosht', description: 'Tender mutton slow-cooked with tomatoes, green chillies and ginger in a wok', price: 2200, dietary_tags: ['halal', 'gluten-free'], restaurant_id: kolachi._id },

    // Okra
    { name: 'Housemade Pappardelle', description: 'Fresh egg pappardelle with braised lamb ragu, pecorino and basil oil', price: 2400, dietary_tags: [], restaurant_id: okra._id },
    { name: 'Mezze Board', description: 'Hummus, baba ganoush, falafel, marinated olives, grilled halloumi and pita', price: 1800, dietary_tags: ['vegetarian', 'vegan'], restaurant_id: okra._id },
    { name: 'Pan-Seared Sea Bass', description: 'Mediterranean sea bass with capers, lemon beurre blanc and seasonal vegetables', price: 2800, dietary_tags: ['gluten-free'], restaurant_id: okra._id },

    // Boat Basin
    { name: 'Nihari', description: 'Slow-cooked overnight beef shank stew with bone marrow, served with naan and condiments', price: 450, dietary_tags: ['halal'], restaurant_id: boatBasin._id },
    { name: 'Handi Chicken', description: 'Tender chicken slow-cooked in a traditional clay pot with aromatic desi spices', price: 650, dietary_tags: ['halal', 'gluten-free'], restaurant_id: boatBasin._id },
    { name: 'Beef Karahi', description: 'Wok-tossed beef with tomatoes, green chillies, ginger and a generous hand of spices', price: 750, dietary_tags: ['halal'], restaurant_id: boatBasin._id },

    // BBQ Tonight
    { name: 'Mixed BBQ Platter (4 pax)', description: 'Seekh kabab, chicken tikka, boti kabab, malai boti and garlic naans', price: 2800, dietary_tags: ['halal'], restaurant_id: bbqTonight._id },
    { name: 'Chicken Tikka (Half)', description: 'Half chicken marinated in yoghurt and spices, grilled in a traditional tandoor', price: 900, dietary_tags: ['halal', 'gluten-free'], restaurant_id: bbqTonight._id },

    // Student Biryani
    { name: 'Beef Biryani (Full)', description: 'Signature dum biryani: fragrant basmati rice layered with tender beef, whole spices and kachumber raita', price: 380, dietary_tags: ['halal'], restaurant_id: studentBiryani._id },
    { name: 'Chicken Biryani (Full)', description: 'Aromatic Karachi-style chicken biryani with golden rice and house masala', price: 320, dietary_tags: ['halal'], restaurant_id: studentBiryani._id },

    // Andaz Lahore
    { name: 'Lahori Karahi', description: 'Bold, tomato-based karahi with tender mutton, whole spices and freshly baked naan', price: 1800, dietary_tags: ['halal', 'gluten-free'], restaurant_id: andaz._id },
    { name: 'Paya (Trotters)', description: 'Overnight-simmered trotters in a rich, collagen-thick shorba with roti', price: 850, dietary_tags: ['halal'], restaurant_id: andaz._id },
    { name: 'Shahi Sheer Khurma', description: 'Royal vermicelli pudding with saffron, dry fruits and cardamom cream', price: 450, dietary_tags: ['vegetarian'], restaurant_id: andaz._id },

    // Bundu Khan
    { name: 'Seekh Kabab (6 pieces)', description: 'Hand-minced beef seekh kababs with secret house spice blend, served with paratha and mint chutney', price: 750, dietary_tags: ['halal'], restaurant_id: bunduKhan._id },
    { name: 'Crispy Paratha', description: 'Multi-layered butter paratha, golden and flaky, served with dhal and pickle', price: 120, dietary_tags: ['vegetarian'], restaurant_id: bunduKhan._id },
    { name: 'Malai Boti', description: 'Chicken tikka marinated in cream, cheese and mild spices — buttery and melt-in-the-mouth', price: 980, dietary_tags: ['halal', 'gluten-free'], restaurant_id: bunduKhan._id },

    // Fujiyama Lahore
    { name: 'Teppanyaki Wagyu Beef', description: 'Australian wagyu grilled tableside on a Teppanyaki iron with seasonal vegetables and sauces', price: 5500, dietary_tags: ['gluten-free'], restaurant_id: fujiyama._id },
    { name: 'Sushi Platter (12 pcs)', description: 'Chef selection of salmon, tuna, prawn and vegetable nigiri and maki rolls', price: 3200, dietary_tags: ['gluten-free'], restaurant_id: fujiyama._id },

    // Haveli Lahore
    { name: 'Murgh Makhani', description: 'Classic Mughal-style butter chicken in a velvety tomato-cream sauce with tandoori roti', price: 1200, dietary_tags: ['halal', 'gluten-free'], restaurant_id: haveli._id },
    { name: 'Dal Makhani', description: 'Black lentils slow-cooked for 24 hours in a buttery, smoky tomato reduction', price: 800, dietary_tags: ['vegetarian', 'gluten-free'], restaurant_id: haveli._id },
    { name: 'Kulfi Falooda', description: 'Traditional rose falooda with pistachio kulfi, basil seeds and vermicelli', price: 350, dietary_tags: ['vegetarian'], restaurant_id: haveli._id },

    // Monal Islamabad
    { name: 'Monal Sajji', description: 'Whole roasted chicken marinated in rock salt and spices, slow-cooked over embers — Balochi style', price: 2200, dietary_tags: ['halal', 'gluten-free'], restaurant_id: monal._id },
    { name: 'Cheese Naan', description: 'Monal\'s legendary cheese-stuffed tandoor naan, a must-order for every table', price: 380, dietary_tags: ['vegetarian'], restaurant_id: monal._id },
    { name: 'Daal Mash', description: 'White lentils tempered with cumin, garlic and dried red chilli', price: 550, dietary_tags: ['vegan', 'gluten-free', 'halal'], restaurant_id: monal._id },

    // Savour Foods Islamabad
    { name: 'Pulao Kabab Deal', description: 'Islamabad\'s most famous combo: steaming mutton pulao rice with two seekh kababs and raita', price: 450, dietary_tags: ['halal', 'gluten-free'], restaurant_id: savourFoods._id },
    { name: 'Mutton Pulao (Full)', description: 'Aromatic basmati rice slow-cooked with mutton stock, whole spices and tender meat pieces', price: 780, dietary_tags: ['halal', 'gluten-free'], restaurant_id: savourFoods._id },

    // Kabul Restaurant
    { name: 'Kabuli Pulao', description: 'The national dish of Afghanistan: long-grain rice cooked in lamb broth with raisins, carrots and whole spices, topped with tender slow-braised lamb', price: 1400, dietary_tags: ['halal', 'gluten-free'], restaurant_id: kabul._id },
    { name: 'Lamb Chops (4 pcs)', description: 'Overnight-marinated lamb chops grilled over charcoal with Afghan spice rub', price: 1800, dietary_tags: ['halal', 'gluten-free'], restaurant_id: kabul._id },

    // Chaaye Khana
    { name: 'Kashmiri Chai', description: 'Pink Kashmiri salt tea brewed with cardamom and topped with crushed pistachios and cream', price: 250, dietary_tags: ['vegetarian', 'gluten-free'], restaurant_id: chaayeKhana._id },
    { name: 'Samosa Platter (4 pcs)', description: 'Crispy hand-folded samosas with potato-pea filling, served with tamarind and mint chutneys', price: 320, dietary_tags: ['vegan', 'halal'], restaurant_id: chaayeKhana._id },
    { name: 'Aloo Paratha', description: 'Spiced potato-stuffed flatbread served with white butter and house pickle', price: 280, dietary_tags: ['vegetarian'], restaurant_id: chaayeKhana._id },
  ];

  await Promise.all(dishes.map(d => Dish.create(d)));
  console.log(`✔ Created ${dishes.length} dishes`);

  // ── 5. REVIEWS ────────────────────────────────────────────────────────────
  const reviewData = [
    // Kolachi
    { r: kolachi,        u: userAli,    rating: 5, body: 'Kolachi is in a class of its own. The Spirit of Karachi platter arrived sizzling and was absolutely perfection — every cut cooked to the right doneness. Sitting on the waterfront with the sea breeze and this food is a Karachi experience you cannot miss.' },
    { r: kolachi,        u: userMariam, rating: 5, body: 'Came here for my birthday dinner and it was everything. The grilled pomfret was so fresh and the views at night are magical. Slightly pricey but absolutely worth every rupee for a special occasion.' },
    { r: kolachi,        u: userOmar,   rating: 4, body: 'Iconic Karachi restaurant. The karahi gosht was rich and deeply spiced. Service was a bit slow on a busy Saturday night but the quality of food makes up for the wait.' },

    // Okra
    { r: okra,           u: userSofia,  rating: 5, body: 'Okra is hands down the best Mediterranean in Karachi, possibly in Pakistan. The pappardelle was restaurant-quality that would hold up in any European capital. Quiet, elegant and consistently excellent.' },
    { r: okra,           u: userHamza,  rating: 4, body: 'Beautiful ambiance and superb food. The sea bass was cooked flawlessly. A little pricey for Karachi but if you want a proper fine dining experience this is the place.' },

    // Boat Basin
    { r: boatBasin,      u: userAli,    rating: 4, body: 'This is Karachi at its most authentic. The nihari here is slow-cooked overnight and you can taste every hour of that process. The bone marrow is unreal. Come after 11pm when it really comes alive.' },
    { r: boatBasin,      u: userOmar,   rating: 5, body: 'Boat Basin is a rite of passage for any Karachite. The beef karahi is absolutely fiery and delicious. Loud, chaotic, and completely perfect. This is why I love this city.' },

    // BBQ Tonight
    { r: bbqTonight,     u: userMariam, rating: 4, body: 'A Karachi staple and for good reason. The chicken tikka is perfectly charred and the malai boti practically melts. Great for big family dinners — the outdoor seating accommodates large groups easily.' },
    { r: bbqTonight,     u: userHamza,  rating: 5, body: 'The mixed BBQ platter for 4 is incredible value. Everything was freshly grilled and piping hot. We ordered extra seekh kababs because they were so good. The garlic naan was also brilliant.' },

    // Student Biryani
    { r: studentBiryani, u: userSofia,  rating: 5, body: 'Student Biryani is not just food — it\'s a Karachi memory. The beef biryani has the perfect spice balance and every grain of rice is cooked just right. At these prices, it\'s the best value in the city.' },
    { r: studentBiryani, u: userAli,    rating: 4, body: 'Came on a recommendation and I get the hype. The biryani is genuinely special — fragrant, well-spiced and generous portions. Burns Road is a must-visit food street overall.' },

    // Andaz Lahore
    { r: andaz,          u: userOmar,   rating: 5, body: 'Sitting on the Andaz rooftop with the Badshahi Mosque illuminated in front of you, eating the most tender Lahori karahi I\'ve ever had — this is peak Pakistan. Every visitor to Lahore needs to come here.' },
    { r: andaz,          u: userSofia,  rating: 5, body: 'The food at Andaz is exceptional. The paya shorba was rich and warming, and the sheer khurma was the most indulgent dessert. The setting makes everything taste 10x better.' },

    // Bundu Khan
    { r: bunduKhan,      u: userAli,    rating: 5, body: 'Bundu Khan is a Lahori institution and the seekh kababs are genuinely legendary. Three generations of perfecting the same recipe and you can taste that dedication. The crispy paratha alongside it is the perfect companion.' },
    { r: bunduKhan,      u: userMariam, rating: 4, body: 'Excellent BBQ at very reasonable prices. The malai boti is creamy and perfectly spiced. Always busy but the service moves fast. A must for any first-timer in Lahore.' },

    // Fujiyama Lahore
    { r: fujiyama,       u: userHamza,  rating: 4, body: 'The best Japanese restaurant in Lahore by a wide margin. The teppanyaki experience is theatrical and the wagyu was cooked to a perfect medium-rare. Expensive but worth it for a proper special night out.' },
    { r: fujiyama,       u: userSofia,  rating: 5, body: 'Stunning food in an elegant hotel setting. The sushi platter was incredibly fresh and the quality rivals restaurants I\'ve visited in Dubai. Impressive for Lahore.' },

    // Haveli Lahore
    { r: haveli,         u: userOmar,   rating: 5, body: 'The most beautiful restaurant setting in Pakistan. Eating murgh makhani inside a 200-year-old haveli with the Badshahi Mosque right in front of you is surreal. The food matches the setting — rich, Mughal-inspired and delicious.' },
    { r: haveli,         u: userAli,    rating: 4, body: 'The dal makhani here is extraordinary — it clearly simmers for a very long time. The kulfi falooda is one of the best I\'ve had anywhere. The building itself is worth the visit.' },

    // Monal Islamabad
    { r: monal,          u: userMariam, rating: 5, body: 'Monal is simply one of Pakistan\'s greatest dining experiences. The panoramic view of Islamabad at night is breathtaking and the sajji is slow-cooked to absolute perfection. The cheese naan alone is worth the drive up the hill.' },
    { r: monal,          u: userHamza,  rating: 5, body: 'I\'ve taken every visitor to Islamabad here and nobody has ever been disappointed. The hilltop setting, the spread of Pakistani food, the cool Margalla breeze — it\'s magnificent. The daal mash is humble but beautifully done.' },
    { r: monal,          u: userSofia,  rating: 5, body: 'Absolutely iconic. The sajji was the best I\'ve eaten anywhere in Pakistan — crispy outside, impossibly juicy inside. Go at sunset for a view you won\'t forget. Book ahead or expect a very long wait.' },

    // Savour Foods Islamabad
    { r: savourFoods,    u: userAli,    rating: 5, body: 'The pulao kabab deal is one of the great cheap eats of Pakistan. The mutton pulao is aromatic and perfectly balanced, and the seekh kababs are outstanding. Cannot believe you get this quality at this price.' },
    { r: savourFoods,    u: userOmar,   rating: 4, body: 'Savour Foods has been nailing the pulao for over 40 years and you can taste that experience. Always a queue but it moves fast. Perfect quick lunch in Blue Area.' },

    // Kabul Restaurant
    { r: kabul,          u: userMariam, rating: 5, body: 'The Kabuli Pulao here is the real deal — deeply aromatic, with perfectly braised lamb and those sweet carrots and raisins that make it so distinctive. It completely transported me. Exceptional Afghan food.' },
    { r: kabul,          u: userHamza,  rating: 4, body: 'The lamb chops were phenomenal — marinated overnight and grilled perfectly. Solid, no-nonsense Afghan food in a comfortable setting. One of Islamabad\'s most reliable restaurants.' },

    // Chaaye Khana
    { r: chaayeKhana,    u: userSofia,  rating: 5, body: 'Chaaye Khana is my favourite spot in Islamabad. The Kashmiri chai is the best in the city and the whole vibe — old building, books everywhere, good music — is just perfect. The samosas and aloo paratha make it a complete meal.' },
    { r: chaayeKhana,    u: userOmar,   rating: 4, body: 'A wonderful place to spend an afternoon. The chai menu is genuinely impressive with dozens of varieties. The food is tasty and affordable. Always full of the most interesting crowd in Islamabad.' },
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
  console.log('\n✅ Seed complete!\n');
  console.log('ROLE GUIDE:');
  console.log('  admin    = full platform control');
  console.log('  reviewer = restaurant OWNER (can list & manage restaurants)');
  console.log('  user     = customer (browse & review only)\n');
  console.log('─────────────────────────────────────────────────────────');
  console.log('Admin:              admin@foodscope.com        / Admin1234!');
  console.log('Restaurant Owner 1: zara.sheikh@foodscope.com  / Owner1234!');
  console.log('Restaurant Owner 2: ahmed.raza@foodscope.com   / Owner1234!');
  console.log('Restaurant Owner 3: sana.mirza@foodscope.com   / Owner1234!');
  console.log('Customer:           ali@example.com             / User1234!');
  console.log('Customer:           mariam@example.com          / User1234!');
  console.log('─────────────────────────────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

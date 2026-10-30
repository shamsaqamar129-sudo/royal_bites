import heroFeastImg from '../assets/images/hero_royal_feast_1793365782854.jpg';
import wagyuBurgerImg from '../assets/images/dish_wagyu_burger_1793365784562.jpg';
import trufflePizzaImg from '../assets/images/dish_truffle_pizza_1793365915351.jpg';
import smokedBbqImg from '../assets/images/dish_smoked_bbq_1793365787440.jpg';
import crispyFastFoodImg from '../assets/images/dish_crispy_fastfood_1793365788644.jpg';
import craftedDrinkImg from '../assets/images/dish_crafted_drink_1793365790800.jpg';
import goldDessertImg from '../assets/images/dish_gold_dessert_1793365792167.jpg';
import storyAtelierImg from '../assets/images/story_culinary_atelier_1793365792262.jpg';

import {
  Coupon,
  CustomerReview,
  DeliveryZone,
  DishExtraOption,
  DishSizeOption,
  EditorialTestimonial,
  MenuCategory,
  MenuItem,
  RestaurantSettings,
} from '../types';

export const IMAGE_KEY_MAP: Record<string, string> = {
  burger: wagyuBurgerImg,
  pizza: trufflePizzaImg,
  bbq: smokedBbqImg,
  fastfood: crispyFastFoodImg,
  drink: craftedDrinkImg,
  dessert: goldDessertImg,
};

export function resolveDishImage(imageKey: string): string {
  return IMAGE_KEY_MAP[imageKey] || wagyuBurgerImg;
}

export const BRAND_IMAGES = {
  heroFeast: heroFeastImg,
  storyAtelier: storyAtelierImg,
  presets: [
    { key: 'burger', label: 'Wagyu Burger Study', url: wagyuBurgerImg, category: MenuCategory.BURGERS },
    { key: 'pizza', label: 'Artisan Truffle Pizza', url: trufflePizzaImg, category: MenuCategory.PIZZA },
    { key: 'bbq', label: 'Oak-Smoked Prime Ribs', url: smokedBbqImg, category: MenuCategory.BBQ },
    { key: 'fastfood', label: 'Crispy Sliders & Truffle Fries', url: crispyFastFoodImg, category: MenuCategory.FAST_FOOD },
    { key: 'drink', label: 'Smoked Blood Orange Elixir', url: craftedDrinkImg, category: MenuCategory.DRINKS },
    { key: 'dessert', label: '24K Chocolate Hazelnut Dome', url: goldDessertImg, category: MenuCategory.DESSERTS },
  ],
};

export const CATEGORY_CUSTOMIZATIONS: Record<
  MenuCategory,
  { sizes: DishSizeOption[]; extras: DishExtraOption[] }
> = {
  [MenuCategory.BURGERS]: {
    sizes: [
      { id: 'standard', label: 'Single Crown (180g)', priceDelta: 0 },
      { id: 'double', label: 'Double Sovereign (360g)', priceDelta: 9 },
      { id: 'wagyu-reserve', label: 'A5 Reserve Cut Upgrade', priceDelta: 14 },
    ],
    extras: [
      { id: 'truffle-shave', label: 'Fresh Shaved Black Truffle', price: 8 },
      { id: 'gruyere', label: 'Extra Cave-Aged Gruyère', price: 3.5 },
      { id: 'bone-marrow', label: 'Roasted Bone Marrow Butter', price: 5 },
      { id: 'gf-brioche', label: 'Artisan Gluten-Free Bun', price: 2.5 },
    ],
  },
  [MenuCategory.PIZZA]: {
    sizes: [
      { id: '12-inch', label: '12" Artisanal Neapolitan', priceDelta: 0 },
      { id: '15-inch', label: '15" Sharing Stone-Baked', priceDelta: 8 },
    ],
    extras: [
      { id: 'burrata-heart', label: 'Whole Pugliese Burrata Heart', price: 7 },
      { id: 'umbrian-truffle', label: 'Shaved Umbrian Truffle', price: 8 },
      { id: 'hot-honey', label: 'Saffron Calabrian Hot Honey', price: 2.5 },
      { id: 'bresaola', label: 'Air-Cured Wagyu Bresaola', price: 6.5 },
    ],
  },
  [MenuCategory.BBQ]: {
    sizes: [
      { id: 'half-rack', label: 'Signature Plate (350g)', priceDelta: 0 },
      { id: 'pitmaster', label: 'Pitmaster Feast (650g)', priceDelta: 18 },
    ],
    extras: [
      { id: 'espresso-glaze', label: 'Extra Espresso-Bourbon Jus', price: 3 },
      { id: 'charred-corn', label: 'Smoked Bone Marrow Corn', price: 6 },
      { id: 'pickled-shallots', label: 'House Pickled Shallots & Herbs', price: 2.5 },
    ],
  },
  [MenuCategory.FAST_FOOD]: {
    sizes: [
      { id: 'regular', label: 'Individual Portion', priceDelta: 0 },
      { id: 'table-share', label: 'Table Sharing Platter', priceDelta: 9 },
    ],
    extras: [
      { id: 'saffron-aioli', label: 'Roasted Garlic Saffron Aioli', price: 2.5 },
      { id: 'parmesan-snow', label: '36-Month Aged Parmigiano', price: 3 },
      { id: 'caviar-spoon', label: 'Oscietra Caviar Perlita (5g)', price: 16 },
    ],
  },
  [MenuCategory.DRINKS]: {
    sizes: [
      { id: 'glass', label: 'Crystal Rocks (280ml)', priceDelta: 0 },
      { id: 'carafe', label: 'Table Carafe (750ml)', priceDelta: 12 },
    ],
    extras: [
      { id: 'clear-sphere', label: 'Hand-Carved Clear Ice Sphere', price: 1.5 },
      { id: 'saffron-mist', label: 'Persian Saffron Aromatic Mist', price: 2.5 },
    ],
  },
  [MenuCategory.DESSERTS]: {
    sizes: [
      { id: 'individual', label: 'Individual Entremet', priceDelta: 0 },
      { id: 'duo', label: 'Celebration Duo Plating', priceDelta: 11 },
    ],
    extras: [
      { id: 'tahitian-gelato', label: 'Tahitian Vanilla Bean Gelato', price: 4.5 },
      { id: 'espresso-caramel', label: 'Warm Salted Espresso Caramel', price: 2.5 },
      { id: 'gold-plaque', label: 'Celebration Chocolate Inscription', price: 3 },
    ],
  },
};

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'rb-burg-01',
    name: 'The Sovereign A5 Wagyu Double',
    category: MenuCategory.BURGERS,
    price: 34,
    promoPrice: 29,
    description:
      'Twin seared Miyazaki-lineage Wagyu patties, cave-aged Gruyère, black winter truffle aioli, and balsamic shallots on toasted Hokkaido brioche.',
    prepTime: '16 min',
    dietaryNote: 'Chef Signature',
    specialOfferLabel: 'Evening Feature',
    imageKey: 'burger',
    image: wagyuBurgerImg,
    featured: true,
    available: true,
  },
  {
    id: 'rb-burg-02',
    name: 'Dry-Aged Bone Marrow Smash',
    category: MenuCategory.BURGERS,
    price: 28,
    promoPrice: 0,
    description:
      '28-day dry-aged prime chuck, roasted bone marrow glaze, smoked cheddar, charred scallion relish, and crisp potato roll.',
    prepTime: '14 min',
    dietaryNote: 'Live-Fire Grill',
    specialOfferLabel: '',
    imageKey: 'burger',
    image: wagyuBurgerImg,
    featured: false,
    available: true,
  },
  {
    id: 'rb-burg-03',
    name: 'Wild Morel & Black Garlic Royale',
    category: MenuCategory.BURGERS,
    price: 26,
    promoPrice: 0,
    description:
      'Char-grilled lion’s mane and portobello medallion, fermented black garlic emulsion, aged Comté, and wild arugula.',
    prepTime: '15 min',
    dietaryNote: 'Vegetarian',
    specialOfferLabel: '',
    imageKey: 'burger',
    image: wagyuBurgerImg,
    featured: false,
    available: true,
  },
  {
    id: 'rb-pizz-01',
    name: 'Tartufo Nero & Pugliese Burrata',
    category: MenuCategory.PIZZA,
    price: 32,
    promoPrice: 28,
    description:
      '48-hour cold-fermented sourdough blistered in oak fire, stracciatella-filled burrata, shaved Umbrian black truffle, and wild chanterelles.',
    prepTime: '18 min',
    dietaryNote: 'Vegetarian',
    specialOfferLabel: 'Truffle Season',
    imageKey: 'pizza',
    image: trufflePizzaImg,
    featured: true,
    available: true,
  },
  {
    id: 'rb-pizz-02',
    name: 'Diavola Affumicata & Hot Blossom Honey',
    category: MenuCategory.PIZZA,
    price: 27,
    promoPrice: 0,
    description:
      'San Marzano DOP crushed tomatoes, fior di latte, artisanal spicy soppressata, Calabrian chili oil, and wildflower saffron honey.',
    prepTime: '16 min',
    dietaryNote: 'Wood-Fired',
    specialOfferLabel: '',
    imageKey: 'pizza',
    image: trufflePizzaImg,
    featured: false,
    available: true,
  },
  {
    id: 'rb-pizz-03',
    name: 'Wagyu Bresaola & Aged Parmigiano',
    category: MenuCategory.PIZZA,
    price: 30,
    promoPrice: 0,
    description:
      'White crema base, 36-month Parmigiano-Reggiano, air-cured Wagyu bresaola, confit garlic cloves, and lemon-dressed rocket.',
    prepTime: '17 min',
    dietaryNote: 'House Cured',
    specialOfferLabel: '',
    imageKey: 'pizza',
    image: trufflePizzaImg,
    featured: false,
    available: true,
  },
  {
    id: 'rb-bbq-01',
    name: '14-Hour Oak-Smoked Prime Short Ribs',
    category: MenuCategory.BBQ,
    price: 46,
    promoPrice: 41,
    description:
      'Bone-in USDA Prime beef short ribs smoked over white oak, lacquered with espresso-molasses reduction, charred rosemary, and sea salt.',
    prepTime: '22 min',
    dietaryNote: 'Smokehouse Reserve',
    specialOfferLabel: 'Pitmaster Selection',
    imageKey: 'bbq',
    image: smokedBbqImg,
    featured: true,
    available: true,
  },
  {
    id: 'rb-bbq-02',
    name: 'Black Peppercorn Smoked Brisket Platter',
    category: MenuCategory.BBQ,
    price: 39,
    promoPrice: 0,
    description:
      'Thick-cut heritage brisket barked in Tellicherry peppercorn rub, accompanied by burnt-end jus and pickled mustard seeds.',
    prepTime: '20 min',
    dietaryNote: 'Slow Smoked',
    specialOfferLabel: '',
    imageKey: 'bbq',
    image: smokedBbqImg,
    featured: false,
    available: true,
  },
  {
    id: 'rb-bbq-03',
    name: 'Char-Glazed Heritage Lamb Chops',
    category: MenuCategory.BBQ,
    price: 44,
    promoPrice: 0,
    description:
      'Double-cut pasture-raised lamb chops seared over binchotan charcoal with pomegranate-sumac glaze and smoked herb oil.',
    prepTime: '20 min',
    dietaryNote: 'Halal Certified',
    specialOfferLabel: '',
    imageKey: 'bbq',
    image: smokedBbqImg,
    featured: false,
    available: true,
  },
  {
    id: 'rb-fast-01',
    name: 'Golden Buttermilk Sliders & Truffle Pommes',
    category: MenuCategory.FAST_FOOD,
    price: 24,
    promoPrice: 0,
    description:
      'Trio of crisp organic buttermilk chicken sliders with pickled red onion and saffron aioli, served alongside hand-cut Parmesan truffle fries.',
    prepTime: '12 min',
    dietaryNote: 'Guest Favorite',
    specialOfferLabel: '',
    imageKey: 'fastfood',
    image: crispyFastFoodImg,
    featured: true,
    available: true,
  },
  {
    id: 'rb-fast-02',
    name: 'Caviar & Crème Fraîche Crispy Tenders',
    category: MenuCategory.FAST_FOOD,
    price: 29,
    promoPrice: 0,
    description:
      'Double-dredged free-range chicken tenders seasoned with smoked paprika, paired with chive crème fraîche and warm honey butter.',
    prepTime: '12 min',
    dietaryNote: 'Crisp & Shareable',
    specialOfferLabel: '',
    imageKey: 'fastfood',
    image: crispyFastFoodImg,
    featured: false,
    available: true,
  },
  {
    id: 'rb-fast-03',
    name: 'Triple-Cooked Duck Fat & Rosemary Fries',
    category: MenuCategory.FAST_FOOD,
    price: 14,
    promoPrice: 0,
    description:
      'Maris Piper potatoes blanched and crisped to glass-like perfection, tossed in Maldon sea salt, crisp rosemary, and roasted garlic dip.',
    prepTime: '10 min',
    dietaryNote: 'Artisan Side',
    specialOfferLabel: '',
    imageKey: 'fastfood',
    image: crispyFastFoodImg,
    featured: false,
    available: true,
  },
  {
    id: 'rb-drnk-01',
    name: 'Smoked Blood Orange & Saffron Elixir',
    category: MenuCategory.DRINKS,
    price: 16,
    promoPrice: 0,
    description:
      'Zero-proof botanical infusion of Sicilian blood orange, crushed green cardamom, Persian saffron threads, and oak smoke over hand-carved ice.',
    prepTime: '5 min',
    dietaryNote: 'Zero-Proof Craft',
    specialOfferLabel: '',
    imageKey: 'drink',
    image: craftedDrinkImg,
    featured: true,
    available: true,
  },
  {
    id: 'rb-drnk-02',
    name: 'Blackberry Oud & Ginger Fizz',
    category: MenuCategory.DRINKS,
    price: 14,
    promoPrice: 0,
    description:
      'Muddled wild blackberries, cold-pressed fiery ginger root, Damascus rose water, and crisp sparkling mineral water.',
    prepTime: '5 min',
    dietaryNote: 'Zero-Proof Craft',
    specialOfferLabel: '',
    imageKey: 'drink',
    image: craftedDrinkImg,
    featured: false,
    available: true,
  },
  {
    id: 'rb-drnk-03',
    name: 'Cold-Brewed Cardamom Espresso Tonic',
    category: MenuCategory.DRINKS,
    price: 12,
    promoPrice: 0,
    description:
      'Single-origin Ethiopian espresso steeped 18 hours, layered over artisanal quinine tonic with flamed orange peel.',
    prepTime: '4 min',
    dietaryNote: 'Signature Roast',
    specialOfferLabel: '',
    imageKey: 'drink',
    image: craftedDrinkImg,
    featured: false,
    available: true,
  },
  {
    id: 'rb-dess-01',
    name: '24K Valrhona Noir & Piedmont Hazelnut Dome',
    category: MenuCategory.DESSERTS,
    price: 22,
    promoPrice: 19,
    description:
      '70% Guanaja dark chocolate mousse, roasted Piedmontese hazelnut praline crunch, dark mirror glaze, and edible 24-karat gold leaf.',
    prepTime: '8 min',
    dietaryNote: 'Pastry Signature',
    specialOfferLabel: 'Patisserie Offer',
    imageKey: 'dessert',
    image: goldDessertImg,
    featured: true,
    available: true,
  },
  {
    id: 'rb-dess-02',
    name: 'Burnt Basque Vanilla Bean Cheesecake',
    category: MenuCategory.DESSERTS,
    price: 18,
    promoPrice: 0,
    description:
      'Caramelized crustless cheesecake infused with Tahitian vanilla bean pods, served warm with salted espresso caramel.',
    prepTime: '8 min',
    dietaryNote: 'Vegetarian',
    specialOfferLabel: '',
    imageKey: 'dessert',
    image: goldDessertImg,
    featured: false,
    available: true,
  },
  {
    id: 'rb-dess-03',
    name: 'Saffron Pistachio Mille-Feuille',
    category: MenuCategory.DESSERTS,
    price: 19,
    promoPrice: 0,
    description:
      'Shatteringly crisp caramelized puff pastry layered with Bronte pistachio mousseline and delicate orange-blossom syrup.',
    prepTime: '9 min',
    dietaryNote: 'Limited Nightly',
    specialOfferLabel: '',
    imageKey: 'dessert',
    image: goldDessertImg,
    featured: false,
    available: true,
  },
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    code: 'ROYAL15',
    description: '15% privilege savings on orders of $60 or more',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 60,
    active: true,
  },
  {
    code: 'GOLD20',
    description: '$20 private dining credit on orders of $120 or more',
    discountType: 'fixed',
    discountValue: 20,
    minOrderAmount: 120,
    active: true,
  },
  {
    code: 'WELCOME10',
    description: '10% welcome privilege on first evening order ($40+)',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 40,
    active: true,
  },
];

export const INITIAL_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'zone-mayfair',
    name: 'Mayfair & Belgravia (Zone 1)',
    fee: 6,
    minOrder: 30,
    estimatedTime: '25–35 min',
    active: true,
  },
  {
    id: 'zone-knightsbridge',
    name: 'Knightsbridge & Chelsea (Zone 2)',
    fee: 8,
    minOrder: 40,
    estimatedTime: '30–40 min',
    active: true,
  },
  {
    id: 'zone-kensington',
    name: 'Kensington & Marylebone (Zone 3)',
    fee: 9.5,
    minOrder: 45,
    estimatedTime: '35–45 min',
    active: true,
  },
  {
    id: 'zone-city',
    name: 'City of London & Canary Wharf (Zone 4)',
    fee: 14,
    minOrder: 65,
    estimatedTime: '45–55 min',
    active: true,
  },
];

export const INITIAL_RESTAURANT_SETTINGS: RestaurantSettings = {
  promoBannerActive: true,
  promoBannerText: 'Autumn Black Truffle & White Oak Season · Complimentary Chauffeur Delivery Over $95',
  promoBannerCode: 'ROYAL15',
  taxRatePercent: 8.5,
  freeDeliveryThreshold: 95,
  weekdayHours: '12:00 – 23:00',
  weekendHours: '12:00 – 00:30',
  sundayHours: '12:30 – 22:30',
  acceptingOrders: true,
  whatsappNumber: '442079460821',
};

export const GUEST_REVIEWS: EditorialTestimonial[] = [
  {
    id: 'rev-01',
    quote:
      'We hosted twelve international partners in the private dining room. Switching from traditional formal tasting menus to Royal Bites’ live-fire shareable format turned a stiff corporate dinner into our most memorable evening of the quarter.',
    author: 'Julian Vance',
    role: 'Managing Partner',
    organization: 'Kensington Capital Group',
    dishOrdered: '14-Hour Oak-Smoked Prime Short Ribs',
  },
  {
    id: 'rev-02',
    quote:
      'Few kitchens execute both 48-hour Neapolitan fermentation and Japanese Wagyu searing with equal discipline. Every plate arrived at peak temperature with balanced acidity, smoke, and zero unnecessary flourish.',
    author: 'Elena Rostova',
    role: 'Senior Culinary Editor',
    organization: 'The Epicurean Standard',
    dishOrdered: 'Tartufo Nero & Pugliese Burrata',
  },
  {
    id: 'rev-03',
    quote:
      'Even via evening home delivery, the packaging kept the buttermilk sliders crisp and the 24K hazelnut dome pristine. It genuinely feels like having a Mayfair dining room brought straight to our residence.',
    author: 'Tariq Al-Mansoor',
    role: 'Principal Architect',
    organization: 'Atelier Meridian',
    dishOrdered: 'The Sovereign A5 Wagyu Double',
  },
];

export const INITIAL_CUSTOMER_REVIEWS: CustomerReview[] = [
  {
    id: 'seed-rev-1',
    userId: 'seed',
    authorName: 'Charlotte Pembroke',
    dishName: 'The Sovereign A5 Wagyu Double',
    rating: 5,
    comment:
      'Seared crust with melting Gruyère and balanced truffle aioli. Easily the finest burger experience in central London.',
    createdAtLabel: '2 days ago',
    createdAtMs: Date.now() - 86400000 * 2,
  },
  {
    id: 'seed-rev-2',
    userId: 'seed',
    authorName: 'David Alverez',
    dishName: 'Tartufo Nero & Pugliese Burrata',
    rating: 5,
    comment:
      'Airy 48-hour sourdough blistered just right. Adding the whole burrata heart customization made it unforgettable.',
    createdAtLabel: '4 days ago',
    createdAtMs: Date.now() - 86400000 * 4,
  },
  {
    id: 'seed-rev-3',
    userId: 'seed',
    authorName: 'Nadia Rahman',
    dishName: '14-Hour Oak-Smoked Prime Short Ribs',
    rating: 5,
    comment:
      'Deep oak smoke ring and espresso glaze without overwhelming sweetness. Arrived piping hot in Knightsbridge.',
    createdAtLabel: '1 week ago',
    createdAtMs: Date.now() - 86400000 * 7,
  },
];

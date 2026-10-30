export enum MenuCategory {
  BURGERS = 'Burgers',
  PIZZA = 'Pizza',
  BBQ = 'BBQ',
  FAST_FOOD = 'Fast Food',
  DRINKS = 'Drinks',
  DESSERTS = 'Desserts',
}

export enum PageView {
  HOME = 'home',
  MENU = 'menu',
  RESERVATIONS = 'reservations',
  ABOUT = 'about',
  CONTACT = 'contact',
  ACCOUNT = 'account',
  ADMIN = 'admin',
}

export enum OrderStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  PREPARING = 'Preparing',
  OUT_FOR_DELIVERY = 'Out for Delivery',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export enum ReservationStatus {
  PENDING = 'Pending Review',
  CONFIRMED = 'Confirmed',
  SEATED = 'Seated',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export type ThemeMode = 'dark' | 'light';

export interface DishSizeOption {
  id: string;
  label: string;
  priceDelta: number;
}

export interface DishExtraOption {
  id: string;
  label: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  promoPrice: number;
  description: string;
  prepTime: string;
  dietaryNote: string;
  specialOfferLabel: string;
  imageKey: string;
  image: string;
  featured: boolean;
  available: boolean;
}

export interface CartCustomization {
  sizeId: string;
  sizeLabel: string;
  sizePriceDelta: number;
  selectedExtras: DishExtraOption[];
  specialInstructions?: string;
}

export interface CartItem {
  cartLineId: string;
  item: MenuItem;
  quantity: number;
  customization: CartCustomization;
  unitPrice: number;
}

export interface Coupon {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  active: boolean;
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  minOrder: number;
  estimatedTime: string;
  active: boolean;
}

export interface RestaurantSettings {
  promoBannerActive: boolean;
  promoBannerText: string;
  promoBannerCode: string;
  taxRatePercent: number;
  freeDeliveryThreshold: number;
  weekdayHours: string;
  weekendHours: string;
  sundayHours: string;
  acceptingOrders: boolean;
  whatsappNumber: string;
}

export interface SavedAddress {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  zoneId: string;
  notes: string;
  isDefault: boolean;
}

export interface UserProfileState {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  phone: string;
  dietaryPreferences: string;
  wishlist: string[];
  recentlyViewed: string[];
}

export interface OrderLineRecord {
  id: string;
  orderId: string;
  userId: string;
  dishId: string;
  dishName: string;
  sizeLabel: string;
  extrasSummary: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  phone: string;
  address: string;
  zoneName: string;
  notes: string;
  itemSummary: string;
  reorderDishIds: string[];
  subtotal: number;
  discountAmount: number;
  couponCode: string;
  taxAmount: number;
  deliveryFee: number;
  total: number;
  channel: 'Pay on Delivery' | 'WhatsApp Concierge';
  status: OrderStatus;
  createdAtLabel: string;
  createdAtMs: number;
}

export interface ReservationRecord {
  id: string;
  reservationCode: string;
  userId: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  seating: string;
  specialRequests: string;
  status: ReservationStatus;
  createdAtLabel: string;
  createdAtMs: number;
}

export interface CustomerReview {
  id: string;
  userId: string;
  authorName: string;
  dishName: string;
  rating: number;
  comment: string;
  createdAtLabel: string;
  createdAtMs: number;
}

export interface EditorialTestimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  organization: string;
  dishOrdered: string;
}

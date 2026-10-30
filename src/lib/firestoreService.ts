import { User } from 'firebase/auth';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  INITIAL_COUPONS,
  INITIAL_DELIVERY_ZONES,
  INITIAL_MENU_ITEMS,
  INITIAL_RESTAURANT_SETTINGS,
  resolveDishImage,
} from '../data/initialData';
import {
  CartItem,
  Coupon,
  CustomerReview,
  DeliveryZone,
  MenuCategory,
  MenuItem,
  OrderLineRecord,
  OrderRecord,
  OrderStatus,
  ReservationRecord,
  ReservationStatus,
  RestaurantSettings,
  SavedAddress,
  UserProfileState,
} from '../types';
import { OperationType, db, handleFirestoreError } from './firebase';

function clampStr(val: string | undefined | null, max: number, fallback = ''): string {
  const clean = (val ?? fallback).trim();
  return clean.slice(0, max);
}

function formatTimestamp(ts: unknown): { label: string; ms: number } {
  if (ts && typeof ts === 'object' && 'toDate' in ts && typeof (ts as Timestamp).toDate === 'function') {
    const d = (ts as Timestamp).toDate();
    return {
      label: d.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      ms: d.getTime(),
    };
  }
  const now = new Date();
  return {
    label: now.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    ms: now.getTime(),
  };
}

export async function ensureUserProfile(user: User): Promise<UserProfileState> {
  const pubRef = doc(db, 'users', user.uid);
  const privRef = doc(db, 'users', user.uid, 'private', 'profile');

  try {
    const [pubSnap, privSnap] = await Promise.all([getDoc(pubRef), getDoc(privRef)]);
    const defaultName = clampStr(user.displayName || user.email?.split('@')[0] || 'Royal Guest', 80, 'Royal Guest');
    const defaultPhoto = clampStr(user.photoURL || '', 500, '');
    const defaultEmail = clampStr(user.email || 'guest@royalbites.example', 120, 'guest@royalbites.example');

    if (!pubSnap.exists() || !privSnap.exists()) {
      const batch = writeBatch(db);
      if (!pubSnap.exists()) {
        batch.set(pubRef, {
          uid: user.uid,
          displayName: defaultName,
          photoURL: defaultPhoto,
          wishlist: [],
          recentlyViewed: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      if (!privSnap.exists()) {
        batch.set(privRef, {
          uid: user.uid,
          email: defaultEmail,
          phone: '',
          dietaryPreferences: '',
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }

    const freshPub = pubSnap.exists() ? pubSnap.data() : null;
    const freshPriv = privSnap.exists() ? privSnap.data() : null;

    return {
      uid: user.uid,
      displayName: freshPub?.displayName || defaultName,
      photoURL: freshPub?.photoURL ?? defaultPhoto,
      email: freshPriv?.email || defaultEmail,
      phone: freshPriv?.phone || '',
      dietaryPreferences: freshPriv?.dietaryPreferences || '',
      wishlist: Array.isArray(freshPub?.wishlist) ? freshPub.wishlist : [],
      recentlyViewed: Array.isArray(freshPub?.recentlyViewed) ? freshPub.recentlyViewed : [],
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

export async function updateCustomerProfile(
  uid: string,
  updates: {
    displayName: string;
    photoURL: string;
    email: string;
    phone: string;
    dietaryPreferences: string;
    wishlist: string[];
    recentlyViewed: string[];
  }
): Promise<void> {
  const pubRef = doc(db, 'users', uid);
  const privRef = doc(db, 'users', uid, 'private', 'profile');

  try {
    const batch = writeBatch(db);
    batch.update(pubRef, {
      displayName: clampStr(updates.displayName, 80, 'Guest'),
      photoURL: clampStr(updates.photoURL, 500, ''),
      wishlist: updates.wishlist.slice(0, 50),
      recentlyViewed: updates.recentlyViewed.slice(0, 20),
      updatedAt: serverTimestamp(),
    });
    batch.update(privRef, {
      email: clampStr(updates.email, 120, 'guest@example.com'),
      phone: clampStr(updates.phone, 30, ''),
      dietaryPreferences: clampStr(updates.dietaryPreferences, 200, ''),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function syncUserLists(
  uid: string,
  wishlist: string[],
  recentlyViewed: string[]
): Promise<void> {
  const pubRef = doc(db, 'users', uid);
  try {
    await updateDoc(pubRef, {
      wishlist: wishlist.slice(0, 50),
      recentlyViewed: recentlyViewed.slice(0, 20),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export function subscribeSavedAddresses(
  uid: string,
  onData: (addresses: SavedAddress[]) => void
) {
  const path = `users/${uid}/addresses`;
  const q = query(collection(db, 'users', uid, 'addresses'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: SavedAddress[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          label: data.label,
          recipientName: data.recipientName,
          phone: data.phone,
          street: data.street,
          zoneId: data.zoneId,
          notes: data.notes || '',
          isDefault: Boolean(data.isDefault),
        };
      });
      list.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function saveCustomerAddress(
  uid: string,
  address: Omit<SavedAddress, 'id' | 'userId'>,
  existingId?: string
): Promise<void> {
  const id = existingId || `addr-${Date.now()}`;
  const ref = doc(db, 'users', uid, 'addresses', id);
  const payload = {
    userId: uid,
    label: clampStr(address.label, 40, 'Residence'),
    recipientName: clampStr(address.recipientName, 80, 'Guest'),
    phone: clampStr(address.phone, 30, '000000'),
    street: clampStr(address.street, 200, 'Address'),
    zoneId: clampStr(address.zoneId, 64, 'zone-mayfair'),
    notes: clampStr(address.notes, 200, ''),
    isDefault: Boolean(address.isDefault),
    updatedAt: serverTimestamp(),
  };

  try {
    if (existingId) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existingId ? OperationType.UPDATE : OperationType.CREATE,
      `users/${uid}/addresses/${id}`
    );
  }
}

export async function deleteCustomerAddress(uid: string, addressId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', uid, 'addresses', addressId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/addresses/${addressId}`);
  }
}

// PUBLIC & ADMIN CATALOG SUBSCRIPTIONS
export function subscribeMenuCatalog(
  onData: (items: MenuItem[], isCloudSeeded: boolean) => void
) {
  const q = query(collection(db, 'menuItems'), where('price', '>', 0));
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onData(INITIAL_MENU_ITEMS, false);
        return;
      }
      const list: MenuItem[] = snap.docs.map((d) => {
        const data = d.data();
        const imageKey = data.imageKey || 'burger';
        return {
          id: d.id,
          name: data.name,
          category: data.category as MenuCategory,
          price: Number(data.price),
          promoPrice: Number(data.promoPrice || 0),
          description: data.description,
          prepTime: data.prepTime || '15 min',
          dietaryNote: data.dietaryNote || '',
          specialOfferLabel: data.specialOfferLabel || '',
          imageKey,
          image: resolveDishImage(imageKey),
          featured: Boolean(data.featured),
          available: Boolean(data.available),
        };
      });
      list.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
      onData(list, true);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'menuItems')
  );
}

export function subscribeCoupons(
  isAdmin: boolean,
  onData: (coupons: Coupon[], isSeeded: boolean) => void
) {
  const q = isAdmin
    ? query(collection(db, 'coupons'), where('minOrderAmount', '>=', 0))
    : query(collection(db, 'coupons'), where('active', '==', true));

  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onData(
          isAdmin ? INITIAL_COUPONS : INITIAL_COUPONS.filter((c) => c.active),
          false
        );
        return;
      }
      const list: Coupon[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          code: data.code,
          description: data.description,
          discountType: data.discountType,
          discountValue: Number(data.discountValue),
          minOrderAmount: Number(data.minOrderAmount || 0),
          active: Boolean(data.active),
        };
      });
      onData(list, true);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'coupons')
  );
}

export function subscribeDeliveryZones(
  isAdmin: boolean,
  onData: (zones: DeliveryZone[], isSeeded: boolean) => void
) {
  const q = isAdmin
    ? query(collection(db, 'deliveryZones'), where('fee', '>=', 0))
    : query(collection(db, 'deliveryZones'), where('active', '==', true));

  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onData(
          isAdmin ? INITIAL_DELIVERY_ZONES : INITIAL_DELIVERY_ZONES.filter((z) => z.active),
          false
        );
        return;
      }
      const list: DeliveryZone[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          fee: Number(data.fee),
          minOrder: Number(data.minOrder || 0),
          estimatedTime: data.estimatedTime,
          active: Boolean(data.active),
        };
      });
      list.sort((a, b) => a.fee - b.fee);
      onData(list, true);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'deliveryZones')
  );
}

export function subscribeRestaurantSettings(
  onData: (settings: RestaurantSettings, isSeeded: boolean) => void
) {
  return onSnapshot(
    doc(db, 'settings', 'restaurant'),
    (snap) => {
      if (!snap.exists()) {
        onData(INITIAL_RESTAURANT_SETTINGS, false);
        return;
      }
      const d = snap.data();
      onData(
        {
          promoBannerActive: Boolean(d.promoBannerActive),
          promoBannerText: d.promoBannerText || '',
          promoBannerCode: d.promoBannerCode || '',
          taxRatePercent: Number(d.taxRatePercent ?? 8.5),
          freeDeliveryThreshold: Number(d.freeDeliveryThreshold ?? 95),
          weekdayHours: d.weekdayHours || '12:00 – 23:00',
          weekendHours: d.weekendHours || '12:00 – 00:30',
          sundayHours: d.sundayHours || '12:30 – 22:30',
          acceptingOrders: Boolean(d.acceptingOrders),
          whatsappNumber: d.whatsappNumber || '442079460821',
        },
        true
      );
    },
    (error) => handleFirestoreError(error, OperationType.GET, 'settings/restaurant')
  );
}

export function subscribeCustomerReviews(onData: (reviews: CustomerReview[]) => void) {
  const q = query(collection(db, 'reviews'), where('rating', '>=', 1));
  return onSnapshot(
    q,
    (snap) => {
      const list: CustomerReview[] = snap.docs.map((d) => {
        const data = d.data();
        const ts = formatTimestamp(data.createdAt);
        return {
          id: d.id,
          userId: data.userId,
          authorName: data.authorName,
          dishName: data.dishName,
          rating: Number(data.rating),
          comment: data.comment,
          createdAtLabel: ts.label,
          createdAtMs: ts.ms,
        };
      });
      list.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'reviews')
  );
}

// CUSTOMER ORDERS & ATOMIC LINE ITEMS
export async function placeCustomerOrder(
  user: User,
  params: {
    customerName: string;
    phone: string;
    address: string;
    zoneName: string;
    notes: string;
    cart: CartItem[];
    subtotal: number;
    discountAmount: number;
    couponCode: string;
    taxAmount: number;
    deliveryFee: number;
    total: number;
    channel: 'Pay on Delivery' | 'WhatsApp Concierge';
  }
): Promise<OrderRecord> {
  const orderId = `ord-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`;
  const orderNumber = `RB-${Math.floor(10000 + Math.random() * 89999)}`;

  const summaryParts = params.cart.map((c) => {
    const extrasTxt =
      c.customization.selectedExtras.length > 0
        ? ` + ${c.customization.selectedExtras.map((e) => e.label).join(', ')}`
        : '';
    return `${c.quantity}x ${c.item.name} (${c.customization.sizeLabel}${extrasTxt})`;
  });
  const itemSummary = clampStr(summaryParts.join(' · '), 800, 'Signature Order');
  const reorderDishIds = Array.from(new Set(params.cart.map((c) => c.item.id))).slice(0, 20);

  const orderRef = doc(db, 'orders', orderId);

  try {
    const batch = writeBatch(db);
    batch.set(orderRef, {
      orderNumber,
      userId: user.uid,
      customerName: clampStr(params.customerName, 80, 'Guest'),
      phone: clampStr(params.phone, 30, '000000'),
      address: clampStr(params.address, 220, 'Mayfair'),
      zoneName: clampStr(params.zoneName, 80, 'Zone 1'),
      notes: clampStr(params.notes, 200, ''),
      itemSummary,
      reorderDishIds,
      subtotal: Number(params.subtotal.toFixed(2)),
      discountAmount: Number(params.discountAmount.toFixed(2)),
      couponCode: clampStr(params.couponCode, 32, ''),
      taxAmount: Number(params.taxAmount.toFixed(2)),
      deliveryFee: Number(params.deliveryFee.toFixed(2)),
      total: Number(params.total.toFixed(2)),
      channel: params.channel,
      status: OrderStatus.PENDING,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    params.cart.forEach((line, idx) => {
      const lineId = `line-${idx + 1}`;
      const lineRef = doc(db, 'orders', orderId, 'items', lineId);
      const extrasSummary = clampStr(
        [
          ...line.customization.selectedExtras.map((e) => e.label),
          line.customization.specialInstructions || '',
        ]
          .filter(Boolean)
          .join(', '),
        250,
        ''
      );
      batch.set(lineRef, {
        orderId,
        userId: user.uid,
        dishId: clampStr(line.item.id, 64, 'dish'),
        dishName: clampStr(line.item.name, 100, 'Dish'),
        sizeLabel: clampStr(line.customization.sizeLabel, 40, 'Standard'),
        extrasSummary,
        unitPrice: Number(line.unitPrice.toFixed(2)),
        quantity: Math.min(50, Math.max(1, Math.round(line.quantity))),
        lineTotal: Number((line.unitPrice * line.quantity).toFixed(2)),
        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();

    const now = formatTimestamp(null);
    return {
      id: orderId,
      orderNumber,
      userId: user.uid,
      customerName: params.customerName,
      phone: params.phone,
      address: params.address,
      zoneName: params.zoneName,
      notes: params.notes,
      itemSummary,
      reorderDishIds,
      subtotal: Number(params.subtotal.toFixed(2)),
      discountAmount: Number(params.discountAmount.toFixed(2)),
      couponCode: params.couponCode,
      taxAmount: Number(params.taxAmount.toFixed(2)),
      deliveryFee: Number(params.deliveryFee.toFixed(2)),
      total: Number(params.total.toFixed(2)),
      channel: params.channel,
      status: OrderStatus.PENDING,
      createdAtLabel: now.label,
      createdAtMs: now.ms,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `orders/${orderId}`);
  }
}

function mapOrderDoc(id: string, data: Record<string, any>): OrderRecord {
  const ts = formatTimestamp(data.createdAt);
  return {
    id,
    orderNumber: data.orderNumber || id,
    userId: data.userId,
    customerName: data.customerName,
    phone: data.phone,
    address: data.address,
    zoneName: data.zoneName || '',
    notes: data.notes || '',
    itemSummary: data.itemSummary || '',
    reorderDishIds: Array.isArray(data.reorderDishIds) ? data.reorderDishIds : [],
    subtotal: Number(data.subtotal || 0),
    discountAmount: Number(data.discountAmount || 0),
    couponCode: data.couponCode || '',
    taxAmount: Number(data.taxAmount || 0),
    deliveryFee: Number(data.deliveryFee || 0),
    total: Number(data.total || 0),
    channel: data.channel || 'Pay on Delivery',
    status: (data.status as OrderStatus) || OrderStatus.PENDING,
    createdAtLabel: ts.label,
    createdAtMs: ts.ms,
  };
}

export function subscribeUserOrders(uid: string, onData: (orders: OrderRecord[]) => void) {
  const q = query(collection(db, 'orders'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapOrderDoc(d.id, d.data()));
      list.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'orders')
  );
}

export function subscribeAdminOrders(onData: (orders: OrderRecord[]) => void) {
  const q = query(collection(db, 'orders'), where('subtotal', '>', 0));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapOrderDoc(d.id, d.data()));
      list.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'orders')
  );
}

export async function fetchOrderLineItems(
  orderId: string,
  userId: string,
  isAdmin: boolean
): Promise<OrderLineRecord[]> {
  const path = `orders/${orderId}/items`;
  try {
    const q = isAdmin
      ? query(collection(db, 'orders', orderId, 'items'), where('quantity', '>=', 1))
      : query(collection(db, 'orders', orderId, 'items'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        orderId: data.orderId,
        userId: data.userId,
        dishId: data.dishId,
        dishName: data.dishName,
        sizeLabel: data.sizeLabel,
        extrasSummary: data.extrasSummary || '',
        unitPrice: Number(data.unitPrice),
        quantity: Number(data.quantity),
        lineTotal: Number(data.lineTotal),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateOrderStatusInDb(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
  }
}

// RESERVATIONS
export async function createTableReservation(
  user: User,
  params: {
    name: string;
    phone: string;
    date: string;
    time: string;
    guests: number;
    seating: string;
    specialRequests: string;
  }
): Promise<ReservationRecord> {
  const id = `res-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`;
  const reservationCode = `RES-${Math.floor(1000 + Math.random() * 8999)}`;

  try {
    await setDoc(doc(db, 'reservations', id), {
      reservationCode,
      userId: user.uid,
      name: clampStr(params.name, 80, 'Guest'),
      phone: clampStr(params.phone, 30, '000000'),
      date: clampStr(params.date, 16, '2026-11-01'),
      time: clampStr(params.time, 12, '19:30'),
      guests: Math.min(20, Math.max(1, Math.round(params.guests))),
      seating: params.seating,
      specialRequests: clampStr(params.specialRequests, 250, ''),
      status: ReservationStatus.PENDING,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const now = formatTimestamp(null);
    return {
      id,
      reservationCode,
      userId: user.uid,
      name: params.name,
      phone: params.phone,
      date: params.date,
      time: params.time,
      guests: params.guests,
      seating: params.seating,
      specialRequests: params.specialRequests,
      status: ReservationStatus.PENDING,
      createdAtLabel: now.label,
      createdAtMs: now.ms,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `reservations/${id}`);
  }
}

function mapReservationDoc(id: string, data: Record<string, any>): ReservationRecord {
  const ts = formatTimestamp(data.createdAt);
  return {
    id,
    reservationCode: data.reservationCode || id,
    userId: data.userId,
    name: data.name,
    phone: data.phone,
    date: data.date,
    time: data.time,
    guests: Number(data.guests || 2),
    seating: data.seating || 'Main Dining Room',
    specialRequests: data.specialRequests || '',
    status: (data.status as ReservationStatus) || ReservationStatus.PENDING,
    createdAtLabel: ts.label,
    createdAtMs: ts.ms,
  };
}

export function subscribeUserReservations(
  uid: string,
  onData: (reservations: ReservationRecord[]) => void
) {
  const q = query(collection(db, 'reservations'), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapReservationDoc(d.id, d.data()));
      list.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'reservations')
  );
}

export function subscribeAdminReservations(
  onData: (reservations: ReservationRecord[]) => void
) {
  const q = query(collection(db, 'reservations'), where('guests', '>=', 1));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapReservationDoc(d.id, d.data()));
      list.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'reservations')
  );
}

export async function updateReservationStatusInDb(
  reservationId: string,
  status: ReservationStatus
): Promise<void> {
  try {
    await updateDoc(doc(db, 'reservations', reservationId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reservations/${reservationId}`);
  }
}

// REVIEWS & NEWSLETTER
export async function submitCustomerReview(
  user: User,
  params: { authorName: string; dishName: string; rating: number; comment: string }
): Promise<void> {
  const id = `rev-${Date.now()}`;
  try {
    await setDoc(doc(db, 'reviews', id), {
      userId: user.uid,
      authorName: clampStr(params.authorName, 80, 'Guest'),
      dishName: clampStr(params.dishName, 100, 'Royal Bites Dish'),
      rating: Math.min(5, Math.max(1, Math.round(params.rating))),
      comment: clampStr(params.comment, 600, 'Wonderful culinary experience.'),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `reviews/${id}`);
  }
}

export async function deleteCustomerReview(reviewId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'reviews', reviewId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `reviews/${reviewId}`);
  }
}

export async function subscribeMemberNewsletter(user: User, email: string): Promise<void> {
  const ref = doc(db, 'newsletterSubscribers', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { active: true });
    } else {
      await setDoc(ref, {
        userId: user.uid,
        email: clampStr(email || user.email || '', 120, 'member@example.com'),
        active: true,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `newsletterSubscribers/${user.uid}`);
  }
}

// ADMIN CATALOG, COUPON, ZONE & SETTINGS MUTATIONS
export async function seedInitialCloudCatalog(): Promise<void> {
  try {
    const batch = writeBatch(db);
    INITIAL_MENU_ITEMS.forEach((item) => {
      batch.set(doc(db, 'menuItems', item.id), {
        name: clampStr(item.name, 100),
        category: item.category,
        price: Number(item.price),
        promoPrice: Number(item.promoPrice || 0),
        description: clampStr(item.description, 500),
        prepTime: clampStr(item.prepTime, 30, '15 min'),
        dietaryNote: clampStr(item.dietaryNote, 60, ''),
        specialOfferLabel: clampStr(item.specialOfferLabel, 60, ''),
        imageKey: clampStr(item.imageKey, 60, 'burger'),
        featured: Boolean(item.featured),
        available: Boolean(item.available),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    INITIAL_COUPONS.forEach((coupon) => {
      batch.set(doc(db, 'coupons', coupon.code), {
        code: coupon.code,
        description: clampStr(coupon.description, 160),
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        minOrderAmount: Number(coupon.minOrderAmount),
        active: Boolean(coupon.active),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    INITIAL_DELIVERY_ZONES.forEach((zone) => {
      batch.set(doc(db, 'deliveryZones', zone.id), {
        name: clampStr(zone.name, 80),
        fee: Number(zone.fee),
        minOrder: Number(zone.minOrder),
        estimatedTime: clampStr(zone.estimatedTime, 40),
        active: Boolean(zone.active),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    batch.set(doc(db, 'settings', 'restaurant'), {
      ...INITIAL_RESTAURANT_SETTINGS,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seedInitialCloudCatalog');
  }
}

export async function saveAdminMenuItem(
  item: Omit<MenuItem, 'image'>,
  isExisting: boolean
): Promise<void> {
  const ref = doc(db, 'menuItems', item.id);
  const payload = {
    name: clampStr(item.name, 100),
    category: item.category,
    price: Number(item.price),
    promoPrice: Number(item.promoPrice || 0),
    description: clampStr(item.description, 500),
    prepTime: clampStr(item.prepTime, 30, '15 min'),
    dietaryNote: clampStr(item.dietaryNote, 60, ''),
    specialOfferLabel: clampStr(item.specialOfferLabel, 60, ''),
    imageKey: clampStr(item.imageKey, 60, 'burger'),
    featured: Boolean(item.featured),
    available: Boolean(item.available),
    updatedAt: serverTimestamp(),
  };

  try {
    if (isExisting) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      isExisting ? OperationType.UPDATE : OperationType.CREATE,
      `menuItems/${item.id}`
    );
  }
}

export async function deleteAdminMenuItem(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'menuItems', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `menuItems/${id}`);
  }
}

export async function saveAdminCoupon(coupon: Coupon, isExisting: boolean): Promise<void> {
  const cleanCode = coupon.code.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 32);
  const ref = doc(db, 'coupons', cleanCode);
  const payload = {
    code: cleanCode,
    description: clampStr(coupon.description, 160),
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    minOrderAmount: Number(coupon.minOrderAmount || 0),
    active: Boolean(coupon.active),
    updatedAt: serverTimestamp(),
  };

  try {
    if (isExisting) {
      await updateDoc(ref, {
        description: payload.description,
        discountType: payload.discountType,
        discountValue: payload.discountValue,
        minOrderAmount: payload.minOrderAmount,
        active: payload.active,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      isExisting ? OperationType.UPDATE : OperationType.CREATE,
      `coupons/${cleanCode}`
    );
  }
}

export async function deleteAdminCoupon(code: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'coupons', code));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `coupons/${code}`);
  }
}

export async function saveAdminDeliveryZone(
  zone: DeliveryZone,
  isExisting: boolean
): Promise<void> {
  const ref = doc(db, 'deliveryZones', zone.id);
  const payload = {
    name: clampStr(zone.name, 80),
    fee: Number(zone.fee),
    minOrder: Number(zone.minOrder || 0),
    estimatedTime: clampStr(zone.estimatedTime, 40),
    active: Boolean(zone.active),
    updatedAt: serverTimestamp(),
  };

  try {
    if (isExisting) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      isExisting ? OperationType.UPDATE : OperationType.CREATE,
      `deliveryZones/${zone.id}`
    );
  }
}

export async function deleteAdminDeliveryZone(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'deliveryZones', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `deliveryZones/${id}`);
  }
}

export async function saveAdminSettings(
  settings: RestaurantSettings,
  isExisting: boolean
): Promise<void> {
  const ref = doc(db, 'settings', 'restaurant');
  const payload = {
    promoBannerActive: Boolean(settings.promoBannerActive),
    promoBannerText: clampStr(settings.promoBannerText, 180, ''),
    promoBannerCode: clampStr(settings.promoBannerCode.toUpperCase(), 32, ''),
    taxRatePercent: Number(settings.taxRatePercent),
    freeDeliveryThreshold: Number(settings.freeDeliveryThreshold),
    weekdayHours: clampStr(settings.weekdayHours, 50, '12:00 – 23:00'),
    weekendHours: clampStr(settings.weekendHours, 50, '12:00 – 00:30'),
    sundayHours: clampStr(settings.sundayHours, 50, '12:30 – 22:30'),
    acceptingOrders: Boolean(settings.acceptingOrders),
    whatsappNumber: clampStr(settings.whatsappNumber.replace(/[^0-9]/g, ''), 24, '442079460821'),
    updatedAt: serverTimestamp(),
  };

  try {
    if (isExisting) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, payload);
    }
  } catch (error) {
    handleFirestoreError(
      error,
      isExisting ? OperationType.UPDATE : OperationType.CREATE,
      'settings/restaurant'
    );
  }
}

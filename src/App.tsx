import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { AnimatePresence, motion } from 'motion/react';
import { AboutView } from './components/AboutView';
import { AdminView } from './components/AdminView';
import { CartDrawer } from './components/CartDrawer';
import { ContactView } from './components/ContactView';
import { CustomerAccountView } from './components/CustomerAccountView';
import { DishCustomizeModal } from './components/DishCustomizeModal';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { MenuView } from './components/MenuView';
import { ReceiptModal } from './components/ReceiptModal';
import { ReservationsView } from './components/ReservationsView';
import {
  CATEGORY_CUSTOMIZATIONS,
  INITIAL_COUPONS,
  INITIAL_CUSTOMER_REVIEWS,
  INITIAL_DELIVERY_ZONES,
  INITIAL_MENU_ITEMS,
  INITIAL_RESTAURANT_SETTINGS,
} from './data/initialData';
import { auth, signInWithGoogle, signOutUser, verifyAdminAccess } from './lib/firebase';
import {
  ensureUserProfile,
  subscribeAdminOrders,
  subscribeAdminReservations,
  subscribeCoupons,
  subscribeCustomerReviews,
  subscribeDeliveryZones,
  subscribeMenuCatalog,
  subscribeRestaurantSettings,
  subscribeSavedAddresses,
  subscribeUserOrders,
  subscribeUserReservations,
  syncUserLists,
} from './lib/firestoreService';
import {
  CartCustomization,
  CartItem,
  Coupon,
  CustomerReview,
  DeliveryZone,
  MenuItem,
  OrderRecord,
  PageView,
  ReservationRecord,
  RestaurantSettings,
  SavedAddress,
  ThemeMode,
  UserProfileState,
} from './types';

const STORAGE_KEYS = {
  THEME: 'royal_bites_theme_v2',
  CART: 'royal_bites_cart_v2',
  WISHLIST: 'royal_bites_wishlist_v2',
  RECENT: 'royal_bites_recent_v2',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function buildCartLineId(dishId: string, customization: CartCustomization): string {
  const extraIds = [...customization.selectedExtras]
    .map((e) => e.id)
    .sort()
    .join(',');
  const noteKey = (customization.specialInstructions || '').trim().toLowerCase();
  return `${dishId}::${customization.sizeId}::${extraIds}::${noteKey}`;
}

const PAGE_TITLES: Record<PageView, string> = {
  [PageView.HOME]: 'ROYAL BITES — Luxury Live-Fire Dining & Ordering Platform',
  [PageView.MENU]: 'Seasonal Menu & Bespoke Customisation | ROYAL BITES',
  [PageView.RESERVATIONS]: 'Private Table Reservations | ROYAL BITES',
  [PageView.ABOUT]: 'Culinary Heritage & Live-Fire Philosophy | ROYAL BITES',
  [PageView.CONTACT]: 'Guest Relations & Chauffeur Delivery Zones | ROYAL BITES',
  [PageView.ACCOUNT]: 'Member Dining Profile & Order Tracking | ROYAL BITES',
  [PageView.ADMIN]: 'Executive Restaurant Operations Suite | ROYAL BITES',
};

export default function App() {
  const [activePage, setActivePage] = useState<PageView>(PageView.HOME);
  const [theme, setTheme] = useState<ThemeMode>(() =>
    loadFromStorage<ThemeMode>(STORAGE_KEYS.THEME, 'dark')
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Promo state
  const [customizingDish, setCustomizingDish] = useState<MenuItem | null>(null);
  const [inspectingOrder, setInspectingOrder] = useState<OrderRecord | null>(null);
  const [externalCouponCode, setExternalCouponCode] = useState<string | undefined>(undefined);

  // Auth & Member Profile state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileState | null>(null);

  // Storefront & Cloud state
  const [isCloudSeeded, setIsCloudSeeded] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [coupons, setCoupons] = useState<Coupon[]>(
    INITIAL_COUPONS.filter((c) => c.active)
  );
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(
    INITIAL_DELIVERY_ZONES.filter((z) => z.active)
  );
  const [settings, setSettings] = useState<RestaurantSettings>(
    INITIAL_RESTAURANT_SETTINGS
  );
  const [cloudReviews, setCloudReviews] = useState<CustomerReview[]>([]);

  // Cart, Wishlist & Recently Viewed
  const [cart, setCart] = useState<CartItem[]>(() =>
    loadFromStorage<CartItem[]>(STORAGE_KEYS.CART, [])
  );
  const [wishlistIds, setWishlistIds] = useState<string[]>(() =>
    loadFromStorage<string[]>(STORAGE_KEYS.WISHLIST, [])
  );
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() =>
    loadFromStorage<string[]>(STORAGE_KEYS.RECENT, [])
  );

  // User & Admin Cloud Collections
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [userOrders, setUserOrders] = useState<OrderRecord[]>([]);
  const [userReservations, setUserReservations] = useState<ReservationRecord[]>([]);
  const [adminOrders, setAdminOrders] = useState<OrderRecord[]>([]);
  const [adminReservations, setAdminReservations] = useState<ReservationRecord[]>([]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  // Theme application on root <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(theme));
    } catch {
      // Ignore storage quota issues
    }
  }, [theme]);

  // Dynamic SEO page title
  useEffect(() => {
    document.title = PAGE_TITLES[activePage] || PAGE_TITLES[PageView.HOME];
  }, [activePage]);

  // Persist local Cart, Wishlist & Recently Viewed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch {
      // Ignore quota errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlistIds));
    } catch {
      // Ignore quota errors
    }
  }, [wishlistIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(recentlyViewedIds));
    } catch {
      // Ignore quota errors
    }
  }, [recentlyViewedIds]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        setIsAdmin(false);
        setUserProfile(null);
        setSavedAddresses([]);
        setUserOrders([]);
        setUserReservations([]);
        setAdminOrders([]);
        setAdminReservations([]);
        return;
      }

      const [adminFlag, profile] = await Promise.all([
        verifyAdminAccess(user),
        ensureUserProfile(user).catch(() => null),
      ]);
      setIsAdmin(adminFlag);

      if (profile) {
        const mergedWishlist = Array.from(
          new Set([...profile.wishlist, ...loadFromStorage<string[]>(STORAGE_KEYS.WISHLIST, [])])
        ).slice(0, 50);
        const mergedRecent = Array.from(
          new Set([
            ...loadFromStorage<string[]>(STORAGE_KEYS.RECENT, []),
            ...profile.recentlyViewed,
          ])
        ).slice(0, 20);

        setWishlistIds(mergedWishlist);
        setRecentlyViewedIds(mergedRecent);
        setUserProfile({
          ...profile,
          wishlist: mergedWishlist,
          recentlyViewed: mergedRecent,
        });

        if (
          mergedWishlist.length !== profile.wishlist.length ||
          mergedRecent.length !== profile.recentlyViewed.length
        ) {
          syncUserLists(user.uid, mergedWishlist, mergedRecent).catch(() => {});
        }
      }
    });

    return () => unsub();
  }, []);

  // Public Storefront Real-Time Listeners
  useEffect(() => {
    const unsubMenu = subscribeMenuCatalog((items, seeded) => {
      setMenuItems(items);
      setIsCloudSeeded(seeded);
    });
    const unsubSettings = subscribeRestaurantSettings((nextSettings) => {
      setSettings(nextSettings);
    });
    const unsubReviews = subscribeCustomerReviews((revs) => {
      setCloudReviews(revs);
    });

    return () => {
      unsubMenu();
      unsubSettings();
      unsubReviews();
    };
  }, []);

  // Role-Aware Coupons & Delivery Zones Listeners
  useEffect(() => {
    const unsubCoupons = subscribeCoupons(isAdmin, (list) => {
      setCoupons(list);
    });
    const unsubZones = subscribeDeliveryZones(isAdmin, (zones) => {
      setDeliveryZones(zones);
    });

    return () => {
      unsubCoupons();
      unsubZones();
    };
  }, [isAdmin]);

  // Authenticated Member Subscriptions
  useEffect(() => {
    if (!currentUser) return;
    const unsubAddr = subscribeSavedAddresses(currentUser.uid, setSavedAddresses);
    const unsubOrd = subscribeUserOrders(currentUser.uid, setUserOrders);
    const unsubRes = subscribeUserReservations(currentUser.uid, setUserReservations);

    return () => {
      unsubAddr();
      unsubOrd();
      unsubRes();
    };
  }, [currentUser]);

  // Admin Operations Subscriptions
  useEffect(() => {
    if (!currentUser || !isAdmin) {
      setAdminOrders([]);
      setAdminReservations([]);
      return;
    }
    const unsubAdminOrders = subscribeAdminOrders(setAdminOrders);
    const unsubAdminReservations = subscribeAdminReservations(setAdminReservations);

    return () => {
      unsubAdminOrders();
      unsubAdminReservations();
    };
  }, [currentUser, isAdmin]);

  // Keep inspectingOrder synced with live status updates
  useEffect(() => {
    if (!inspectingOrder) return;
    const pool = isAdmin ? adminOrders : userOrders;
    const updated = pool.find((o) => o.id === inspectingOrder.id);
    if (updated && updated.status !== inspectingOrder.status) {
      setInspectingOrder(updated);
    }
  }, [adminOrders, userOrders, isAdmin, inspectingOrder]);

  // Sync cart dish metadata if catalog updates
  useEffect(() => {
    setCart((prev) =>
      prev.map((line) => {
        const freshDish = menuItems.find((m) => m.id === line.item.id);
        if (!freshDish) return line;
        const basePrice =
          freshDish.promoPrice > 0 && freshDish.promoPrice < freshDish.price
            ? freshDish.promoPrice
            : freshDish.price;
        const extrasTotal = line.customization.selectedExtras.reduce(
          (sum, e) => sum + e.price,
          0
        );
        return {
          ...line,
          item: freshDish,
          unitPrice: basePrice + line.customization.sizePriceDelta + extrasTotal,
        };
      })
    );
  }, [menuItems]);

  const combinedReviews = useMemo(
    () => [...cloudReviews, ...INITIAL_CUSTOMER_REVIEWS],
    [cloudReviews]
  );

  const storefrontZones = useMemo(
    () => deliveryZones.filter((z) => z.active),
    [deliveryZones]
  );

  const storefrontCoupons = useMemo(
    () => coupons.filter((c) => c.active),
    [coupons]
  );

  const cartCount = useMemo(
    () => cart.reduce((acc, entry) => acc + entry.quantity, 0),
    [cart]
  );

  const handleNavigate = (page: PageView) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSignInRequest = async () => {
    try {
      const cred = await signInWithGoogle();
      showToast(
        `Welcome back, ${cred.user.displayName || cred.user.email || 'Royal Guest'}`
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (!msg.includes('popup-closed-by-user')) {
        showToast('Sign-in popup could not complete. Please try again.');
      }
    }
  };

  const handleSignOutRequest = async () => {
    try {
      await signOutUser();
      showToast('Signed out of your Royal Bites account.');
      if (activePage === PageView.ADMIN) {
        setActivePage(PageView.HOME);
      }
    } catch {
      showToast('Unable to sign out right now.');
    }
  };

  const recordRecentlyViewed = useCallback(
    (dishId: string) => {
      setRecentlyViewedIds((prev) => {
        const next = [dishId, ...prev.filter((id) => id !== dishId)].slice(0, 12);
        if (currentUser) {
          syncUserLists(currentUser.uid, wishlistIds, next).catch(() => {});
          setUserProfile((p) => (p ? { ...p, recentlyViewed: next } : p));
        }
        return next;
      });
    },
    [currentUser, wishlistIds]
  );

  const handleToggleWishlist = useCallback(
    (dishId: string) => {
      setWishlistIds((prev) => {
        const exists = prev.includes(dishId);
        const next = exists ? prev.filter((id) => id !== dishId) : [dishId, ...prev];
        if (currentUser) {
          syncUserLists(currentUser.uid, next, recentlyViewedIds).catch(() => {});
          setUserProfile((p) => (p ? { ...p, wishlist: next } : p));
        }
        const dish = menuItems.find((m) => m.id === dishId);
        if (dish) {
          showToast(
            exists
              ? `Removed "${dish.name}" from Saved Favourites`
              : `Saved "${dish.name}" to your Favourites`
          );
        }
        return next;
      });
    },
    [currentUser, menuItems, recentlyViewedIds, showToast]
  );

  const handleOpenCustomize = (dish: MenuItem) => {
    recordRecentlyViewed(dish.id);
    setCustomizingDish(dish);
  };

  const handleAddCustomizedToCart = (
    dish: MenuItem,
    quantity: number,
    customization: CartCustomization,
    unitPrice: number
  ) => {
    if (!dish.available) {
      showToast(`"${dish.name}" is currently sold out.`);
      return;
    }
    const cartLineId = buildCartLineId(dish.id, customization);
    setCart((prev) => {
      const existing = prev.find((c) => c.cartLineId === cartLineId);
      if (existing) {
        return prev.map((c) =>
          c.cartLineId === cartLineId
            ? { ...c, quantity: Math.min(50, c.quantity + quantity), unitPrice }
            : c
        );
      }
      return [
        ...prev,
        {
          cartLineId,
          item: dish,
          quantity: Math.min(50, quantity),
          customization,
          unitPrice,
        },
      ];
    });
    recordRecentlyViewed(dish.id);
    showToast(`Added ${quantity}× "${dish.name}" to your Order Bag`);
  };

  const handleQuickAdd = (dish: MenuItem) => {
    if (!dish.available) {
      showToast(`"${dish.name}" is currently sold out.`);
      return;
    }
    const catOptions = CATEGORY_CUSTOMIZATIONS[dish.category];
    const defaultSize = catOptions?.sizes[0] || {
      id: 'standard',
      label: 'Standard',
      priceDelta: 0,
    };
    const baseEffectivePrice =
      dish.promoPrice > 0 && dish.promoPrice < dish.price ? dish.promoPrice : dish.price;
    const customization: CartCustomization = {
      sizeId: defaultSize.id,
      sizeLabel: defaultSize.label,
      sizePriceDelta: defaultSize.priceDelta,
      selectedExtras: [],
      specialInstructions: '',
    };
    handleAddCustomizedToCart(
      dish,
      1,
      customization,
      baseEffectivePrice + defaultSize.priceDelta
    );
  };

  const handleUpdateQuantity = (cartLineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.cartLineId === cartLineId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const handleRemoveCartItem = (cartLineId: string) => {
    setCart((prev) => prev.filter((c) => c.cartLineId !== cartLineId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleReorder = (dishIds: string[]) => {
    const availableMatches = dishIds
      .map((id) => menuItems.find((m) => m.id === id && m.available))
      .filter((m): m is MenuItem => Boolean(m));

    if (availableMatches.length === 0) {
      showToast('Dishes from that order are currently unavailable.');
      return;
    }

    availableMatches.forEach((dish) => {
      const catOptions = CATEGORY_CUSTOMIZATIONS[dish.category];
      const defaultSize = catOptions?.sizes[0] || {
        id: 'standard',
        label: 'Standard',
        priceDelta: 0,
      };
      const baseEffectivePrice =
        dish.promoPrice > 0 && dish.promoPrice < dish.price
          ? dish.promoPrice
          : dish.price;
      const customization: CartCustomization = {
        sizeId: defaultSize.id,
        sizeLabel: defaultSize.label,
        sizePriceDelta: defaultSize.priceDelta,
        selectedExtras: [],
        specialInstructions: '',
      };
      const cartLineId = buildCartLineId(dish.id, customization);
      setCart((prev) => {
        const existing = prev.find((c) => c.cartLineId === cartLineId);
        if (existing) {
          return prev.map((c) =>
            c.cartLineId === cartLineId ? { ...c, quantity: c.quantity + 1 } : c
          );
        }
        return [
          ...prev,
          {
            cartLineId,
            item: dish,
            quantity: 1,
            customization,
            unitPrice: baseEffectivePrice + defaultSize.priceDelta,
          },
        ];
      });
    });

    setIsCartOpen(true);
    showToast(`Added ${availableMatches.length} signature dish(es) to your Order Bag.`);
  };

  const handleOrderNowHero = () => {
    if (cartCount > 0) {
      setIsCartOpen(true);
    } else {
      handleNavigate(PageView.MENU);
      showToast('Explore our seasonal dishes or customize your order.');
    }
  };

  const handleCopyPromoCode = (code: string) => {
    setExternalCouponCode(code);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    showToast(`Privilege code ${code} copied & queued for your Order Bag.`);
    if (cartCount > 0) {
      setIsCartOpen(true);
    }
  };

  const handleOrderPlaced = (order: OrderRecord) => {
    setIsCartOpen(false);
    setInspectingOrder(order);
    showToast(`Order ${order.orderNumber} confirmed! Live tracking & receipt ready.`);
  };

  const handleReservationCreated = (res: ReservationRecord) => {
    showToast(`Table reservation ${res.reservationCode} saved to your account.`);
  };

  return (
    <div className="min-h-screen flex flex-col rb-bg rb-text transition-colors duration-200">
      <Header
        activePage={activePage}
        onNavigate={handleNavigate}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onSignInRequest={handleSignInRequest}
        settings={settings}
        onCopyPromoCode={handleCopyPromoCode}
      />

      <main className="flex-1 no-print">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {activePage === PageView.HOME && (
              <HomeView
                menuItems={menuItems}
                wishlistIds={wishlistIds}
                customerReviews={combinedReviews}
                currentUser={currentUser}
                onToggleWishlist={handleToggleWishlist}
                onOpenCustomize={handleOpenCustomize}
                onQuickAdd={handleQuickAdd}
                onNavigate={handleNavigate}
                onOrderNow={handleOrderNowHero}
                onSignInRequest={handleSignInRequest}
              />
            )}

            {activePage === PageView.MENU && (
              <MenuView
                menuItems={menuItems}
                wishlistIds={wishlistIds}
                recentlyViewedIds={recentlyViewedIds}
                onToggleWishlist={handleToggleWishlist}
                onOpenCustomize={handleOpenCustomize}
                onQuickAdd={handleQuickAdd}
              />
            )}

            {activePage === PageView.RESERVATIONS && (
              <ReservationsView
                currentUser={currentUser}
                userProfile={userProfile}
                settings={settings}
                onSignInRequest={handleSignInRequest}
                onNavigate={handleNavigate}
                onReservationCreated={handleReservationCreated}
              />
            )}

            {activePage === PageView.ABOUT && (
              <AboutView onNavigate={handleNavigate} />
            )}

            {activePage === PageView.CONTACT && (
              <ContactView
                settings={settings}
                deliveryZones={storefrontZones}
              />
            )}

            {activePage === PageView.ACCOUNT && (
              <CustomerAccountView
                currentUser={currentUser}
                isAdmin={isAdmin}
                userProfile={userProfile}
                onProfileUpdated={(next) => {
                  setUserProfile(next);
                  showToast('Member profile preferences updated.');
                }}
                savedAddresses={savedAddresses}
                orders={userOrders}
                reservations={userReservations}
                menuItems={menuItems}
                wishlistIds={wishlistIds}
                recentlyViewedIds={recentlyViewedIds}
                deliveryZones={storefrontZones}
                onSignInRequest={handleSignInRequest}
                onSignOutRequest={handleSignOutRequest}
                onOpenCustomize={handleOpenCustomize}
                onToggleWishlist={handleToggleWishlist}
                onReorder={handleReorder}
                onInspectReceipt={(ord) => setInspectingOrder(ord)}
                onNavigate={handleNavigate}
              />
            )}

            {activePage === PageView.ADMIN && (
              <AdminView
                currentUser={currentUser}
                isAdmin={isAdmin}
                onSignInRequest={handleSignInRequest}
                isCloudSeeded={isCloudSeeded}
                menuItems={menuItems}
                orders={adminOrders}
                reservations={adminReservations}
                coupons={coupons}
                deliveryZones={deliveryZones}
                settings={settings}
                customerReviews={combinedReviews}
                onInspectReceipt={(ord) => setInspectingOrder(ord)}
                onNotify={showToast}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer
        onNavigate={handleNavigate}
        settings={settings}
        currentUser={currentUser}
        onSignInRequest={handleSignInRequest}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onBrowseMenu={() => handleNavigate(PageView.MENU)}
        coupons={storefrontCoupons}
        deliveryZones={storefrontZones}
        settings={settings}
        currentUser={currentUser}
        userProfile={userProfile}
        savedAddresses={savedAddresses}
        onSignInRequest={handleSignInRequest}
        onOrderPlaced={handleOrderPlaced}
        externalCouponCode={externalCouponCode}
      />

      <DishCustomizeModal
        dish={customizingDish}
        onClose={() => setCustomizingDish(null)}
        onAddCustomizedToCart={handleAddCustomizedToCart}
        isWishlisted={
          customizingDish ? wishlistIds.includes(customizingDish.id) : false
        }
        onToggleWishlist={handleToggleWishlist}
      />

      <ReceiptModal
        order={inspectingOrder}
        isAdmin={isAdmin}
        onClose={() => setInspectingOrder(null)}
      />

      {/* Non-blocking subtle feedback toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-5 right-5 z-40 max-w-sm px-4 py-3 rounded-md rb-surface border border-[#D4AF37]/50 text-xs sm:text-sm rb-text shadow-xl pointer-events-none no-print"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

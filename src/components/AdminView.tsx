import React, { useMemo, useState } from 'react';
import {
  Database,
  Edit3,
  Lock,
  LogIn,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../lib/firebase';
import {
  deleteAdminCoupon,
  deleteAdminDeliveryZone,
  deleteAdminMenuItem,
  deleteCustomerReview,
  saveAdminCoupon,
  saveAdminDeliveryZone,
  saveAdminMenuItem,
  saveAdminSettings,
  seedInitialCloudCatalog,
  updateOrderStatusInDb,
  updateReservationStatusInDb,
} from '../lib/firestoreService';
import { BRAND_IMAGES, resolveDishImage } from '../data/initialData';
import {
  Coupon,
  CustomerReview,
  DeliveryZone,
  MenuCategory,
  MenuItem,
  OrderRecord,
  OrderStatus,
  ReservationRecord,
  ReservationStatus,
  RestaurantSettings,
} from '../types';
import { SafeImage } from './SafeImage';

interface AdminViewProps {
  currentUser: User | null;
  isAdmin: boolean;
  onSignInRequest: () => Promise<void>;
  isCloudSeeded: boolean;
  menuItems: MenuItem[];
  orders: OrderRecord[];
  reservations: ReservationRecord[];
  coupons: Coupon[];
  deliveryZones: DeliveryZone[];
  settings: RestaurantSettings;
  customerReviews: CustomerReview[];
  onInspectReceipt: (order: OrderRecord) => void;
  onNotify: (msg: string) => void;
}

const CATEGORIES = [
  MenuCategory.BURGERS,
  MenuCategory.PIZZA,
  MenuCategory.BBQ,
  MenuCategory.FAST_FOOD,
  MenuCategory.DRINKS,
  MenuCategory.DESSERTS,
];

const ORDER_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
];

const RESERVATION_STATUSES = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
  ReservationStatus.SEATED,
  ReservationStatus.COMPLETED,
  ReservationStatus.CANCELLED,
];

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  isAdmin,
  onSignInRequest,
  isCloudSeeded,
  menuItems,
  orders,
  reservations,
  coupons,
  deliveryZones,
  settings,
  customerReviews,
  onInspectReceipt,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'menu' | 'orders' | 'reservations' | 'coupons' | 'settings'
  >('analytics');
  const [chartHorizon, setChartHorizon] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showSampleProjection, setShowSampleProjection] = useState(false);

  const [seeding, setSeeding] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'All' | OrderStatus>('All');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Dish Modal State
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<MenuCategory>(MenuCategory.BURGERS);
  const [formPrice, setFormPrice] = useState('32');
  const [formPromoPrice, setFormPromoPrice] = useState('0');
  const [formPrepTime, setFormPrepTime] = useState('15 min');
  const [formDietary, setFormDietary] = useState('');
  const [formSpecialLabel, setFormSpecialLabel] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImageKey, setFormImageKey] = useState('burger');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formAvailable, setFormAvailable] = useState(true);
  const [savingDish, setSavingDish] = useState(false);

  // Coupon Form State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState('15');
  const [newCouponMin, setNewCouponMin] = useState('50');

  // Delivery Zone Form State
  const [zoneName, setZoneName] = useState('');
  const [zoneFee, setZoneFee] = useState('7');
  const [zoneMin, setZoneMin] = useState('35');
  const [zoneTime, setZoneTime] = useState('30–40 min');

  // Settings Editable State
  const [localSettings, setLocalSettings] = useState<RestaurantSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Analytics Computations
  const nonCancelledOrders = useMemo(
    () => orders.filter((o) => o.status !== OrderStatus.CANCELLED),
    [orders]
  );

  const totalLiveRevenue = useMemo(
    () => nonCancelledOrders.reduce((acc, o) => acc + o.total, 0),
    [nonCancelledOrders]
  );

  const avgOrderValue = useMemo(
    () => (nonCancelledOrders.length > 0 ? totalLiveRevenue / nonCancelledOrders.length : 0),
    [nonCancelledOrders.length, totalLiveRevenue]
  );

  const revenueChartData = useMemo(() => {
    const now = Date.now();
    if (chartHorizon === 'daily') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const sampleVals = [1240, 1480, 1690, 2120, 3280, 3890, 2740];
      return days.map((label, idx) => {
        const dayStart = now - (6 - idx) * 86400000;
        const dayEnd = dayStart + 86400000;
        const liveSum = nonCancelledOrders
          .filter((o) => o.createdAtMs >= dayStart && o.createdAtMs < dayEnd)
          .reduce((s, o) => s + o.total, 0);
        return {
          period: label,
          revenue: Number((liveSum + (showSampleProjection ? sampleVals[idx] : 0)).toFixed(2)),
          orders:
            nonCancelledOrders.filter((o) => o.createdAtMs >= dayStart && o.createdAtMs < dayEnd)
              .length + (showSampleProjection ? Math.round(sampleVals[idx] / 78) : 0),
        };
      });
    }

    if (chartHorizon === 'weekly') {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Current Wk'];
      const sampleVals = [9850, 11420, 12980, 14650];
      return weeks.map((label, idx) => {
        const wkStart = now - (3 - idx) * 7 * 86400000;
        const wkEnd = wkStart + 7 * 86400000;
        const liveSum = nonCancelledOrders
          .filter((o) => o.createdAtMs >= wkStart && o.createdAtMs < wkEnd)
          .reduce((s, o) => s + o.total, 0);
        return {
          period: label,
          revenue: Number((liveSum + (showSampleProjection ? sampleVals[idx] : 0)).toFixed(2)),
          orders:
            nonCancelledOrders.filter((o) => o.createdAtMs >= wkStart && o.createdAtMs < wkEnd)
              .length + (showSampleProjection ? Math.round(sampleVals[idx] / 82) : 0),
        };
      });
    }

    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const sampleVals = [38400, 42100, 45900, 44200, 49800, 54600];
    return months.map((label, idx) => {
      const isCurrent = idx === months.length - 1;
      const liveSum = isCurrent ? totalLiveRevenue : 0;
      return {
        period: label,
        revenue: Number((liveSum + (showSampleProjection ? sampleVals[idx] : 0)).toFixed(2)),
        orders:
          (isCurrent ? nonCancelledOrders.length : 0) +
          (showSampleProjection ? Math.round(sampleVals[idx] / 80) : 0),
      };
    });
  }, [chartHorizon, nonCancelledOrders, showSampleProjection, totalLiveRevenue]);

  // STRICT ADMIN PROTECTION GATE
  if (!currentUser || !isAdmin) {
    return (
      <div className="rb-bg rb-text min-h-[75vh] py-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-10 rounded-lg rb-surface border rb-border text-center space-y-6">
            <Lock className="w-10 h-10 rb-accent mx-auto stroke-[1.5]" />
            <div className="space-y-2">
              <p className="text-xs rb-accent font-semibold tracking-wide">
                Protected Operations Console
              </p>
              <h1 className="font-serif text-3xl font-semibold rb-text">
                Administrator Authentication Required
              </h1>
              <p className="text-sm rb-text-muted leading-relaxed">
                This dashboard is restricted to verified Royal Bites administrators (
                <span className="font-mono text-xs">{BOOTSTRAPPED_ADMIN_EMAIL}</span>) and enforced
                by Firestore Zero-Trust Security Rules.
              </p>
            </div>

            {currentUser ? (
              <div className="p-4 rounded-md rb-bg-alt border rb-border text-xs rb-text-muted">
                Signed in as <strong className="rb-text">{currentUser.email}</strong> (Standard
                Customer Role). Sign in with an authorized administrator account to manage catalog,
                orders, and analytics.
              </div>
            ) : null}

            <button
              type="button"
              onClick={onSignInRequest}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-sm font-semibold hover:bg-[#E5C76B] transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>{currentUser ? 'Switch Google Account' : 'Sign In as Administrator'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSeedCloud = async () => {
    setSeeding(true);
    try {
      await seedInitialCloudCatalog();
      onNotify('Cloud catalog, coupons, delivery zones, and settings initialized in Firestore.');
    } catch {
      onNotify('Failed to seed cloud catalog.');
    } finally {
      setSeeding(false);
    }
  };

  const ensureSeededBeforeMutation = async () => {
    if (!isCloudSeeded) {
      await seedInitialCloudCatalog();
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory(MenuCategory.BURGERS);
    setFormPrice('32');
    setFormPromoPrice('0');
    setFormPrepTime('15 min');
    setFormDietary('Chef Specialty');
    setFormSpecialLabel('');
    setFormDesc('');
    setFormImageKey('burger');
    setFormFeatured(false);
    setFormAvailable(true);
    setIsDishModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(String(item.price));
    setFormPromoPrice(String(item.promoPrice || 0));
    setFormPrepTime(item.prepTime);
    setFormDietary(item.dietaryNote);
    setFormSpecialLabel(item.specialOfferLabel);
    setFormDesc(item.description);
    setFormImageKey(item.imageKey || 'burger');
    setFormFeatured(item.featured);
    setFormAvailable(item.available);
    setIsDishModalOpen(true);
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDish(true);
    try {
      await ensureSeededBeforeMutation();
      const id = editingItem ? editingItem.id : `rb-item-${Date.now()}`;
      await saveAdminMenuItem(
        {
          id,
          name: formName.trim(),
          category: formCategory,
          price: Math.max(1, Number(formPrice) || 20),
          promoPrice: Math.max(0, Number(formPromoPrice) || 0),
          prepTime: formPrepTime.trim() || '15 min',
          dietaryNote: formDietary.trim(),
          specialOfferLabel: formSpecialLabel.trim(),
          description: formDesc.trim(),
          imageKey: formImageKey,
          featured: formFeatured,
          available: formAvailable,
        },
        Boolean(editingItem)
      );
      setIsDishModalOpen(false);
      onNotify(`Saved "${formName.trim()}" to Firestore Menu Catalog.`);
    } finally {
      setSavingDish(false);
    }
  };

  const handleToggleDishAvailability = async (dish: MenuItem) => {
    await ensureSeededBeforeMutation();
    await saveAdminMenuItem(
      {
        id: dish.id,
        name: dish.name,
        category: dish.category,
        price: dish.price,
        promoPrice: dish.promoPrice,
        prepTime: dish.prepTime,
        dietaryNote: dish.dietaryNote,
        specialOfferLabel: dish.specialOfferLabel,
        description: dish.description,
        imageKey: dish.imageKey,
        featured: dish.featured,
        available: !dish.available,
      },
      true
    );
    onNotify(`${dish.name} marked ${!dish.available ? 'Available' : 'Sold Out'}.`);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim() || !newCouponDesc.trim()) return;
    await ensureSeededBeforeMutation();
    const cleanCode = newCouponCode.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const exists = coupons.some((c) => c.code === cleanCode);
    await saveAdminCoupon(
      {
        code: cleanCode,
        description: newCouponDesc.trim(),
        discountType: newCouponType,
        discountValue: Math.max(1, Number(newCouponValue) || 10),
        minOrderAmount: Math.max(0, Number(newCouponMin) || 0),
        active: true,
      },
      exists
    );
    setNewCouponCode('');
    setNewCouponDesc('');
    onNotify(`Coupon ${cleanCode} saved to Firestore.`);
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;
    await ensureSeededBeforeMutation();
    await saveAdminDeliveryZone(
      {
        id: `zone-${Date.now()}`,
        name: zoneName.trim(),
        fee: Math.max(0, Number(zoneFee) || 6),
        minOrder: Math.max(0, Number(zoneMin) || 30),
        estimatedTime: zoneTime.trim() || '30–40 min',
        active: true,
      },
      false
    );
    setZoneName('');
    onNotify('Delivery zone added.');
  };

  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await ensureSeededBeforeMutation();
      await saveAdminSettings(localSettings, true);
      onNotify('Storefront hours, tax rate, and promotional banner saved.');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredMenu = menuItems.filter(
    (m) =>
      !menuSearch.trim() ||
      m.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(menuSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(
    (o) => orderFilter === 'All' || o.status === orderFilter
  );

  return (
    <div className="rb-bg rb-text min-h-screen py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Executive Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b rb-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs rb-accent font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Administrator · {currentUser.email}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold rb-text">
              Enterprise Restaurant Console
            </h1>
            <p className="text-xs sm:text-sm rb-text-muted">
              Real-time Firestore management for menu catalog, live orders, table reservations,
              promotions, delivery zones, and revenue analytics.
            </p>
          </div>

          {!isCloudSeeded && (
            <button
              type="button"
              disabled={seeding}
              onClick={handleSeedCloud}
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs sm:text-sm font-semibold hover:bg-[#E5C76B] disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Database className="w-4 h-4" />
              <span>
                {seeding ? 'Seeding Firestore...' : 'Initialize Cloud Catalog in Firestore'}
              </span>
            </button>
          )}
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-lg rb-surface border rb-border">
            <p className="text-xs rb-text-subtle">Live Cloud Revenue</p>
            <p className="mt-2 font-mono text-2xl sm:text-3xl font-medium tabular-nums rb-accent">
              ${totalLiveRevenue.toFixed(2)}
            </p>
            <p className="text-[11px] rb-text-subtle mt-1">
              Avg Order: ${avgOrderValue.toFixed(2)}
            </p>
          </div>

          <div className="p-5 rounded-lg rb-surface border rb-border">
            <p className="text-xs rb-text-subtle">Customer Orders</p>
            <p className="mt-2 font-mono text-2xl sm:text-3xl font-medium tabular-nums rb-text">
              {orders.length}
            </p>
            <p className="text-[11px] rb-text-subtle mt-1">
              {orders.filter((o) => o.status === OrderStatus.PENDING).length} Pending Action
            </p>
          </div>

          <div className="p-5 rounded-lg rb-surface border rb-border">
            <p className="text-xs rb-text-subtle">Table Reservations</p>
            <p className="mt-2 font-mono text-2xl sm:text-3xl font-medium tabular-nums rb-text">
              {reservations.length}
            </p>
            <p className="text-[11px] rb-text-subtle mt-1">
              {reservations.filter((r) => r.status === ReservationStatus.PENDING).length} Awaiting
              Review
            </p>
          </div>

          <div className="p-5 rounded-lg rb-surface border rb-border">
            <p className="text-xs rb-text-subtle">In-Stock Menu Dishes</p>
            <p className="mt-2 font-mono text-2xl sm:text-3xl font-medium tabular-nums rb-accent">
              {menuItems.filter((i) => i.available).length}{' '}
              <span className="text-sm rb-text-subtle">/ {menuItems.length}</span>
            </p>
            <p className="text-[11px] rb-text-subtle mt-1">
              {coupons.filter((c) => c.active).length} Active Promo Codes
            </p>
          </div>
        </div>

        {/* Console Module Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b rb-border pb-3">
          {[
            { id: 'analytics', label: 'Sales & Analytics' },
            { id: 'menu', label: `Menu & Sold-Out (${menuItems.length})` },
            { id: 'orders', label: `Live Orders (${orders.length})` },
            { id: 'reservations', label: `Reservations (${reservations.length})` },
            { id: 'coupons', label: `Coupons (${coupons.length})` },
            { id: 'settings', label: 'Zones, Hours & Reviews' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2.5 min-h-[40px] rounded-md text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#D4AF37] text-[#0A0A0C]'
                    : 'rb-surface border rb-border rb-text-muted hover:rb-text'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* MODULE 1: SALES REPORTS & REVENUE CHARTS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setChartHorizon(mode)}
                    className={`px-3.5 py-2 rounded-md text-xs font-semibold capitalize transition-colors ${
                      chartHorizon === mode
                        ? 'bg-[#D4AF37] text-[#0A0A0C]'
                        : 'rb-surface border rb-border rb-text-muted'
                    }`}
                  >
                    {mode} Report
                  </button>
                ))}
              </div>

              <label className="inline-flex items-center gap-2 text-xs rb-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSampleProjection}
                  onChange={(e) => setShowSampleProjection(e.target.checked)}
                  className="accent-[#D4AF37] w-4 h-4"
                />
                <span>Overlay Mayfair Benchmark Projection (Preview Curve)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Revenue Area Chart */}
              <div className="lg:col-span-7 p-6 rounded-lg rb-surface border rb-border space-y-4">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-serif text-xl font-semibold rb-text capitalize">
                    {chartHorizon} Revenue Performance (USD)
                  </h2>
                  <span className="text-xs rb-text-subtle">
                    {showSampleProjection ? 'Live + Benchmark Overlay' : 'Live Firestore Orders'}
                  </span>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartData}>
                      <defs>
                        <linearGradient id="goldRevGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.14)" />
                      <XAxis dataKey="period" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#141418',
                          borderColor: 'rgba(212,175,55,0.4)',
                          color: '#F5F5F3',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#D4AF37"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#goldRevGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Order Volume Bar Chart */}
              <div className="lg:col-span-5 p-6 rounded-lg rb-surface border rb-border space-y-4">
                <h2 className="font-serif text-xl font-semibold rb-text capitalize">
                  {chartHorizon} Order Volume
                </h2>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.14)" />
                      <XAxis dataKey="period" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#141418',
                          borderColor: 'rgba(212,175,55,0.4)',
                          color: '#F5F5F3',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="orders" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 2: MENU CATALOG, PROMOS & SOLD-OUT */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 rb-text-subtle absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Filter dishes by name or category..."
                  className="w-full pl-10 pr-4 py-2.5 min-h-[42px] rounded-md rb-surface border rb-border text-sm rb-text focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[42px] rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs sm:text-sm font-semibold hover:bg-[#E5C76B] whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Dish</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border rb-border rb-surface">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b rb-border text-xs rb-text-subtle">
                    <th className="py-3.5 px-5 font-semibold">Dish</th>
                    <th className="py-3.5 px-4 font-semibold">Category</th>
                    <th className="py-3.5 px-4 font-semibold">Pricing</th>
                    <th className="py-3.5 px-4 font-semibold">Stock Status</th>
                    <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y rb-border text-sm">
                  {filteredMenu.map((dish) => (
                    <tr key={dish.id} className="hover:opacity-95 transition-opacity">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded overflow-hidden shrink-0 bg-[#18181D]">
                            <SafeImage
                              src={dish.image}
                              alt={dish.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold rb-text">{dish.name}</p>
                            <p className="text-xs rb-text-subtle">
                              {dish.prepTime}
                              {dish.featured ? ' · Featured' : ''}
                              {dish.specialOfferLabel ? ` · ${dish.specialOfferLabel}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs rb-text-muted whitespace-nowrap">
                        {dish.category}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums whitespace-nowrap">
                        {dish.promoPrice > 0 && dish.promoPrice < dish.price ? (
                          <div>
                            <span className="rb-accent font-semibold">
                              ${dish.promoPrice.toFixed(2)}
                            </span>{' '}
                            <span className="text-xs line-through rb-text-subtle">
                              ${dish.price.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="rb-accent">${dish.price.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleDishAvailability(dish)}
                          className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                            dish.available
                              ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                              : 'rb-border rb-text-subtle rb-bg-alt'
                          }`}
                        >
                          {dish.available ? 'Available' : 'Sold Out'}
                        </button>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        {confirmDeleteId === dish.id ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                await ensureSeededBeforeMutation();
                                await deleteAdminMenuItem(dish.id);
                                setConfirmDeleteId(null);
                                onNotify('Dish deleted from Firestore.');
                              }}
                              className="px-2.5 py-1 rounded bg-red-500 text-white text-xs font-semibold"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-xs rb-text-muted"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(dish)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border rb-border text-xs rb-text hover:border-[#D4AF37]"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(dish.id)}
                              aria-label={`Delete ${dish.name}`}
                              className="p-1.5 rounded-md border rb-border rb-text-subtle hover:text-red-400 hover:border-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODULE 3: LIVE CUSTOMER ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {(['All', ...ORDER_STATUSES] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOrderFilter(st)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
                    orderFilter === st
                      ? 'bg-[#D4AF37] text-[#0A0A0C]'
                      : 'rb-surface border rb-border rb-text-muted'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center rounded-lg rb-surface border rb-border text-sm rb-text-muted">
                No customer orders matching "{orderFilter}" in Firestore yet.
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-6 rounded-lg rb-surface border rb-border flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs rb-text-subtle">
                      <span className="font-mono font-semibold rb-accent">{order.orderNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span>{order.createdAtLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{order.channel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{order.zoneName}</span>
                    </div>

                    <h3 className="text-base font-semibold rb-text">
                      {order.customerName}{' '}
                      <span className="font-mono text-xs font-normal rb-text-muted ml-2">
                        {order.phone}
                      </span>
                    </h3>
                    <p className="text-xs rb-text-muted">{order.address}</p>
                    <p className="text-xs sm:text-sm rb-text pt-1">{order.itemSummary}</p>
                    {order.notes && <p className="text-xs rb-accent">Notes: {order.notes}</p>}
                  </div>

                  <div className="flex flex-wrap sm:items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 rb-border shrink-0">
                    <span className="font-mono text-lg tabular-nums font-semibold rb-accent mr-2">
                      ${order.total.toFixed(2)}
                    </span>

                    <button
                      type="button"
                      onClick={() => onInspectReceipt(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-md border rb-border text-xs font-semibold rb-text hover:border-[#D4AF37]"
                    >
                      <Printer className="w-3.5 h-3.5 rb-accent" />
                      <span>Receipt</span>
                    </button>

                    <select
                      aria-label={`Order ${order.orderNumber} status`}
                      value={order.status}
                      onChange={async (e) => {
                        const next = e.target.value as OrderStatus;
                        await updateOrderStatusInDb(order.id, next);
                        onNotify(`Order ${order.orderNumber} status -> ${next}`);
                      }}
                      className="px-3.5 py-2 min-h-[40px] rounded-md rb-bg border rb-border text-xs font-semibold rb-text focus:outline-none focus:border-[#D4AF37]"
                    >
                      {ORDER_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MODULE 4: TABLE RESERVATIONS */}
        {activeTab === 'reservations' && (
          <div className="space-y-4">
            {reservations.length === 0 ? (
              <div className="p-12 text-center rounded-lg rb-surface border rb-border text-sm rb-text-muted">
                No table reservations recorded in Firestore yet.
              </div>
            ) : (
              reservations.map((res) => (
                <div
                  key={res.id}
                  className="p-6 rounded-lg rb-surface border rb-border flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs rb-text-subtle">
                      <span className="font-mono font-semibold rb-accent">
                        {res.reservationCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{res.seating}</span>
                      <span aria-hidden="true">·</span>
                      <span>Logged {res.createdAtLabel}</span>
                    </div>
                    <h3 className="text-base font-semibold rb-text">
                      {res.name}{' '}
                      <span className="font-mono text-xs font-normal rb-text-muted ml-2">
                        {res.phone}
                      </span>
                    </h3>
                    {res.specialRequests && (
                      <p className="text-xs rb-text-muted">Requests: {res.specialRequests}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-5 pt-4 lg:pt-0 border-t lg:border-t-0 rb-border">
                    <div className="font-mono text-xs tabular-nums rb-text">
                      {res.date} · <span className="rb-accent font-semibold">{res.time}</span> ·{' '}
                      {res.guests} Guests
                    </div>

                    <select
                      aria-label={`Reservation ${res.reservationCode} status`}
                      value={res.status}
                      onChange={async (e) => {
                        const next = e.target.value as ReservationStatus;
                        await updateReservationStatusInDb(res.id, next);
                        onNotify(`Reservation ${res.reservationCode} -> ${next}`);
                      }}
                      className="px-3.5 py-2 min-h-[40px] rounded-md rb-bg border rb-border text-xs font-semibold rb-text"
                    >
                      {RESERVATION_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MODULE 5: COUPONS & DISCOUNTS */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form
              onSubmit={handleCreateCoupon}
              className="lg:col-span-5 p-6 rounded-lg rb-surface border rb-border space-y-4 h-fit"
            >
              <h2 className="font-serif text-2xl font-semibold rb-text">
                Create or Update Coupon
              </h2>
              <div>
                <label className="block text-xs font-semibold rb-text mb-1">
                  Promo Code (Uppercase Alphanumeric) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={32}
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TRUFFLE25"
                  className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm font-mono uppercase rb-text"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold rb-text mb-1">Description *</label>
                <input
                  type="text"
                  required
                  maxLength={160}
                  value={newCouponDesc}
                  onChange={(e) => setNewCouponDesc(e.target.value)}
                  placeholder="25% off evening truffle tasting orders"
                  className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm rb-text"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold rb-text mb-1">Type</label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full px-2.5 py-2 rounded-md rb-bg border rb-border text-xs rb-text"
                  >
                    <option value="percentage">% Off</option>
                    <option value="fixed">$ Fixed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold rb-text mb-1">Value</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-md rb-bg border rb-border text-xs font-mono rb-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold rb-text mb-1">Min Order $</label>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    value={newCouponMin}
                    onChange={(e) => setNewCouponMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-md rb-bg border rb-border text-xs font-mono rb-text"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-5 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs font-semibold"
              >
                Save Promotional Code
              </button>
            </form>

            <div className="lg:col-span-7 space-y-3">
              {coupons.map((c) => (
                <div
                  key={c.code}
                  className="p-5 rounded-lg rb-surface border rb-border flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold rb-accent">{c.code}</span>
                      <span className="text-xs rb-text-subtle">
                        ·{' '}
                        {c.discountType === 'percentage'
                          ? `${c.discountValue}% Off`
                          : `$${c.discountValue} Off`}{' '}
                        (Min ${c.minOrderAmount})
                      </span>
                    </div>
                    <p className="text-xs rb-text-muted mt-1">{c.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        await ensureSeededBeforeMutation();
                        await saveAdminCoupon({ ...c, active: !c.active }, true);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${
                        c.active
                          ? 'border-emerald-500/40 text-emerald-500'
                          : 'rb-border rb-text-subtle'
                      }`}
                    >
                      {c.active ? 'Active' : 'Paused'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await ensureSeededBeforeMutation();
                        await deleteAdminCoupon(c.code);
                      }}
                      aria-label={`Delete coupon ${c.code}`}
                      className="p-1.5 rounded-md border rb-border rb-text-subtle hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 6: STOREFRONT SETTINGS, DELIVERY ZONES & REVIEWS */}
        {activeTab === 'settings' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Storefront & Opening Hours Form */}
              <form
                onSubmit={handleSaveGlobalSettings}
                className="lg:col-span-6 p-6 rounded-lg rb-surface border rb-border space-y-4"
              >
                <h2 className="font-serif text-2xl font-semibold rb-text">
                  Storefront Banner, Hours & Tax
                </h2>

                <div className="flex flex-wrap gap-6">
                  <label className="inline-flex items-center gap-2 text-xs rb-text cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.acceptingOrders}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, acceptingOrders: e.target.checked })
                      }
                      className="accent-[#D4AF37]"
                    />
                    <span>Accepting Online Orders</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs rb-text cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.promoBannerActive}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, promoBannerActive: e.target.checked })
                      }
                      className="accent-[#D4AF37]"
                    />
                    <span>Show Top Promotional Banner</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold rb-text mb-1">
                    Promotional Banner Copy
                  </label>
                  <input
                    type="text"
                    maxLength={180}
                    value={localSettings.promoBannerText}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, promoBannerText: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm rb-text"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold rb-text mb-1">Banner Code</label>
                    <input
                      type="text"
                      maxLength={32}
                      value={localSettings.promoBannerCode}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          promoBannerCode: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full px-3 py-2 rounded-md rb-bg border rb-border text-xs font-mono rb-text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold rb-text mb-1">Tax Rate %</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="30"
                      value={localSettings.taxRatePercent}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          taxRatePercent: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-md rb-bg border rb-border text-xs font-mono rb-text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold rb-text mb-1">
                      Free Deliv. $
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={localSettings.freeDeliveryThreshold}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          freeDeliveryThreshold: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-md rb-bg border rb-border text-xs font-mono rb-text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold rb-text mb-1">
                      Mon–Thu Hours
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={localSettings.weekdayHours}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, weekdayHours: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-md rb-bg border rb-border text-xs font-mono rb-text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold rb-text mb-1">
                      Fri–Sat Hours
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={localSettings.weekendHours}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, weekendHours: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-md rb-bg border rb-border text-xs font-mono rb-text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold rb-text mb-1">Sunday Hours</label>
                    <input
                      type="text"
                      maxLength={50}
                      value={localSettings.sundayHours}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, sundayHours: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-md rb-bg border rb-border text-xs font-mono rb-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold rb-text mb-1">
                    WhatsApp Concierge Number (Digits Only)
                  </label>
                  <input
                    type="text"
                    maxLength={24}
                    value={localSettings.whatsappNumber}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-xs font-mono rb-text"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full py-2.5 px-5 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs font-semibold"
                >
                  {savingSettings ? 'Saving...' : 'Save Restaurant Settings'}
                </button>
              </form>

              {/* Delivery Zones Management */}
              <div className="lg:col-span-6 space-y-5">
                <form
                  onSubmit={handleCreateZone}
                  className="p-6 rounded-lg rb-surface border rb-border space-y-4"
                >
                  <h2 className="font-serif text-2xl font-semibold rb-text">
                    Delivery Zones & Charges
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={zoneName}
                        onChange={(e) => setZoneName(e.target.value)}
                        placeholder="Zone Name (e.g. Soho & Fitzrovia)"
                        className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm rb-text"
                      />
                    </div>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={zoneFee}
                      onChange={(e) => setZoneFee(e.target.value)}
                      placeholder="Fee $"
                      className="px-3.5 py-2 rounded-md rb-bg border rb-border text-xs font-mono rb-text"
                    />
                    <input
                      type="number"
                      min="0"
                      value={zoneMin}
                      onChange={(e) => setZoneMin(e.target.value)}
                      placeholder="Min Order $"
                      className="px-3.5 py-2 rounded-md rb-bg border rb-border text-xs font-mono rb-text"
                    />
                    <input
                      type="text"
                      maxLength={40}
                      value={zoneTime}
                      onChange={(e) => setZoneTime(e.target.value)}
                      placeholder="Est. window"
                      className="px-3.5 py-2 rounded-md rb-bg border rb-border text-xs rb-text"
                    />
                    <button
                      type="submit"
                      className="py-2 px-4 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs font-semibold"
                    >
                      Add Delivery Zone
                    </button>
                  </div>
                </form>

                <div className="space-y-2.5">
                  {deliveryZones.map((z) => (
                    <div
                      key={z.id}
                      className="p-4 rounded-lg rb-surface border rb-border flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold rb-text">{z.name}</p>
                        <p className="font-mono text-xs rb-text-muted">
                          Fee ${z.fee.toFixed(2)} · Min ${z.minOrder} · {z.estimatedTime}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await ensureSeededBeforeMutation();
                          await deleteAdminDeliveryZone(z.id);
                        }}
                        aria-label={`Delete ${z.name}`}
                        className="p-1.5 rounded border rb-border rb-text-subtle hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Reviews Moderation */}
            <div className="pt-6 border-t rb-border space-y-4">
              <h2 className="font-serif text-2xl font-semibold rb-text">
                Verified Customer Reviews ({customerReviews.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customerReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-lg rb-surface border rb-border flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold rb-text">{rev.authorName}</span>
                        <span className="font-mono rb-accent">{'★'.repeat(rev.rating)}</span>
                      </div>
                      <p className="text-xs rb-text-muted mt-2">“{rev.comment}”</p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] rb-text-subtle pt-2 border-t rb-border">
                      <span>{rev.dishName}</span>
                      {rev.userId !== 'seed' && (
                        <button
                          type="button"
                          onClick={() => deleteCustomerReview(rev.id)}
                          className="text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT DISH MODAL */}
      {isDishModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={editingItem ? 'Edit Menu Dish' : 'Add Menu Dish'}
        >
          <div className="fixed inset-0" onClick={() => setIsDishModalOpen(false)} />
          <form
            onSubmit={handleSaveDish}
            className="relative z-10 w-full max-w-xl rb-surface border rb-border rounded-lg p-6 sm:p-8 space-y-4 shadow-2xl my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b rb-border">
              <h2 className="font-serif text-2xl font-semibold rb-text">
                {editingItem ? 'Edit Menu Dish' : 'Add New Menu Dish'}
              </h2>
              <button
                type="button"
                onClick={() => setIsDishModalOpen(false)}
                className="w-9 h-9 inline-flex items-center justify-center rounded-md border rb-border rb-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold rb-text mb-1">Dish Title *</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm rb-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold rb-text mb-1">Category *</label>
                <select
                  value={formCategory}
                  onChange={(e) => {
                    const cat = e.target.value as MenuCategory;
                    setFormCategory(cat);
                    const p = BRAND_IMAGES.presets.find((pr) => pr.category === cat);
                    if (p && !editingItem) setFormImageKey(p.key);
                  }}
                  className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm rb-text"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold rb-text mb-1">Prep Time</label>
                <input
                  type="text"
                  maxLength={30}
                  value={formPrepTime}
                  onChange={(e) => setFormPrepTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm rb-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold rb-text mb-1">
                  Regular Price ($) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm font-mono rb-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold rb-text mb-1">
                  Promo Price ($ · 0 for none)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formPromoPrice}
                  onChange={(e) => setFormPromoPrice(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm font-mono rb-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold rb-text mb-1">Dietary Note</label>
                <input
                  type="text"
                  maxLength={60}
                  value={formDietary}
                  onChange={(e) => setFormDietary(e.target.value)}
                  placeholder="Vegetarian, Halal, Chef Signature"
                  className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm rb-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold rb-text mb-1">
                  Special Offer Label
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={formSpecialLabel}
                  onChange={(e) => setFormSpecialLabel(e.target.value)}
                  placeholder="Evening Feature, Limited"
                  className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm rb-text"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold rb-text mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  maxLength={500}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm rb-text"
                />
              </div>

              <div className="sm:col-span-2">
                <span className="block text-xs font-semibold rb-text mb-2">
                  Studio Photography Preset
                </span>
                <div className="grid grid-cols-6 gap-2">
                  {BRAND_IMAGES.presets.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setFormImageKey(p.key)}
                      className={`aspect-square rounded overflow-hidden border-2 ${
                        formImageKey === p.key ? 'border-[#D4AF37]' : 'border-transparent opacity-60'
                      }`}
                    >
                      <SafeImage
                        src={resolveDishImage(p.key)}
                        alt={p.label}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-1">
              <label className="inline-flex items-center gap-2 text-xs rb-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={formFeatured}
                  onChange={(e) => setFormFeatured(e.target.checked)}
                  className="accent-[#D4AF37]"
                />
                <span>Featured on Home</span>
              </label>
              <label className="inline-flex items-center gap-2 text-xs rb-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={formAvailable}
                  onChange={(e) => setFormAvailable(e.target.checked)}
                  className="accent-[#D4AF37]"
                />
                <span>Available (In Stock)</span>
              </label>
            </div>

            <div className="pt-4 border-t rb-border flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDishModalOpen(false)}
                className="px-4 py-2 rounded-md border rb-border text-xs font-semibold rb-text"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingDish}
                className="px-6 py-2 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs font-semibold"
              >
                {savingDish ? 'Saving...' : 'Save Dish to Cloud'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

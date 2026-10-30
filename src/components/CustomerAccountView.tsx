import React, { useEffect, useState } from 'react';
import {
  Clock,
  Heart,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  Printer,
  RotateCcw,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  deleteCustomerAddress,
  saveCustomerAddress,
  updateCustomerProfile,
  updateOrderStatusInDb,
  updateReservationStatusInDb,
} from '../lib/firestoreService';
import {
  DeliveryZone,
  MenuItem,
  OrderRecord,
  OrderStatus,
  PageView,
  ReservationRecord,
  ReservationStatus,
  SavedAddress,
  UserProfileState,
} from '../types';
import { SafeImage } from './SafeImage';

interface CustomerAccountViewProps {
  currentUser: User | null;
  isAdmin: boolean;
  userProfile: UserProfileState | null;
  onProfileUpdated: (next: UserProfileState) => void;
  savedAddresses: SavedAddress[];
  orders: OrderRecord[];
  reservations: ReservationRecord[];
  menuItems: MenuItem[];
  wishlistIds: string[];
  recentlyViewedIds: string[];
  deliveryZones: DeliveryZone[];
  onSignInRequest: () => Promise<void>;
  onSignOutRequest: () => Promise<void>;
  onOpenCustomize: (dish: MenuItem) => void;
  onToggleWishlist: (dishId: string) => void;
  onReorder: (dishIds: string[]) => void;
  onInspectReceipt: (order: OrderRecord) => void;
  onNavigate: (page: PageView) => void;
}

export const CustomerAccountView: React.FC<CustomerAccountViewProps> = ({
  currentUser,
  isAdmin,
  userProfile,
  onProfileUpdated,
  savedAddresses,
  orders,
  reservations,
  menuItems,
  wishlistIds,
  recentlyViewedIds,
  deliveryZones,
  onSignInRequest,
  onSignOutRequest,
  onOpenCustomize,
  onToggleWishlist,
  onReorder,
  onInspectReceipt,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<
    'orders' | 'wishlist' | 'addresses' | 'recent' | 'profile'
  >('orders');

  // Editable Profile State
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [dietary, setDietary] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Address Form State
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState('Mayfair Residence');
  const [addrRecipient, setAddrRecipient] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrZoneId, setAddrZoneId] = useState(deliveryZones[0]?.id || 'zone-mayfair');
  const [addrNotes, setAddrNotes] = useState('');
  const [addrDefault, setAddrDefault] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName);
      setPhone(userProfile.phone);
      setDietary(userProfile.dietaryPreferences);
    }
  }, [userProfile]);

  const wishlistedDishes = menuItems.filter((m) => wishlistIds.includes(m.id));
  const recentlyViewedDishes = recentlyViewedIds
    .map((id) => menuItems.find((m) => m.id === id))
    .filter((m): m is MenuItem => Boolean(m));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;
    setSavingProfile(true);
    setProfileMessage('');
    try {
      const next: UserProfileState = {
        ...userProfile,
        displayName: displayName.trim() || 'Guest',
        phone: phone.trim(),
        dietaryPreferences: dietary.trim(),
      };
      await updateCustomerProfile(currentUser.uid, next);
      onProfileUpdated(next);
      setProfileMessage('Profile preferences saved to cloud.');
    } catch {
      setProfileMessage('Could not update profile. Please verify fields and retry.');
    } finally {
      setSavingProfile(false);
    }
  };

  const openNewAddressForm = () => {
    setEditingAddrId(null);
    setAddrLabel('Home Residence');
    setAddrRecipient(userProfile?.displayName || '');
    setAddrPhone(userProfile?.phone || '');
    setAddrStreet('');
    setAddrZoneId(deliveryZones[0]?.id || 'zone-mayfair');
    setAddrNotes('');
    setAddrDefault(savedAddresses.length === 0);
    setShowAddrForm(true);
  };

  const openEditAddressForm = (addr: SavedAddress) => {
    setEditingAddrId(addr.id);
    setAddrLabel(addr.label);
    setAddrRecipient(addr.recipientName);
    setAddrPhone(addr.phone);
    setAddrStreet(addr.street);
    setAddrZoneId(addr.zoneId);
    setAddrNotes(addr.notes);
    setAddrDefault(addr.isDefault);
    setShowAddrForm(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingAddr(true);
    try {
      await saveCustomerAddress(
        currentUser.uid,
        {
          label: addrLabel,
          recipientName: addrRecipient,
          phone: addrPhone,
          street: addrStreet,
          zoneId: addrZoneId,
          notes: addrNotes,
          isDefault: addrDefault,
        },
        editingAddrId || undefined
      );
      setShowAddrForm(false);
    } finally {
      setSavingAddr(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="rb-bg rb-text min-h-[75vh] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="p-8 sm:p-12 rounded-lg rb-surface border rb-border text-center space-y-6">
            <UserIcon className="w-10 h-10 rb-accent mx-auto stroke-[1.5]" />
            <div className="space-y-2 max-w-lg mx-auto">
              <p className="text-xs rb-accent font-semibold tracking-wide">
                Royal Bites Private Membership
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold rb-text">
                Sign In or Register with Google
              </h1>
              <p className="text-sm rb-text-muted leading-relaxed">
                Access saved delivery addresses, real-time order status tracking, printable
                receipts, one-click reordering, and synced favourite dishes across devices.
              </p>
            </div>

            <button
              type="button"
              onClick={onSignInRequest}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 min-h-[46px] rounded-md bg-[#D4AF37] text-[#0A0A0C] text-sm font-semibold hover:bg-[#E5C76B] transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Local Guest Wishlist & Recently Viewed Preview */}
          {(wishlistedDishes.length > 0 || recentlyViewedDishes.length > 0) && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl font-semibold rb-text">
                Your Session Wishlist & Recently Viewed ({wishlistedDishes.length + recentlyViewedDishes.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...wishlistedDishes, ...recentlyViewedDishes]
                  .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i)
                  .slice(0, 6)
                  .map((dish) => (
                    <div
                      key={dish.id}
                      className="p-4 rounded-lg rb-surface border rb-border flex items-center gap-4"
                    >
                      <div className="w-16 h-16 rounded overflow-hidden shrink-0">
                        <SafeImage
                          src={dish.image}
                          alt={dish.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold rb-text truncate">{dish.name}</p>
                        <p className="font-mono text-xs rb-accent">${dish.price.toFixed(2)}</p>
                        <button
                          type="button"
                          onClick={() => onOpenCustomize(dish)}
                          className="text-xs underline rb-text-muted hover:rb-text mt-1"
                        >
                          Customize & Add
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rb-bg rb-text min-h-screen py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Account Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b rb-border">
          <div className="space-y-1">
            <p className="text-xs rb-accent font-semibold tracking-wide">
              Authenticated Member Account
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold rb-text">
              Welcome, {userProfile?.displayName || currentUser.displayName || 'Royal Guest'}
            </h1>
            <p className="text-xs rb-text-muted">{currentUser.email}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                type="button"
                onClick={() => onNavigate(PageView.ADMIN)}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs font-semibold hover:bg-[#E5C76B] transition-colors whitespace-nowrap"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Console</span>
              </button>
            )}
            <button
              type="button"
              onClick={onSignOutRequest}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-md border rb-border text-xs font-semibold rb-text hover:border-red-400 hover:text-red-400 transition-colors whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Account Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b rb-border">
          {[
            { id: 'orders', label: `Orders & Tracking (${orders.length})` },
            { id: 'wishlist', label: `Wishlist (${wishlistedDishes.length})` },
            { id: 'addresses', label: `Saved Addresses (${savedAddresses.length})` },
            { id: 'recent', label: `Recently Viewed (${recentlyViewedDishes.length})` },
            { id: 'profile', label: `Profile & Reservations (${reservations.length})` },
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

        {/* TAB 1: ORDERS, TRACKING & REORDER */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="p-12 text-center rounded-lg rb-surface border rb-border space-y-4">
                <h2 className="font-serif text-2xl font-semibold rb-text">No cloud orders yet</h2>
                <p className="text-sm rb-text-muted max-w-md mx-auto">
                  Place an order from our menu to track kitchen preparation in real time and print
                  itemized receipts.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate(PageView.MENU)}
                  className="px-5 py-2.5 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs font-semibold"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              orders.map((order) => (
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
                      <span className="font-semibold rb-text">{order.status}</span>
                    </div>

                    <p className="text-sm rb-text leading-relaxed">{order.itemSummary}</p>
                    <p className="text-xs rb-text-muted">
                      Delivering to {order.address} ({order.zoneName})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 rb-border shrink-0">
                    <span className="font-mono text-lg tabular-nums font-semibold rb-accent mr-2">
                      ${order.total.toFixed(2)}
                    </span>

                    <button
                      type="button"
                      onClick={() => onInspectReceipt(order)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-md border rb-border text-xs font-semibold rb-text hover:border-[#D4AF37] whitespace-nowrap"
                    >
                      <Printer className="w-3.5 h-3.5 rb-accent" />
                      <span>Track & Receipt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onReorder(order.reorderDishIds)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs font-semibold hover:bg-[#E5C76B] whitespace-nowrap"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reorder</span>
                    </button>

                    {order.status === OrderStatus.PENDING && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatusInDb(order.id, OrderStatus.CANCELLED)}
                        className="px-3 py-2 min-h-[40px] rounded-md border rb-border text-xs text-red-400 hover:border-red-400 whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: WISHLIST */}
        {activeTab === 'wishlist' && (
          <div>
            {wishlistedDishes.length === 0 ? (
              <div className="p-12 text-center rounded-lg rb-surface border rb-border space-y-3">
                <Heart className="w-8 h-8 rb-accent mx-auto" />
                <h2 className="font-serif text-2xl font-semibold rb-text">
                  No favourite dishes saved yet
                </h2>
                <p className="text-sm rb-text-muted">
                  Tap the heart icon on any dish card to curate your personal tasting list.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistedDishes.map((dish) => (
                  <div
                    key={dish.id}
                    className="rounded-lg rb-surface border rb-border overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden relative">
                      <SafeImage
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <p className="text-xs rb-text-subtle">{dish.category}</p>
                        <div className="flex justify-between items-baseline gap-2 mt-1">
                          <h3 className="text-base font-semibold rb-text">{dish.name}</h3>
                          <span className="font-mono text-sm tabular-nums rb-accent">
                            ${dish.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenCustomize(dish)}
                          className="flex-1 py-2.5 px-4 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs font-semibold hover:bg-[#E5C76B]"
                        >
                          Customize & Order
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleWishlist(dish.id)}
                          aria-label="Remove from wishlist"
                          className="p-2.5 rounded-md border rb-border text-red-400 hover:border-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAVED DELIVERY ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-semibold rb-text">
                Saved Delivery Addresses
              </h2>
              <button
                type="button"
                onClick={openNewAddressForm}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs font-semibold hover:bg-[#E5C76B]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Address</span>
              </button>
            </div>

            {showAddrForm && (
              <form
                onSubmit={handleSaveAddress}
                className="p-6 rounded-lg rb-surface border rb-border space-y-4 max-w-2xl"
              >
                <h3 className="font-serif text-xl font-semibold rb-text">
                  {editingAddrId ? 'Edit Saved Address' : 'New Delivery Address'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold rb-text mb-1">
                      Address Label *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={40}
                      value={addrLabel}
                      onChange={(e) => setAddrLabel(e.target.value)}
                      placeholder="e.g. Mayfair Residence, Office"
                      className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm rb-text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold rb-text mb-1">
                      Delivery Zone *
                    </label>
                    <select
                      value={addrZoneId}
                      onChange={(e) => setAddrZoneId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm rb-text"
                    >
                      {deliveryZones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} (${z.fee.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold rb-text mb-1">
                      Recipient Name *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={80}
                      value={addrRecipient}
                      onChange={(e) => setAddrRecipient(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm rb-text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold rb-text mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      minLength={6}
                      maxLength={30}
                      value={addrPhone}
                      onChange={(e) => setAddrPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm rb-text"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold rb-text mb-1">
                      Street Address & Postcode *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={5}
                      maxLength={200}
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm rb-text"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold rb-text mb-1">
                      Delivery Notes (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={200}
                      value={addrNotes}
                      onChange={(e) => setAddrNotes(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-sm rb-text"
                    />
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-xs rb-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addrDefault}
                    onChange={(e) => setAddrDefault(e.target.checked)}
                    className="accent-[#D4AF37]"
                  />
                  <span>Set as primary delivery address</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingAddr}
                    className="px-5 py-2.5 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs font-semibold"
                  >
                    {savingAddr ? 'Saving...' : 'Save Address'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddrForm(false)}
                    className="px-4 py-2.5 rounded-md border rb-border text-xs rb-text"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {savedAddresses.length === 0 ? (
              <div className="p-10 text-center rounded-lg rb-surface border rb-border text-sm rb-text-muted">
                No saved addresses yet. Add your residence or office for instant checkout.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-5 rounded-lg rb-surface border rb-border flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs rb-accent font-semibold">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{addr.label}</span>
                        {addr.isDefault && <span>· Default</span>}
                      </div>
                      <p className="text-sm font-semibold rb-text">{addr.recipientName}</p>
                      <p className="text-xs rb-text-muted">{addr.street}</p>
                      <p className="font-mono text-xs rb-text-subtle">{addr.phone}</p>
                    </div>
                    <div className="flex items-center gap-3 pt-2 border-t rb-border text-xs">
                      <button
                        type="button"
                        onClick={() => openEditAddressForm(addr)}
                        className="rb-accent font-semibold hover:underline"
                      >
                        Edit
                      </button>
                      <span aria-hidden="true" className="rb-text-subtle">·</span>
                      <button
                        type="button"
                        onClick={() => deleteCustomerAddress(currentUser.uid, addr.id)}
                        className="text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RECENTLY VIEWED */}
        {activeTab === 'recent' && (
          <div>
            {recentlyViewedDishes.length === 0 ? (
              <div className="p-12 text-center rounded-lg rb-surface border rb-border space-y-3">
                <Clock className="w-8 h-8 rb-accent mx-auto" />
                <h2 className="font-serif text-2xl font-semibold rb-text">
                  No recently inspected dishes yet
                </h2>
                <p className="text-sm rb-text-muted">
                  Open any dish customization card on the Menu to build your browsing trail.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {recentlyViewedDishes.map((dish) => (
                  <div
                    key={dish.id}
                    className="rounded-lg rb-surface border rb-border overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden">
                      <SafeImage
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <p className="text-xs rb-text-subtle">{dish.category}</p>
                        <h3 className="text-sm font-semibold rb-text mt-0.5">{dish.name}</h3>
                        <p className="font-mono text-xs rb-accent mt-1">
                          ${dish.price.toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenCustomize(dish)}
                        className="w-full py-2 px-3 rounded-md border rb-border text-xs font-semibold rb-text hover:border-[#D4AF37]"
                      >
                        View & Customize
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROFILE & RESERVATIONS */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form
              onSubmit={handleSaveProfile}
              className="lg:col-span-5 p-6 rounded-lg rb-surface border rb-border space-y-4 h-fit"
            >
              <h2 className="font-serif text-2xl font-semibold rb-text">
                Personal & Dietary Profile
              </h2>
              <div>
                <label className="block text-xs font-semibold rb-text mb-1.5">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md rb-bg border rb-border text-sm rb-text"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold rb-text mb-1.5">
                  Primary Contact Phone
                </label>
                <input
                  type="tel"
                  maxLength={30}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 7700 900321"
                  className="w-full px-3.5 py-2.5 rounded-md rb-bg border rb-border text-sm rb-text"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold rb-text mb-1.5">
                  Standing Dietary Preferences
                </label>
                <textarea
                  rows={3}
                  maxLength={200}
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  placeholder="e.g. No shellfish, prefer medium-rare Wagyu, sparkling water on arrival"
                  className="w-full px-3.5 py-2.5 rounded-md rb-bg border rb-border text-sm rb-text"
                />
              </div>
              {profileMessage && <p className="text-xs rb-accent">{profileMessage}</p>}
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 px-5 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs font-semibold hover:bg-[#E5C76B]"
              >
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>

            <div className="lg:col-span-7 space-y-4">
              <h2 className="font-serif text-2xl font-semibold rb-text">
                Your Table Reservations ({reservations.length})
              </h2>
              {reservations.length === 0 ? (
                <div className="p-8 rounded-lg rb-surface border rb-border text-sm rb-text-muted">
                  You have no upcoming or past reservations logged yet.
                </div>
              ) : (
                reservations.map((res) => (
                  <div
                    key={res.id}
                    className="p-5 rounded-lg rb-surface border rb-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs rb-text-subtle">
                        <span className="font-mono font-semibold rb-accent">
                          {res.reservationCode}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{res.seating}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold rb-text">{res.status}</span>
                      </div>
                      <p className="font-mono text-sm rb-text">
                        {res.date} at {res.time} · {res.guests} Guests
                      </p>
                      {res.specialRequests && (
                        <p className="text-xs rb-text-muted">Notes: {res.specialRequests}</p>
                      )}
                    </div>

                    {res.status === ReservationStatus.PENDING && (
                      <button
                        type="button"
                        onClick={() =>
                          updateReservationStatusInDb(res.id, ReservationStatus.CANCELLED)
                        }
                        className="px-3.5 py-2 rounded-md border rb-border text-xs text-red-400 hover:border-red-400 self-start sm:self-auto"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

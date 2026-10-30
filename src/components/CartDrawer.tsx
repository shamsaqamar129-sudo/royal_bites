import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  LogIn,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { placeCustomerOrder, saveCustomerAddress } from '../lib/firestoreService';
import {
  CartItem,
  Coupon,
  DeliveryZone,
  OrderRecord,
  RestaurantSettings,
  SavedAddress,
  UserProfileState,
} from '../types';
import { SafeImage } from './SafeImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (cartLineId: string, delta: number) => void;
  onRemoveItem: (cartLineId: string) => void;
  onClearCart: () => void;
  onBrowseMenu: () => void;
  coupons: Coupon[];
  deliveryZones: DeliveryZone[];
  settings: RestaurantSettings;
  currentUser: User | null;
  userProfile: UserProfileState | null;
  savedAddresses: SavedAddress[];
  onSignInRequest: () => Promise<void>;
  onOrderPlaced: (order: OrderRecord) => void;
  externalCouponCode?: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onBrowseMenu,
  coupons,
  deliveryZones,
  settings,
  currentUser,
  userProfile,
  savedAddresses,
  onSignInRequest,
  onOrderPlaced,
  externalCouponCode,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponFeedback, setCouponFeedback] = useState('');

  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    deliveryZones[0]?.id || 'zone-mayfair'
  );
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync zone default
  useEffect(() => {
    if (deliveryZones.length > 0 && !deliveryZones.some((z) => z.id === selectedZoneId)) {
      setSelectedZoneId(deliveryZones[0].id);
    }
  }, [deliveryZones, selectedZoneId]);

  // Pre-populate from user profile / default saved address
  useEffect(() => {
    if (userProfile) {
      setCustomerName((prev) => prev || userProfile.displayName || '');
      setPhone((prev) => prev || userProfile.phone || '');
    }
    const defAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
    if (defAddr) {
      setCustomerName((prev) => prev || defAddr.recipientName);
      setPhone((prev) => prev || defAddr.phone);
      setAddress((prev) => prev || defAddr.street);
      setSelectedZoneId(defAddr.zoneId);
      setNotes((prev) => prev || defAddr.notes);
    }
  }, [userProfile, savedAddresses]);

  // Apply banner promo code if clicked
  useEffect(() => {
    if (externalCouponCode) {
      setCouponInput(externalCouponCode);
    }
  }, [externalCouponCode]);

  const subtotal = useMemo(
    () => cart.reduce((acc, entry) => acc + entry.unitPrice * entry.quantity, 0),
    [cart]
  );

  const activeZone = useMemo(
    () => deliveryZones.find((z) => z.id === selectedZoneId) || deliveryZones[0],
    [deliveryZones, selectedZoneId]
  );

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (subtotal < appliedCoupon.minOrderAmount) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      return Number(((subtotal * appliedCoupon.discountValue) / 100).toFixed(2));
    }
    return Math.min(subtotal, appliedCoupon.discountValue);
  }, [appliedCoupon, subtotal]);

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  const deliveryFee = useMemo(() => {
    if (cart.length === 0) return 0;
    if (subtotal >= settings.freeDeliveryThreshold) return 0;
    return activeZone ? activeZone.fee : 6;
  }, [activeZone, cart.length, settings.freeDeliveryThreshold, subtotal]);

  const taxAmount = useMemo(
    () => Number(((discountedSubtotal * settings.taxRatePercent) / 100).toFixed(2)),
    [discountedSubtotal, settings.taxRatePercent]
  );

  const total = Number((discountedSubtotal + taxAmount + deliveryFee).toFixed(2));

  const handleApplyCoupon = (codeToTry?: string) => {
    const clean = (codeToTry ?? couponInput).trim().toUpperCase();
    if (!clean) return;
    const match = coupons.find((c) => c.code.toUpperCase() === clean && c.active);
    if (!match) {
      setAppliedCoupon(null);
      setCouponFeedback(`Code "${clean}" is invalid or inactive.`);
      return;
    }
    if (subtotal < match.minOrderAmount) {
      setAppliedCoupon(null);
      setCouponFeedback(
        `Code ${match.code} requires a minimum subtotal of $${match.minOrderAmount.toFixed(2)}.`
      );
      return;
    }
    setAppliedCoupon(match);
    setCouponInput(match.code);
    setCouponFeedback(`Applied ${match.code}: ${match.description}`);
  };

  const whatsappUrl = useMemo(() => {
    const lines = [
      `*ROYAL BITES — CONCIERGE ORDER*`,
      `Customer: ${customerName.trim() || 'Guest'}`,
      `Phone: ${phone.trim() || 'N/A'}`,
      `Zone: ${activeZone?.name || 'Central'}`,
      `Address: ${address.trim() || 'N/A'}`,
      notes.trim() ? `Notes: ${notes.trim()}` : '',
      ``,
      `*Items:*`,
      ...cart.map((c) => {
        const ext = c.customization.selectedExtras.map((e) => e.label).join(', ');
        return `• ${c.quantity}x ${c.item.name} [${c.customization.sizeLabel}${ext ? `, +${ext}` : ''}] — $${(c.unitPrice * c.quantity).toFixed(2)}`;
      }),
      ``,
      `Subtotal: $${subtotal.toFixed(2)}`,
      discountAmount > 0 ? `Promo (${appliedCoupon?.code}): -$${discountAmount.toFixed(2)}` : '',
      `Tax (${settings.taxRatePercent}%): $${taxAmount.toFixed(2)}`,
      `Delivery: ${deliveryFee === 0 ? 'Complimentary' : `$${deliveryFee.toFixed(2)}`}`,
      `*Total Due on Delivery: $${total.toFixed(2)}*`,
    ]
      .filter(Boolean)
      .join('\n');

    return `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(lines)}`;
  }, [
    activeZone,
    address,
    appliedCoupon,
    cart,
    customerName,
    deliveryFee,
    discountAmount,
    notes,
    phone,
    settings.taxRatePercent,
    settings.whatsappNumber,
    subtotal,
    taxAmount,
    total,
  ]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    if (!settings.acceptingOrders) {
      setFormError('Online ordering is temporarily paused by restaurant management.');
      return false;
    }
    if (activeZone && subtotal < activeZone.minOrder) {
      setFormError(
        `${activeZone.name} requires a minimum subtotal of $${activeZone.minOrder.toFixed(2)}.`
      );
      return false;
    }
    if (customerName.trim().length < 2) {
      setFormError('Please enter the recipient full name.');
      return false;
    }
    if (phone.trim().length < 6) {
      setFormError('Please enter a valid contact phone number.');
      return false;
    }
    if (address.trim().length < 5) {
      setFormError('Please enter your complete street delivery address.');
      return false;
    }
    setFormError('');
    return true;
  };

  const submitCloudOrder = async (channel: 'Pay on Delivery' | 'WhatsApp Concierge') => {
    if (!validateForm()) return false;
    if (!currentUser) {
      setFormError('Please sign in with Google below to save and track your order in real time.');
      return false;
    }

    setSubmitting(true);
    try {
      if (saveNewAddress) {
        await saveCustomerAddress(currentUser.uid, {
          label: 'Saved Checkout Address',
          recipientName: customerName.trim(),
          phone: phone.trim(),
          street: address.trim(),
          zoneId: activeZone?.id || 'zone-mayfair',
          notes: notes.trim(),
          isDefault: savedAddresses.length === 0,
        });
      }

      const created = await placeCustomerOrder(currentUser, {
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        zoneName: activeZone?.name || 'Central Zone',
        notes: notes.trim(),
        cart,
        subtotal,
        discountAmount,
        couponCode: appliedCoupon && discountAmount > 0 ? appliedCoupon.code : '',
        taxAmount,
        deliveryFee,
        total,
        channel,
      });

      onClearCart();
      setAppliedCoupon(null);
      setStep('cart');
      onClose();
      onOrderPlaced(created);
      return true;
    } catch {
      setFormError('Could not submit order. Please verify your details and try again.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectSavedAddress = (saved: SavedAddress) => {
    setCustomerName(saved.recipientName);
    setPhone(saved.phone);
    setAddress(saved.street);
    setSelectedZoneId(saved.zoneId);
    setNotes(saved.notes);
    setFormError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs no-print"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag and Checkout"
    >
      <div className="flex-1" onClick={onClose} />

      <div className="relative w-full max-w-lg rb-surface border-l rb-border h-full flex flex-col rb-text shadow-2xl">
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b rb-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => {
                  setFormError('');
                  setStep('cart');
                }}
                aria-label="Back to bag"
                className="p-1.5 rounded-md border rb-border rb-text hover:border-[#D4AF37] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="font-serif text-2xl font-semibold tracking-wide">
              {step === 'cart' ? 'Your Order Bag' : 'Delivery & Settlement'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag"
            className="w-10 h-10 inline-flex items-center justify-center rounded-md border rb-border rb-text hover:border-[#D4AF37] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: BAG ITEMS & COUPONS */}
        {step === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {cart.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center px-4">
                  <ShoppingBag className="w-10 h-10 rb-accent mb-4 stroke-[1.4]" />
                  <h3 className="font-serif text-2xl font-semibold mb-2">
                    Your order bag is empty
                  </h3>
                  <p className="text-sm rb-text-muted max-w-xs mb-6">
                    Customize our A5 Wagyu burgers, 48-hour sourdough pizzas, oak-smoked ribs, and
                    24K desserts.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onBrowseMenu();
                    }}
                    className="px-5 py-2.5 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-sm font-semibold hover:bg-[#E5C76B] transition-colors whitespace-nowrap"
                  >
                    Explore Culinary Menu
                  </button>
                </div>
              ) : (
                <>
                  {/* Free Delivery Threshold */}
                  <div className="p-3.5 rounded-md border rb-border rb-bg-alt text-xs rb-text-muted flex items-center justify-between gap-3">
                    {subtotal >= settings.freeDeliveryThreshold ? (
                      <span>Complimentary chauffeur delivery unlocked on this order.</span>
                    ) : (
                      <span>
                        Add{' '}
                        <strong className="font-mono tabular-nums rb-accent">
                          ${(settings.freeDeliveryThreshold - subtotal).toFixed(2)}
                        </strong>{' '}
                        more for complimentary delivery.
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={onClearCart}
                      className="rb-text-subtle hover:text-red-500 transition-colors whitespace-nowrap shrink-0"
                    >
                      Clear Bag
                    </button>
                  </div>

                  {/* Itemized Customizations */}
                  <div className="divide-y rb-border">
                    {cart.map((line) => (
                      <div key={line.cartLineId} className="py-4 first:pt-1 flex gap-4">
                        <div className="w-20 h-20 rounded-md overflow-hidden shrink-0 bg-[#18181D]">
                          <SafeImage
                            src={line.item.image}
                            alt={line.item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-semibold rb-text leading-snug">
                                {line.item.name}
                              </h4>
                              <p className="text-xs rb-text-muted mt-0.5">
                                {line.customization.sizeLabel}
                                {line.customization.selectedExtras.length > 0 &&
                                  ` · +${line.customization.selectedExtras
                                    .map((e) => e.label)
                                    .join(', ')}`}
                              </p>
                              {line.customization.specialInstructions && (
                                <p className="text-[11px] rb-accent mt-0.5">
                                  “{line.customization.specialInstructions}”
                                </p>
                              )}
                            </div>
                            <span className="font-mono text-sm tabular-nums rb-accent font-medium shrink-0">
                              ${(line.unitPrice * line.quantity).toFixed(2)}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="inline-flex items-center rounded-md border rb-border rb-bg">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(line.cartLineId, -1)}
                                aria-label="Decrease quantity"
                                className="w-8 h-8 inline-flex items-center justify-center rb-text hover:text-[#D4AF37]"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center font-mono text-xs tabular-nums rb-text">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(line.cartLineId, 1)}
                                aria-label="Increase quantity"
                                className="w-8 h-8 inline-flex items-center justify-center rb-text hover:text-[#D4AF37]"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => onRemoveItem(line.cartLineId)}
                              className="inline-flex items-center gap-1 text-xs rb-text-subtle hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coupon & Promotional Code Box */}
                  <div className="pt-4 border-t rb-border space-y-2.5">
                    <label
                      htmlFor="cart-coupon-input"
                      className="flex items-center gap-1.5 text-xs font-semibold rb-text"
                    >
                      <Tag className="w-3.5 h-3.5 rb-accent" />
                      <span>Privilege Coupon Code</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="cart-coupon-input"
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="e.g. ROYAL15"
                        className="flex-1 px-3.5 py-2 rounded-md rb-bg border rb-border text-xs font-mono uppercase rb-text focus:outline-none focus:border-[#D4AF37]"
                      />
                      {appliedCoupon ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCoupon(null);
                            setCouponInput('');
                            setCouponFeedback('');
                          }}
                          className="px-4 py-2 rounded-md border rb-border text-xs font-semibold rb-text hover:border-red-400"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          className="px-4 py-2 rounded-md border border-[#D4AF37] text-xs font-semibold rb-accent hover:bg-[#D4AF37] hover:text-[#0A0A0C] transition-colors whitespace-nowrap"
                        >
                          Apply
                        </button>
                      )}
                    </div>

                    {couponFeedback && (
                      <p className="text-xs rb-accent">{couponFeedback}</p>
                    )}

                    {/* Available Offers Quick Select */}
                    {coupons.length > 0 && !appliedCoupon && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] rb-text-subtle">
                        <span>Active offers:</span>
                        {coupons.slice(0, 3).map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => handleApplyCoupon(c.code)}
                            className="font-mono underline hover:text-[#D4AF37]"
                          >
                            {c.code} (${c.minOrderAmount}+)
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t rb-border rb-bg-alt space-y-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between rb-text-muted">
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums">${subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-500">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span className="font-mono tabular-nums">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between rb-text-muted">
                    <span>Tax ({settings.taxRatePercent}%)</span>
                    <span className="font-mono tabular-nums">${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between rb-text-muted">
                    <span>Delivery ({activeZone?.estimatedTime || '30 min'})</span>
                    <span className="font-mono tabular-nums">
                      {deliveryFee === 0 ? 'Complimentary' : `$${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="pt-2 border-t rb-border flex justify-between text-base font-semibold rb-text">
                    <span>Total Estimate</span>
                    <span className="font-mono tabular-nums rb-accent">${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full py-3 px-5 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-sm font-semibold hover:bg-[#E5C76B] transition-colors whitespace-nowrap"
                >
                  Continue to Delivery Details
                </button>
              </div>
            )}
          </>
        )}

        {/* STEP 2: DELIVERY ZONE, SAVED ADDRESSES & ORDER PLACEMENT */}
        {step === 'checkout' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Auth Gate / Saved Addresses Banner */}
              {!currentUser ? (
                <div className="p-4 rounded-md border border-[#D4AF37]/40 rb-bg-alt space-y-3">
                  <p className="text-xs rb-text leading-relaxed">
                    <strong className="rb-accent">Sign in for Live Cloud Order Tracking:</strong>{' '}
                    Authenticate with Google to save your order history, print official receipts,
                    and use saved addresses—or dispatch directly via WhatsApp below.
                  </p>
                  <button
                    type="button"
                    onClick={() => onSignInRequest()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs font-semibold hover:bg-[#E5C76B] transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In with Google</span>
                  </button>
                </div>
              ) : (
                savedAddresses.length > 0 && (
                  <div className="space-y-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold rb-text">
                      <MapPin className="w-3.5 h-3.5 rb-accent" />
                      <span>Select Saved Delivery Address</span>
                    </span>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {savedAddresses.map((sa) => (
                        <button
                          key={sa.id}
                          type="button"
                          onClick={() => handleSelectSavedAddress(sa)}
                          className="px-3 py-2 rounded-md border rb-border rb-bg-alt text-left text-xs hover:border-[#D4AF37] shrink-0 max-w-[200px]"
                        >
                          <p className="font-semibold rb-text truncate">{sa.label}</p>
                          <p className="rb-text-muted truncate">{sa.street}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}

              {formError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-md border border-red-500/40 bg-red-500/10 text-xs text-red-400"
                >
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="checkout-zone"
                    className="block text-xs font-semibold rb-text mb-1.5"
                  >
                    Delivery Zone *
                  </label>
                  <select
                    id="checkout-zone"
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md rb-bg border rb-border text-sm rb-text focus:outline-none focus:border-[#D4AF37]"
                  >
                    {deliveryZones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} — ${zone.fee.toFixed(2)} ({zone.estimatedTime}, Min $
                        {zone.minOrder})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="checkout-name"
                      className="block text-xs font-semibold rb-text mb-1.5"
                    >
                      Recipient Name *
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      required
                      maxLength={80}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-3.5 py-2.5 rounded-md rb-bg border rb-border text-sm rb-text focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-phone"
                      className="block text-xs font-semibold rb-text mb-1.5"
                    >
                      Phone Number *
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      required
                      maxLength={30}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+44 7700 900321"
                      className="w-full px-3.5 py-2.5 rounded-md rb-bg border rb-border text-sm rb-text focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="checkout-address"
                    className="block text-xs font-semibold rb-text mb-1.5"
                  >
                    Full Street Address & Postcode *
                  </label>
                  <textarea
                    id="checkout-address"
                    rows={2}
                    required
                    maxLength={200}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Building, street, apartment/suite, postcode"
                    className="w-full px-3.5 py-2.5 rounded-md rb-bg border rb-border text-sm rb-text focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-notes"
                    className="block text-xs font-semibold rb-text mb-1.5"
                  >
                    Concierge / Delivery Instructions (Optional)
                  </label>
                  <input
                    id="checkout-notes"
                    type="text"
                    maxLength={200}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Gate code, concierge desk, cutlery preferences"
                    className="w-full px-3.5 py-2.5 rounded-md rb-bg border rb-border text-sm rb-text focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {currentUser && (
                  <label className="inline-flex items-center gap-2 text-xs rb-text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveNewAddress}
                      onChange={(e) => setSaveNewAddress(e.target.checked)}
                      className="accent-[#D4AF37] w-4 h-4"
                    />
                    <span>Save this address to my account for future orders</span>
                  </label>
                )}
              </div>

              <div className="p-3.5 rounded-md border rb-border rb-bg-alt text-xs rb-text-muted leading-relaxed">
                <strong className="rb-text font-semibold">Payment Terms:</strong> Pay on Delivery
                (cash or courier terminal upon arrival). No online payment gateway is connected.
              </div>
            </div>

            <div className="p-6 border-t rb-border rb-bg-alt space-y-2.5">
              <div className="flex justify-between text-sm font-semibold pb-1">
                <span>Total Due on Delivery</span>
                <span className="font-mono tabular-nums rb-accent">${total.toFixed(2)}</span>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={() => submitCloudOrder('Pay on Delivery')}
                className="w-full py-3 px-5 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-sm font-semibold hover:bg-[#E5C76B] disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {submitting ? 'Placing Cloud Order...' : 'Place Pay-on-Delivery Order'}
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!validateForm()) {
                    e.preventDefault();
                    return;
                  }
                  if (currentUser) {
                    submitCloudOrder('WhatsApp Concierge');
                  }
                }}
                className="w-full py-2.5 px-5 rounded-md border rb-border rb-text text-xs font-semibold hover:border-[#D4AF37] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>Order via WhatsApp Concierge</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { Heart, Minus, Plus, X } from 'lucide-react';
import { CATEGORY_CUSTOMIZATIONS } from '../data/initialData';
import { CartCustomization, DishExtraOption, MenuItem } from '../types';
import { SafeImage } from './SafeImage';

interface DishCustomizeModalProps {
  dish: MenuItem | null;
  onClose: () => void;
  onAddCustomizedToCart: (
    dish: MenuItem,
    quantity: number,
    customization: CartCustomization,
    unitPrice: number
  ) => void;
  isWishlisted: boolean;
  onToggleWishlist: (dishId: string) => void;
}

export const DishCustomizeModal: React.FC<DishCustomizeModalProps> = ({
  dish,
  onClose,
  onAddCustomizedToCart,
  isWishlisted,
  onToggleWishlist,
}) => {
  const options = useMemo(() => {
    if (!dish) return null;
    return CATEGORY_CUSTOMIZATIONS[dish.category];
  }, [dish]);

  const [selectedSizeId, setSelectedSizeId] = useState<string>('');
  const [selectedExtras, setSelectedExtras] = useState<DishExtraOption[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (dish && options) {
      setSelectedSizeId(options.sizes[0]?.id || 'standard');
      setSelectedExtras([]);
      setSpecialInstructions('');
      setQuantity(1);
    }
  }, [dish, options]);

  if (!dish || !options) return null;

  const baseEffectivePrice =
    dish.promoPrice > 0 && dish.promoPrice < dish.price ? dish.promoPrice : dish.price;

  const activeSize =
    options.sizes.find((s) => s.id === selectedSizeId) || options.sizes[0];

  const extrasSum = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const unitPrice = baseEffectivePrice + (activeSize?.priceDelta || 0) + extrasSum;
  const totalLinePrice = unitPrice * quantity;

  const toggleExtra = (extra: DishExtraOption) => {
    setSelectedExtras((prev) => {
      const exists = prev.some((e) => e.id === extra.id);
      if (exists) return prev.filter((e) => e.id !== extra.id);
      return [...prev, extra];
    });
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCustomizedToCart(
      dish,
      quantity,
      {
        sizeId: activeSize.id,
        sizeLabel: activeSize.label,
        sizePriceDelta: activeSize.priceDelta,
        selectedExtras,
        specialInstructions: specialInstructions.trim() || undefined,
      },
      unitPrice
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Customize ${dish.name}`}
    >
      <div className="fixed inset-0" onClick={onClose} />

      <form
        onSubmit={handleConfirm}
        className="relative z-10 w-full max-w-3xl rb-surface border rb-border rounded-lg overflow-hidden shadow-2xl my-8 grid grid-cols-1 md:grid-cols-12"
      >
        {/* Left Sticky Image Column */}
        <div className="md:col-span-5 relative bg-[#141418] flex flex-col justify-between">
          <div className="aspect-[4/3] md:aspect-auto md:h-full w-full overflow-hidden">
            <SafeImage
              src={dish.image}
              alt={dish.name}
              className="w-full h-full object-cover"
            />
          </div>

          <button
            type="button"
            onClick={() => onToggleWishlist(dish.id)}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            className="absolute top-4 left-4 w-10 h-10 inline-flex items-center justify-center rounded-md bg-black/70 border border-white/20 text-white hover:border-[#D4AF37] transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${
                isWishlisted ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-white'
              }`}
            />
          </button>
        </div>

        {/* Right Contiguous Customization Module */}
        <div className="md:col-span-7 p-6 sm:p-7 flex flex-col justify-between max-h-[82vh] overflow-y-auto space-y-6">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs rb-text-subtle">
                  <span>{dish.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>Prep {dish.prepTime}</span>
                  {dish.dietaryNote && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="rb-accent">{dish.dietaryNote}</span>
                    </>
                  )}
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold rb-text leading-tight">
                  {dish.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close customization modal"
                className="w-9 h-9 inline-flex items-center justify-center rounded-md border rb-border rb-text hover:border-[#D4AF37] shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xl tabular-nums font-semibold rb-accent">
                ${baseEffectivePrice.toFixed(2)}
              </span>
              {dish.promoPrice > 0 && dish.promoPrice < dish.price && (
                <span className="font-mono text-sm tabular-nums line-through rb-text-subtle">
                  ${dish.price.toFixed(2)}
                </span>
              )}
              {dish.specialOfferLabel && (
                <span className="text-xs rb-accent font-medium">
                  · {dish.specialOfferLabel}
                </span>
              )}
            </div>

            <p className="text-sm rb-text-muted leading-relaxed">{dish.description}</p>

            {/* 1. Portion / Size Selection */}
            <div className="pt-2 border-t rb-border space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold rb-text">Select Portion / Cut</span>
                <span className="rb-text-subtle">Required</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {options.sizes.map((size) => {
                  const selected = size.id === activeSize.id;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSelectedSizeId(size.id)}
                      className={`px-3.5 py-2.5 rounded-md border text-left flex items-center justify-between text-xs sm:text-sm transition-colors ${
                        selected
                          ? 'border-[#D4AF37] rb-bg-alt rb-text font-semibold'
                          : 'rb-border rb-text-muted hover:rb-text'
                      }`}
                    >
                      <span>{size.label}</span>
                      <span className="font-mono tabular-nums rb-accent">
                        {size.priceDelta === 0 ? 'Included' : `+$${size.priceDelta.toFixed(2)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Artisanal Toppings & Extras */}
            <div className="pt-2 border-t rb-border space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold rb-text">Artisanal Enhancements & Toppings</span>
                <span className="rb-text-subtle">Optional</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {options.extras.map((extra) => {
                  const checked = selectedExtras.some((e) => e.id === extra.id);
                  return (
                    <label
                      key={extra.id}
                      className={`px-3.5 py-2.5 rounded-md border flex items-center justify-between text-xs sm:text-sm cursor-pointer transition-colors ${
                        checked
                          ? 'border-[#D4AF37] rb-bg-alt rb-text font-semibold'
                          : 'rb-border rb-text-muted hover:rb-text'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleExtra(extra)}
                          className="accent-[#D4AF37] w-4 h-4"
                        />
                        <span>{extra.label}</span>
                      </span>
                      <span className="font-mono tabular-nums rb-accent">
                        +${extra.price.toFixed(2)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 3. Kitchen Preparation Notes */}
            <div className="pt-2 border-t rb-border space-y-2">
              <label
                htmlFor="dish-special-notes"
                className="block text-xs font-semibold rb-text"
              >
                Chef Preparation Notes (Optional)
              </label>
              <input
                id="dish-special-notes"
                type="text"
                maxLength={120}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Medium-rare sear, sauce on side, no shallots..."
                className="w-full px-3.5 py-2 rounded-md rb-bg border rb-border text-xs sm:text-sm rb-text placeholder:opacity-45 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Contiguous Add to Bag Footer */}
          <div className="pt-4 border-t rb-border flex items-center gap-3">
            <div className="inline-flex items-center rounded-md border rb-border rb-bg">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="w-10 h-11 inline-flex items-center justify-center rb-text hover:text-[#D4AF37]"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-9 text-center font-mono text-sm tabular-nums font-semibold rb-text">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                aria-label="Increase quantity"
                className="w-10 h-11 inline-flex items-center justify-center rb-text hover:text-[#D4AF37]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {!dish.available ? (
              <button
                type="button"
                disabled
                className="flex-1 py-3 px-4 min-h-[44px] rounded-md bg-neutral-500/20 text-xs font-semibold rb-text-subtle cursor-not-allowed"
              >
                Sold Out Tonight
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 py-3 px-5 min-h-[44px] rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs sm:text-sm font-semibold hover:bg-[#E5C76B] transition-colors whitespace-nowrap"
              >
                Add to Bag ·{' '}
                <span className="font-mono tabular-nums">${totalLinePrice.toFixed(2)}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { Heart, Search, SlidersHorizontal, X } from 'lucide-react';
import { MenuCategory, MenuItem } from '../types';
import { SafeImage } from './SafeImage';

interface MenuViewProps {
  menuItems: MenuItem[];
  wishlistIds: string[];
  recentlyViewedIds: string[];
  onToggleWishlist: (dishId: string) => void;
  onOpenCustomize: (dish: MenuItem) => void;
  onQuickAdd: (dish: MenuItem) => void;
}

const ALL_CATEGORIES: ('All' | MenuCategory)[] = [
  'All',
  MenuCategory.BURGERS,
  MenuCategory.PIZZA,
  MenuCategory.BBQ,
  MenuCategory.FAST_FOOD,
  MenuCategory.DRINKS,
  MenuCategory.DESSERTS,
];

export const MenuView: React.FC<MenuViewProps> = ({
  menuItems,
  wishlistIds,
  recentlyViewedIds,
  onToggleWishlist,
  onOpenCustomize,
  onQuickAdd,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | MenuCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlySpecialOffers, setOnlySpecialOffers] = useState(false);
  const [onlyWishlist, setOnlyWishlist] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(60);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = menuItems.filter((item) => {
      const effectivePrice =
        item.promoPrice > 0 && item.promoPrice < item.price ? item.promoPrice : item.price;

      const categoryMatch =
        selectedCategory === 'All' || item.category === selectedCategory;
      const searchMatch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.dietaryNote.toLowerCase().includes(q);
      const availMatch = !onlyAvailable || item.available;
      const promoMatch =
        !onlySpecialOffers || (item.promoPrice > 0 && item.promoPrice < item.price);
      const wishMatch = !onlyWishlist || wishlistIds.includes(item.id);
      const priceMatch = effectivePrice <= maxPrice;

      return (
        categoryMatch &&
        searchMatch &&
        availMatch &&
        promoMatch &&
        wishMatch &&
        priceMatch
      );
    });

    return [...matched].sort((a, b) => {
      const priceA = a.promoPrice > 0 && a.promoPrice < a.price ? a.promoPrice : a.price;
      const priceB = b.promoPrice > 0 && b.promoPrice < b.price ? b.promoPrice : b.price;
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      return Number(b.featured) - Number(a.featured);
    });
  }, [
    maxPrice,
    menuItems,
    onlyAvailable,
    onlySpecialOffers,
    onlyWishlist,
    searchQuery,
    selectedCategory,
    sortBy,
    wishlistIds,
  ]);

  const recentlyViewedDishes = useMemo(
    () =>
      recentlyViewedIds
        .map((id) => menuItems.find((m) => m.id === id))
        .filter((m): m is MenuItem => Boolean(m))
        .slice(0, 4),
    [menuItems, recentlyViewedIds]
  );

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setOnlyAvailable(false);
    setOnlySpecialOffers(false);
    setOnlyWishlist(false);
    setMaxPrice(60);
  };

  return (
    <div className="rb-bg rb-text min-h-screen py-14 sm:py-18">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Page Heading */}
        <div className="max-w-2xl space-y-3">
          <p className="text-xs rb-accent font-semibold tracking-wide">
            All-Day & Evening A La Carte
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold rb-text">
            The Culinary Menu
          </h1>
          <p className="text-sm sm:text-base rb-text-muted leading-relaxed">
            Select any dish to customize cuts, wood-fired toppings, artisanal extras, and chef
            preparation notes.
          </p>
        </div>

        {/* Advanced Search & Filter Bar */}
        <div className="space-y-4 pb-6 border-b rb-border">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 rb-text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Wagyu, truffle, vegetarian, halal..."
                aria-label="Search menu items"
                className="w-full pl-10 pr-9 py-2.5 min-h-[42px] rounded-md rb-surface border rb-border text-sm rb-text placeholder:opacity-45 focus:outline-none focus:border-[#D4AF37]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rb-text-subtle hover:rb-text"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Advanced Filter Toggles & Sort */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setOnlySpecialOffers((p) => !p)}
                className={`px-3.5 py-2 min-h-[40px] rounded-md text-xs font-semibold border transition-colors whitespace-nowrap ${
                  onlySpecialOffers
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 rb-accent'
                    : 'rb-border rb-surface rb-text-muted hover:rb-text'
                }`}
              >
                Special Offers
              </button>

              <button
                type="button"
                onClick={() => setOnlyWishlist((p) => !p)}
                className={`px-3.5 py-2 min-h-[40px] rounded-md text-xs font-semibold border transition-colors whitespace-nowrap ${
                  onlyWishlist
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 rb-accent'
                    : 'rb-border rb-surface rb-text-muted hover:rb-text'
                }`}
              >
                Saved Wishlist ({wishlistIds.length})
              </button>

              <button
                type="button"
                onClick={() => setOnlyAvailable((p) => !p)}
                className={`px-3.5 py-2 min-h-[40px] rounded-md text-xs font-semibold border transition-colors whitespace-nowrap ${
                  onlyAvailable
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 rb-accent'
                    : 'rb-border rb-surface rb-text-muted hover:rb-text'
                }`}
              >
                In-Stock Only
              </button>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 min-h-[40px] rounded-md border rb-border rb-surface text-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 rb-accent" />
                <span className="rb-text-muted whitespace-nowrap">
                  Max <strong className="font-mono tabular-nums rb-text">${maxPrice}</strong>
                </span>
                <input
                  type="range"
                  min={15}
                  max={60}
                  step={5}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  aria-label="Maximum dish price"
                  className="w-20 accent-[#D4AF37]"
                />
              </div>

              <select
                aria-label="Sort menu items"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')
                }
                className="px-3.5 py-2 min-h-[40px] rounded-md rb-surface border rb-border text-xs sm:text-sm rb-text focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="featured">Chef Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Interactive Category Tabs */}
          <div
            role="tablist"
            aria-label="Menu Categories"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1"
          >
            {ALL_CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              const count =
                category === 'All'
                  ? menuItems.length
                  : menuItems.filter((i) => i.category === category).length;

              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 min-h-[40px] rounded-md text-xs sm:text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#D4AF37] text-[#0A0A0C]'
                      : 'rb-surface rb-text-muted border rb-border hover:rb-text'
                  }`}
                >
                  {category}{' '}
                  <span className="font-mono text-[11px] tabular-nums opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center border rb-border rounded-lg rb-surface px-4 space-y-4">
            <h2 className="font-serif text-2xl font-semibold rb-text">No matching dishes found</h2>
            <p className="text-sm rb-text-muted max-w-md mx-auto">
              Adjust your search terms, price ceiling, or active filters to view available dishes.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-5 py-2.5 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs font-semibold hover:bg-[#E5C76B] transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          /* 3-Column Menu Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredItems.map((dish) => {
              const wishlisted = wishlistIds.includes(dish.id);
              const hasPromo = dish.promoPrice > 0 && dish.promoPrice < dish.price;
              const effectivePrice = hasPromo ? dish.promoPrice : dish.price;

              return (
                <article
                  key={dish.id}
                  className="group rb-surface border rb-border rounded-lg overflow-hidden flex flex-col hover:-translate-y-0.5 transition-all duration-150"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#18181D]">
                    <button
                      type="button"
                      onClick={() => onOpenCustomize(dish)}
                      className="w-full h-full block text-left focus:outline-none"
                    >
                      <SafeImage
                        src={dish.image}
                        alt={dish.name}
                        className={`w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200 ${
                          !dish.available ? 'opacity-40 grayscale' : ''
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleWishlist(dish.id)}
                      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                      className="absolute top-3.5 right-3.5 w-9 h-9 inline-flex items-center justify-center rounded-md bg-black/70 border border-white/20 text-white hover:border-[#D4AF37] transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          wishlisted ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-white'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs rb-text-subtle">
                        <span>{dish.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{dish.prepTime}</span>
                        {(dish.specialOfferLabel || dish.dietaryNote) && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="rb-accent font-medium">
                              {dish.specialOfferLabel || dish.dietaryNote}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => onOpenCustomize(dish)}
                          className="text-left text-base sm:text-lg font-sans font-semibold rb-text hover:text-[#D4AF37] transition-colors leading-snug"
                        >
                          {dish.name}
                        </button>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-base tabular-nums font-semibold rb-accent">
                            ${effectivePrice.toFixed(2)}
                          </span>
                          {hasPromo && (
                            <span className="block font-mono text-xs tabular-nums line-through rb-text-subtle">
                              ${dish.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm rb-text-muted leading-relaxed line-clamp-3">
                        {dish.description}
                      </p>
                    </div>

                    <div className="pt-2">
                      {!dish.available ? (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2.5 px-4 min-h-[42px] rounded-md rb-bg-alt border rb-border text-xs font-semibold rb-text-subtle cursor-not-allowed whitespace-nowrap"
                        >
                          Sold Out Tonight
                        </button>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => onOpenCustomize(dish)}
                            className="flex-1 py-2.5 px-4 min-h-[42px] rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs sm:text-sm font-semibold hover:bg-[#E5C76B] transition-colors whitespace-nowrap"
                          >
                            Customize & Add
                          </button>
                          <button
                            type="button"
                            onClick={() => onQuickAdd(dish)}
                            className="py-2.5 px-3.5 min-h-[42px] rounded-md border rb-border text-xs font-semibold rb-text hover:border-[#D4AF37] transition-colors whitespace-nowrap"
                          >
                            Quick +1
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Recently Viewed Strip */}
        {recentlyViewedDishes.length > 0 && (
          <section className="pt-10 border-t rb-border space-y-5">
            <h2 className="font-serif text-2xl font-semibold rb-text">Recently Viewed Dishes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {recentlyViewedDishes.map((dish) => (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => onOpenCustomize(dish)}
                  className="p-3.5 rounded-lg rb-surface border rb-border flex items-center gap-3.5 text-left hover:border-[#D4AF37] transition-colors"
                >
                  <div className="w-14 h-14 rounded overflow-hidden shrink-0">
                    <SafeImage
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs rb-text-subtle truncate">{dish.category}</p>
                    <p className="text-sm font-semibold rb-text truncate">{dish.name}</p>
                    <p className="font-mono text-xs rb-accent tabular-nums">
                      ${(dish.promoPrice > 0 ? dish.promoPrice : dish.price).toFixed(2)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

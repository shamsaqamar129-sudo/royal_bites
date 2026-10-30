import React, { useState } from 'react';
import { ArrowRight, Heart, Star } from 'lucide-react';
import { User } from 'firebase/auth';
import { BRAND_IMAGES, GUEST_REVIEWS } from '../data/initialData';
import { submitCustomerReview } from '../lib/firestoreService';
import { CustomerReview, MenuItem, PageView } from '../types';
import { SafeImage } from './SafeImage';

interface HomeViewProps {
  menuItems: MenuItem[];
  wishlistIds: string[];
  customerReviews: CustomerReview[];
  currentUser: User | null;
  onToggleWishlist: (dishId: string) => void;
  onOpenCustomize: (dish: MenuItem) => void;
  onQuickAdd: (dish: MenuItem) => void;
  onNavigate: (page: PageView) => void;
  onOrderNow: () => void;
  onSignInRequest: () => Promise<void>;
}

export const HomeView: React.FC<HomeViewProps> = ({
  menuItems,
  wishlistIds,
  customerReviews,
  currentUser,
  onToggleWishlist,
  onOpenCustomize,
  onQuickAdd,
  onNavigate,
  onOrderNow,
  onSignInRequest,
}) => {
  const featuredItems = menuItems.filter((item) => item.featured && item.available).slice(0, 6);
  const specialOfferItems = menuItems.filter(
    (item) => item.available && item.promoPrice > 0 && item.promoPrice < item.price
  );

  // Customer Review Submission Form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedDishName, setSelectedDishName] = useState(
    menuItems[0]?.name || 'The Sovereign A5 Wagyu Double'
  );
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewNotice, setReviewNotice] = useState('');

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      await onSignInRequest();
      return;
    }
    if (comment.trim().length < 10) {
      setReviewNotice('Please write at least 10 characters sharing your dining notes.');
      return;
    }
    setSubmittingReview(true);
    try {
      await submitCustomerReview(currentUser, {
        authorName: currentUser.displayName || 'Verified Member',
        dishName: selectedDishName,
        rating,
        comment: comment.trim(),
      });
      setComment('');
      setShowReviewForm(false);
      setReviewNotice('Thank you—your verified dish review is now live.');
    } catch {
      setReviewNotice('Could not submit review right now. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="rb-bg rb-text">
      {/* SECTION 1: HERO SHOWCASE */}
      <section className="relative overflow-hidden border-b rb-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-22">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Editorial Copy Column */}
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div className="flex items-center gap-2 text-xs rb-accent font-semibold tracking-wide">
                <span>Contemporary Live-Fire Dining</span>
                <span aria-hidden="true" className="rb-text-subtle">·</span>
                <span className="rb-text-muted font-normal">Mayfair · Dubai · Singapore</span>
              </div>

              <h1 className="font-serif text-[clamp(2.5rem,4.5vw,4.1rem)] font-semibold leading-[1.08] tracking-tight rb-text max-w-xl">
                Royal Bites: Where Open Flame Meets Haute Gastronomy
              </h1>

              <p className="text-base sm:text-[17px] rb-text-muted leading-relaxed max-w-xl">
                Experience A5 Miyazaki-lineage Wagyu burgers, 48-hour cold-fermented truffle
                sourdough pizzas, and 14-hour oak-smoked prime short ribs—with bespoke portion
                customisation and live kitchen tracking.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onOrderNow}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 min-h-[46px] rounded-md bg-[#D4AF37] text-[#0A0A0C] text-sm font-semibold hover:bg-[#E5C76B] active:scale-[0.99] transition-all duration-150 whitespace-nowrap shrink-0"
                >
                  <span>Order Now</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate(PageView.MENU)}
                  className="inline-flex items-center justify-center px-6 py-3.5 min-h-[46px] rounded-md border rb-border rb-text text-sm font-semibold hover:border-[#D4AF37] transition-colors duration-150 whitespace-nowrap shrink-0"
                >
                  Explore Menu
                </button>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs rb-text-subtle">
                <span>100% Traceable Heritage Estates</span>
                <span aria-hidden="true">·</span>
                <span>Custom Cuts & Truffle Add-Ons</span>
                <span aria-hidden="true">·</span>
                <span>Chauffeur Delivery Zones</span>
              </div>
            </div>

            {/* Hero Photography Column */}
            <div className="lg:col-span-6 relative">
              <div className="relative h-full min-h-[320px] sm:min-h-[420px] rounded-lg overflow-hidden border rb-border bg-[#131317]">
                <SafeImage
                  src={BRAND_IMAGES.heroFeast}
                  alt="Royal Bites candlelit feast with Wagyu burger, black truffle pizza, and smoked short ribs"
                  className="w-full h-full lg:h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white">
                  <div>
                    <p className="text-xs text-[#D4AF37] font-semibold">Evening Tasting Table</p>
                    <p className="font-serif text-lg sm:text-xl text-white">
                      Signature Trilogy: Wagyu, Tartufo & White Oak Ribs
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate(PageView.RESERVATIONS)}
                    className="hidden sm:inline-flex px-4 py-2 rounded-md bg-black/80 border border-white/25 text-xs font-semibold text-white hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
                  >
                    Book Table
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width Culinary Metrics Strip Below Hero Split */}
          <div className="mt-12 pt-10 border-t rb-border grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div>
              <p className="font-mono text-2xl sm:text-3xl font-medium tabular-nums rb-accent">
                48 Hours
              </p>
              <p className="mt-1 text-xs sm:text-sm rb-text-muted">
                Cold-fermented artisan Neapolitan sourdough base
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl sm:text-3xl font-medium tabular-nums rb-accent">
                14 Hours
              </p>
              <p className="mt-1 text-xs sm:text-sm rb-text-muted">
                Low-temperature kiln-dried white oak smoking cycle
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl sm:text-3xl font-medium tabular-nums rb-accent">
                28 Days
              </p>
              <p className="mt-1 text-xs sm:text-sm rb-text-muted">
                Himalayan salt-chamber aging on prime beef cuts
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl sm:text-3xl font-medium tabular-nums rb-accent">
                {specialOfferItems.length > 0 ? `${specialOfferItems.length} Offers` : '6 Courses'}
              </p>
              <p className="mt-1 text-xs sm:text-sm rb-text-muted">
                {specialOfferItems.length > 0
                  ? 'Active chef promotional dishes tonight'
                  : 'Distinct culinary disciplines from grill to patisserie'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: FEATURED DISHES & SPECIAL OFFERS */}
      <section className="py-20 border-b rb-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div className="space-y-2">
              <p className="text-xs rb-accent font-semibold tracking-wide">
                Executive Chef Selection & Tonight’s Offers
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold rb-text">
                Signature Creations
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate(PageView.MENU)}
              className="inline-flex items-center gap-2 text-sm font-semibold rb-accent hover:opacity-80 transition-colors self-start sm:self-auto whitespace-nowrap"
            >
              <span>View Complete Menu ({menuItems.length} Dishes)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {featuredItems.map((dish) => {
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
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleWishlist(dish.id)}
                      aria-label={
                        wishlisted
                          ? `Remove ${dish.name} from wishlist`
                          : `Save ${dish.name} to wishlist`
                      }
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
                      {/* Clean unboxed metadata */}
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

                    <div className="pt-2 flex items-center gap-2.5">
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
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: EDITORIAL & VERIFIED CUSTOMER REVIEWS */}
      <section className="py-20 border-b rb-border rb-bg-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs rb-accent font-semibold tracking-wide">
                Verified Guest & Editorial Perspectives
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold rb-text">
                Trusted for Private Dining & Evening Delivery
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setShowReviewForm((prev) => !prev)}
              className="px-5 py-2.5 min-h-[42px] rounded-md border rb-border rb-surface text-xs sm:text-sm font-semibold rb-text hover:border-[#D4AF37] transition-colors self-start sm:self-auto whitespace-nowrap"
            >
              {showReviewForm ? 'Close Review Form' : 'Write a Dish Review'}
            </button>
          </div>

          {reviewNotice && <p className="text-xs rb-accent font-medium">{reviewNotice}</p>}

          {showReviewForm && (
            <form
              onSubmit={handleReviewSubmit}
              className="p-6 sm:p-8 rounded-lg rb-surface border rb-border space-y-4 max-w-2xl"
            >
              <h3 className="font-serif text-2xl font-semibold rb-text">
                Share Your Culinary Rating
              </h3>
              {!currentUser && (
                <p className="text-xs rb-text-muted">
                  Clicking submit will prompt Google Sign-In so reviews remain verified.
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold rb-text mb-1.5">Dish Tasted</label>
                  <select
                    value={selectedDishName}
                    onChange={(e) => setSelectedDishName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md rb-bg border rb-border text-sm rb-text"
                  >
                    {menuItems.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-xs font-semibold rb-text mb-1.5">Rating</span>
                  <div className="flex items-center gap-1.5 py-1.5">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRating(num)}
                        aria-label={`Rate ${num} out of 5`}
                        className="p-1"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            num <= rating
                              ? 'fill-[#D4AF37] text-[#D4AF37]'
                              : 'rb-text-subtle'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="font-mono text-xs ml-2 rb-text">{rating}.0 / 5.0</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold rb-text mb-1.5">
                  Tasting Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={10}
                  maxLength={600}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe preparation, temperature, flavor balance..."
                  className="w-full px-3.5 py-2.5 rounded-md rb-bg border rb-border text-sm rb-text"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="px-6 py-2.5 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs font-semibold hover:bg-[#E5C76B]"
              >
                {submittingReview
                  ? 'Publishing...'
                  : currentUser
                  ? 'Publish Verified Review'
                  : 'Sign In & Publish Review'}
              </button>
            </form>
          )}

          {/* Editorial Quotes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
            {GUEST_REVIEWS.map((review) => (
              <blockquote
                key={review.id}
                className="p-7 rounded-lg rb-surface border rb-border flex flex-col justify-between space-y-6"
              >
                <p className="text-sm sm:text-[15px] rb-text leading-relaxed">“{review.quote}”</p>

                <footer className="pt-4 border-t rb-border space-y-1">
                  <div className="text-sm font-semibold rb-text">{review.author}</div>
                  <div className="text-xs rb-text-muted">
                    {review.role} · {review.organization}
                  </div>
                  <div className="text-xs rb-accent pt-1">Ordered: {review.dishOrdered}</div>
                </footer>
              </blockquote>
            ))}
          </div>

          {/* Live Customer Reviews Feed */}
          {customerReviews.length > 0 && (
            <div className="pt-4 space-y-4">
              <h3 className="font-serif text-2xl font-semibold rb-text">
                Recent Member Dish Ratings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {customerReviews.slice(0, 6).map((cr) => (
                  <div
                    key={cr.id}
                    className="p-5 rounded-lg rb-surface border rb-border space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold rb-text">{cr.authorName}</span>
                      <span className="font-mono tabular-nums rb-accent">
                        {'★'.repeat(cr.rating)} ({cr.rating}.0)
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm rb-text-muted leading-relaxed">
                      “{cr.comment}”
                    </p>
                    <div className="text-[11px] rb-text-subtle">
                      {cr.dishName} · {cr.createdAtLabel}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4: PRIVATE TABLE INVITATION */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 lg:p-14 rounded-lg rb-surface border rb-border flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs rb-accent font-semibold tracking-wide">
                Main Dining Room · Chef’s Fire Counter · Private Salon
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold rb-text">
                Reserve an Evening Around the Hearth
              </h2>
              <p className="text-sm sm:text-base rb-text-muted leading-relaxed">
                Reserve your preferred dining room space online with instant cloud confirmation
                tracking in your member account.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate(PageView.RESERVATIONS)}
                className="px-6 py-3.5 min-h-[46px] rounded-md bg-[#D4AF37] text-[#0A0A0C] text-sm font-semibold hover:bg-[#E5C76B] transition-colors whitespace-nowrap"
              >
                Reserve a Table
              </button>
              <button
                type="button"
                onClick={() => onNavigate(PageView.ABOUT)}
                className="px-6 py-3.5 min-h-[46px] rounded-md border rb-border rb-text text-sm font-semibold hover:border-[#D4AF37] transition-colors whitespace-nowrap"
              >
                Read Our Story
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

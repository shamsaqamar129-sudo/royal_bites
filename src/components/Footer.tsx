import React, { useState } from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { subscribeMemberNewsletter } from '../lib/firestoreService';
import { PageView, RestaurantSettings } from '../types';

interface FooterProps {
  onNavigate: (page: PageView) => void;
  settings: RestaurantSettings;
  currentUser: User | null;
  onSignInRequest: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  settings,
  currentUser,
  onSignInRequest,
}) => {
  const [email, setEmail] = useState(currentUser?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [subscribedMessage, setSubscribedMessage] = useState<string | null>(null);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;

    if (!currentUser) {
      setSubscribedMessage(
        'Sign in with Google to save your culinary journal subscription to your member profile.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await subscribeMemberNewsletter(currentUser, email.trim());
      setSubscribedMessage('Subscribed to the Royal Bites Seasonal Cellar & Hearth Dispatch.');
    } catch {
      setSubscribedMessage('Unable to update subscription right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappDirectUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    'Hello Royal Bites Concierge, I would like to inquire about dining and ordering.'
  )}`;

  return (
    <footer className="rb-bg-alt border-t rb-border rb-text-muted no-print">
      {/* Newsletter Marketing Section */}
      <div className="border-b rb-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs rb-accent font-semibold tracking-wide">
              The Hearth & Cellar Dispatch
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold rb-text">
              Receive Seasonal Truffle Arrivals & Private Tasting Invitations
            </h2>
            <p className="text-sm rb-text-muted">
              Curated monthly dispatches on rare Wagyu allocations, chef table evenings, and member
              privileges.
            </p>
          </div>

          <div className="w-full max-w-md">
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                aria-label="Newsletter email address"
                className="flex-1 px-4 py-2.5 min-h-[42px] rounded-md rb-surface border rb-border text-sm rb-text placeholder:opacity-50 focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 min-h-[42px] rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs sm:text-sm font-semibold hover:bg-[#E5C76B] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                {submitting ? 'Saving...' : 'Subscribe'}
              </button>
            </form>

            {subscribedMessage && (
              <div className="mt-2.5 flex items-center justify-between gap-3 text-xs rb-text">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 rb-accent shrink-0" />
                  <span>{subscribedMessage}</span>
                </span>
                {!currentUser && (
                  <button
                    type="button"
                    onClick={onSignInRequest}
                    className="rb-accent font-semibold underline whitespace-nowrap shrink-0"
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => onNavigate(PageView.HOME)}
              className="font-serif text-2xl font-semibold tracking-wider rb-text hover:text-[#D4AF37] transition-colors"
            >
              Royal Bites
            </button>
            <p className="text-sm rb-text-muted leading-relaxed max-w-xs">
              Contemporary live-fire kitchen uniting Japanese Wagyu craft, 48-hour wood-fired dough,
              and bespoke hospitality.
            </p>
            <p className="text-xs rb-text-subtle">Mayfair · Dubai · Singapore</p>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-semibold rb-text">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate(PageView.HOME)}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Home Showcase
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate(PageView.MENU)}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Culinary Menu & Customizer
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate(PageView.RESERVATIONS)}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Table Reservations
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate(PageView.ACCOUNT)}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Member Profile, Wishlist & Orders
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate(PageView.ADMIN)}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Admin Analytics & Console
                </button>
              </li>
            </ul>
          </div>

          {/* Live Synced Opening Hours */}
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-semibold rb-text">Dining Hours</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span>Mon – Thu</span>
                <span className="font-mono text-xs tabular-nums rb-text">
                  {settings.weekdayHours}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Fri – Sat</span>
                <span className="font-mono text-xs tabular-nums rb-text">
                  {settings.weekendHours}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Sunday</span>
                <span className="font-mono text-xs tabular-nums rb-text">
                  {settings.sundayHours}
                </span>
              </div>
              <p className="pt-1 text-xs rb-accent">
                {settings.acceptingOrders
                  ? 'Kitchen Open for Online Delivery Orders'
                  : 'Online Delivery Temporarily Paused'}
              </p>
            </div>
          </div>

          {/* Concierge & WhatsApp Integration */}
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-semibold rb-text">Concierge & Social</h3>
            <div className="space-y-2 text-sm">
              <p>14 Berkeley Square, Mayfair</p>
              <p className="font-mono text-xs tabular-nums rb-text">+44 (0) 20 7946 0821</p>
              <a
                href={whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold rb-accent hover:underline pt-1"
              >
                <span>Chat with WhatsApp Concierge</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <div className="pt-2 flex items-center gap-3 text-xs rb-text-muted">
                <button
                  type="button"
                  onClick={() => onNavigate(PageView.CONTACT)}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Instagram
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => onNavigate(PageView.CONTACT)}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Facebook
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => onNavigate(PageView.CONTACT)}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  X / Journal
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t rb-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs rb-text-subtle">
          <p>© {new Date().getFullYear()} Royal Bites Hospitality Group. All rights reserved.</p>
          <p>
            Firebase Auth & Firestore Connected · Orders settle via Pay on Delivery (no live card
            gateway connected).
          </p>
        </div>
      </div>
    </footer>
  );
};

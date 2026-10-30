import React, { useState } from 'react';
import { Menu, Moon, ShieldCheck, ShoppingBag, Sun, User as UserIcon, X } from 'lucide-react';
import { User } from 'firebase/auth';
import { PageView, RestaurantSettings, ThemeMode } from '../types';

interface HeaderProps {
  activePage: PageView;
  onNavigate: (page: PageView) => void;
  cartCount: number;
  onOpenCart: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  currentUser: User | null;
  isAdmin: boolean;
  onSignInRequest: () => void;
  settings: RestaurantSettings;
  onCopyPromoCode: (code: string) => void;
}

const NAV_LINKS: { label: string; view: PageView }[] = [
  { label: 'Menu', view: PageView.MENU },
  { label: 'Reservations', view: PageView.RESERVATIONS },
  { label: 'About', view: PageView.ABOUT },
  { label: 'Contact', view: PageView.CONTACT },
  { label: 'Account', view: PageView.ACCOUNT },
];

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onNavigate,
  cartCount,
  onOpenCart,
  theme,
  onToggleTheme,
  currentUser,
  isAdmin,
  onSignInRequest,
  settings,
  onCopyPromoCode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const handleNavClick = (view: PageView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Non-sticky Promotional & Utility Strip (preserves 15% mobile sticky budget) */}
      <div className="rb-bg-alt border-b rb-border text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[38px] py-1.5 flex flex-wrap items-center justify-between gap-3">
          {settings.promoBannerActive && !bannerDismissed && settings.promoBannerText ? (
            <div className="flex items-center gap-2 rb-text-muted truncate max-w-full sm:max-w-[60%]">
              <span className="truncate">{settings.promoBannerText}</span>
              {settings.promoBannerCode && (
                <button
                  type="button"
                  onClick={() => onCopyPromoCode(settings.promoBannerCode)}
                  className="font-mono font-semibold rb-accent underline underline-offset-2 hover:opacity-80 whitespace-nowrap shrink-0"
                >
                  Use {settings.promoBannerCode}
                </button>
              )}
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss promotional banner"
                className="rb-text-subtle hover:rb-text ml-1 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="rb-text-subtle">
              Hours Today: <span className="font-mono tabular-nums">{settings.weekdayHours}</span>
            </div>
          )}

          {/* Utility Controls: Theme Switch, Account Quick Sign-In, Admin Console Link */}
          <div className="flex items-center gap-4 ml-auto">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="inline-flex items-center gap-1.5 rb-text-muted hover:rb-text transition-colors whitespace-nowrap shrink-0"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 rb-accent" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 rb-accent" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <span aria-hidden="true" className="rb-text-subtle">·</span>

            {currentUser ? (
              <button
                type="button"
                onClick={() => handleNavClick(PageView.ACCOUNT)}
                className="inline-flex items-center gap-1.5 rb-text-muted hover:rb-text transition-colors whitespace-nowrap shrink-0"
              >
                <UserIcon className="w-3.5 h-3.5 rb-accent" />
                <span className="truncate max-w-[120px]">
                  {currentUser.displayName || 'My Account'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignInRequest}
                className="rb-text-muted hover:rb-text font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Sign In / Register
              </button>
            )}

            <span aria-hidden="true" className="rb-text-subtle">·</span>

            <button
              type="button"
              onClick={() => handleNavClick(PageView.ADMIN)}
              className={`inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                activePage === PageView.ADMIN
                  ? 'rb-accent font-semibold'
                  : 'rb-text-muted hover:rb-text'
              }`}
            >
              {isAdmin && <ShieldCheck className="w-3.5 h-3.5 rb-accent" />}
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Strict 3-Zone Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 h-16 rb-bg/92 backdrop-blur-md border-b rb-border">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleNavClick(PageView.HOME)}
            className="font-serif text-2xl sm:text-[26px] font-semibold tracking-wider rb-text hover:text-[#D4AF37] transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
          >
            Royal Bites
          </button>

          {/* Zone 2: 5 Single-Line Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-7 text-sm rb-text-muted"
          >
            {NAV_LINKS.map((link) => {
              const isActive = activePage === link.view;
              return (
                <button
                  key={link.view}
                  type="button"
                  onClick={() => handleNavClick(link.view)}
                  className={`relative py-1 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none ${
                    isActive
                      ? 'rb-accent font-semibold after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-[1.5px] after:bg-[#D4AF37]'
                      : 'hover:rb-text after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-[1px] after:bg-current after:opacity-0 hover:after:opacity-40 after:transition-opacity'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action (+ Mobile Menu Affordance on < md) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenCart}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs sm:text-sm font-semibold tracking-wide hover:bg-[#E5C76B] active:scale-[0.99] transition-all duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span className="font-mono tabular-nums">
                Order Bag{cartCount > 0 ? ` (${cartCount})` : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md border rb-border rb-text hover:border-[#D4AF37] transition-colors duration-150"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Sheet */}
        {mobileMenuOpen && (
          <div className="md:hidden rb-surface border-b rb-border px-4 pt-3 pb-5 shadow-2xl">
            <nav aria-label="Mobile Navigation" className="flex flex-col space-y-1">
              <button
                type="button"
                onClick={() => handleNavClick(PageView.HOME)}
                className={`w-full text-left px-3 py-3 rounded-md text-base transition-colors ${
                  activePage === PageView.HOME
                    ? 'rb-accent rb-bg-alt font-semibold'
                    : 'rb-text hover:opacity-80'
                }`}
              >
                Home
              </button>
              {NAV_LINKS.map((link) => {
                const isActive = activePage === link.view;
                return (
                  <button
                    key={link.view}
                    type="button"
                    onClick={() => handleNavClick(link.view)}
                    className={`w-full text-left px-3 py-3 rounded-md text-base transition-colors ${
                      isActive ? 'rb-accent rb-bg-alt font-semibold' : 'rb-text hover:opacity-80'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => handleNavClick(PageView.ADMIN)}
                className={`w-full text-left px-3 py-3 rounded-md text-base transition-colors ${
                  activePage === PageView.ADMIN
                    ? 'rb-accent rb-bg-alt font-semibold'
                    : 'rb-text hover:opacity-80'
                }`}
              >
                Admin Dashboard
              </button>
            </nav>
          </div>
        )}
      </header>
    </>
  );
};

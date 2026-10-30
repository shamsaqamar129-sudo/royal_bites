import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, LogIn, Users } from 'lucide-react';
import { User } from 'firebase/auth';
import { createTableReservation } from '../lib/firestoreService';
import { PageView, ReservationRecord, RestaurantSettings, UserProfileState } from '../types';

interface ReservationsViewProps {
  currentUser: User | null;
  userProfile: UserProfileState | null;
  settings: RestaurantSettings;
  onSignInRequest: () => Promise<void>;
  onNavigate: (page: PageView) => void;
  onReservationCreated: (res: ReservationRecord) => void;
}

const TIME_SLOTS = ['12:30', '13:45', '18:00', '19:30', '20:30', '21:45'];
const SEATING_AREAS = ['Main Dining Room', "Chef's Fire Counter", 'Private Salon'];

export const ReservationsView: React.FC<ReservationsViewProps> = ({
  currentUser,
  userProfile,
  settings,
  onSignInRequest,
  onNavigate,
  onReservationCreated,
}) => {
  const defaultDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('19:30');
  const [guests, setGuests] = useState(2);
  const [seating, setSeating] = useState(SEATING_AREAS[0]);
  const [specialRequests, setSpecialRequests] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedRes, setConfirmedRes] = useState<ReservationRecord | null>(null);

  useEffect(() => {
    if (userProfile) {
      setName((prev) => prev || userProfile.displayName || '');
      setPhone((prev) => prev || userProfile.phone || '');
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please sign in with Google below to save and track your table reservation.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Please enter the primary guest full name.');
      return;
    }
    if (phone.trim().length < 6) {
      setError('Please enter a valid contact phone number.');
      return;
    }
    if (!date) {
      setError('Please choose a preferred reservation date.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const created = await createTableReservation(currentUser, {
        name: name.trim(),
        phone: phone.trim(),
        date,
        time,
        guests,
        seating,
        specialRequests: specialRequests.trim(),
      });
      setConfirmedRes(created);
      onReservationCreated(created);
    } catch {
      setError('Could not submit reservation right now. Please verify fields and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rb-bg rb-text min-h-screen py-14 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Editorial Column */}
          <div className="lg:col-span-5 space-y-6">
            <p className="text-xs rb-accent font-semibold tracking-wide">Table & Salon Requests</p>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold rb-text leading-tight">
              Reserve Your Table at Royal Bites
            </h1>
            <p className="text-sm sm:text-base rb-text-muted leading-relaxed">
              Join us in the Main Dining Room, observe live-fire plating directly at the Chef’s
              Counter, or gather up to twenty guests in our Private Salon.
            </p>

            <div className="pt-4 border-t rb-border space-y-4 text-sm rb-text-muted">
              <div>
                <h2 className="font-serif text-xl font-semibold rb-text mb-1">
                  Current Dining Hours
                </h2>
                <p className="text-xs sm:text-sm">
                  Mon – Thu: <span className="font-mono rb-text">{settings.weekdayHours}</span> ·
                  Fri – Sat: <span className="font-mono rb-text">{settings.weekendHours}</span> ·
                  Sun: <span className="font-mono rb-text">{settings.sundayHours}</span>
                </p>
              </div>

              <div>
                <h2 className="font-serif text-xl font-semibold rb-text mb-1">
                  Cloud Reservation Tracking
                </h2>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Reservations are saved directly to our Firestore reservation desk and can be
                  tracked or cancelled anytime inside your Member Account.
                </p>
              </div>
            </div>
          </div>

          {/* Right Form or Confirmation Column */}
          <div className="lg:col-span-7">
            {confirmedRes ? (
              <div className="p-7 sm:p-10 rounded-lg rb-surface border border-[#D4AF37]/45 space-y-6">
                <div className="flex items-center gap-2.5 rb-accent">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-semibold tracking-wide">
                    Cloud Reservation Recorded · {confirmedRes.reservationCode}
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="font-serif text-3xl font-semibold rb-text">
                    Table Request Received for {confirmedRes.name}
                  </h2>
                  <p className="text-sm rb-text-muted leading-relaxed">
                    Your request is now in status{' '}
                    <strong className="rb-text">{confirmedRes.status}</strong>. As our host desk
                    updates your seating status, changes sync live in your Account Profile.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-md rb-bg-alt border rb-border">
                  <div>
                    <p className="text-xs rb-text-subtle">Date</p>
                    <p className="mt-1 font-mono text-sm tabular-nums rb-text">
                      {confirmedRes.date}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs rb-text-subtle">Seating Time</p>
                    <p className="mt-1 font-mono text-sm tabular-nums rb-accent">
                      {confirmedRes.time}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs rb-text-subtle">Party Size</p>
                    <p className="mt-1 font-mono text-sm tabular-nums rb-text">
                      {confirmedRes.guests} {confirmedRes.guests === 1 ? 'Guest' : 'Guests'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onNavigate(PageView.ACCOUNT)}
                    className="px-6 py-3 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-sm font-semibold hover:bg-[#E5C76B] transition-colors whitespace-nowrap"
                  >
                    View in My Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedRes(null);
                      setSpecialRequests('');
                    }}
                    className="px-5 py-3 rounded-md border rb-border text-xs sm:text-sm font-semibold rb-text hover:border-[#D4AF37] transition-colors whitespace-nowrap"
                  >
                    Book Another Table
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="p-7 sm:p-9 rounded-lg rb-surface border rb-border space-y-6"
              >
                {!currentUser && (
                  <div className="p-4 rounded-md border border-[#D4AF37]/40 rb-bg-alt flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs rb-text leading-relaxed">
                      Sign in with Google to reserve a table and receive live confirmation updates.
                    </p>
                    <button
                      type="button"
                      onClick={() => onSignInRequest()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs font-semibold shrink-0"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In</span>
                    </button>
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-md border border-red-500/40 bg-red-500/10 text-xs text-red-400"
                  >
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="res-name"
                      className="block text-xs font-semibold rb-text mb-2"
                    >
                      Guest Full Name *
                    </label>
                    <input
                      id="res-name"
                      type="text"
                      required
                      maxLength={80}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Victoria Kensington"
                      className="w-full px-3.5 py-2.5 min-h-[42px] rounded-md rb-bg border rb-border text-sm rb-text focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="res-phone"
                      className="block text-xs font-semibold rb-text mb-2"
                    >
                      Phone Number *
                    </label>
                    <input
                      id="res-phone"
                      type="tel"
                      required
                      maxLength={30}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+44 7700 900512"
                      className="w-full px-3.5 py-2.5 min-h-[42px] rounded-md rb-bg border rb-border text-sm rb-text focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="res-date"
                      className="flex items-center gap-1.5 text-xs font-semibold rb-text mb-2"
                    >
                      <Calendar className="w-3.5 h-3.5 rb-accent" />
                      <span>Preferred Date *</span>
                    </label>
                    <input
                      id="res-date"
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 min-h-[42px] rounded-md rb-bg border rb-border text-sm font-mono tabular-nums rb-text focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="res-guests"
                      className="flex items-center gap-1.5 text-xs font-semibold rb-text mb-2"
                    >
                      <Users className="w-3.5 h-3.5 rb-accent" />
                      <span>Guest Count *</span>
                    </label>
                    <select
                      id="res-guests"
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 min-h-[42px] rounded-md rb-bg border rb-border text-sm rb-text focus:outline-none focus:border-[#D4AF37]"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Guest' : 'Guests'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <span className="flex items-center gap-1.5 text-xs font-semibold rb-text mb-2.5">
                    <Clock className="w-3.5 h-3.5 rb-accent" />
                    <span>Select Seating Time *</span>
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {TIME_SLOTS.map((slot) => {
                      const active = time === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setTime(slot)}
                          className={`py-2.5 px-3 min-h-[40px] rounded-md font-mono text-xs tabular-nums font-medium transition-colors whitespace-nowrap ${
                            active
                              ? 'bg-[#D4AF37] text-[#0A0A0C] font-semibold'
                              : 'rb-bg border rb-border rb-text-muted hover:border-[#D4AF37]'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Seating Area */}
                <div>
                  <span className="block text-xs font-semibold rb-text mb-2.5">
                    Preferred Dining Space
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {SEATING_AREAS.map((area) => {
                      const active = seating === area;
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => setSeating(area)}
                          className={`py-2.5 px-3 min-h-[40px] rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                            active
                              ? 'rb-bg-alt border border-[#D4AF37] rb-accent'
                              : 'rb-bg border rb-border rb-text-muted hover:rb-text'
                          }`}
                        >
                          {area}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="res-notes"
                    className="block text-xs font-semibold rb-text mb-2"
                  >
                    Dietary Requirements or Occasion Notes (Optional)
                  </label>
                  <textarea
                    id="res-notes"
                    rows={3}
                    maxLength={250}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Allergies, celebration details, seating preferences"
                    className="w-full px-3.5 py-2.5 rounded-md rb-bg border rb-border text-sm rb-text focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 min-h-[46px] rounded-md bg-[#D4AF37] text-[#0A0A0C] text-sm font-semibold hover:bg-[#E5C76B] disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {submitting ? 'Submitting Reservation...' : 'Confirm Table Reservation Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

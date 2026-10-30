import React, { useState } from 'react';
import { CheckCircle2, ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import { DeliveryZone, RestaurantSettings } from '../types';

interface ContactViewProps {
  settings: RestaurantSettings;
  deliveryZones: DeliveryZone[];
}

export const ContactView: React.FC<ContactViewProps> = ({ settings, deliveryZones }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Private Dining & Events');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [activeSocialNotice, setActiveSocialNotice] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSubmitted(true);
  };

  const whatsappContactUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    `Hello Royal Bites Concierge, my name is ${name || 'a guest'} inquiring regarding ${subject}.`
  )}`;

  const socialChannels = [
    { name: 'Instagram', handle: '@royalbites.dining' },
    { name: 'Facebook', handle: '/royalbiteshospitality' },
    { name: 'X / Editorial', handle: '@royalbites' },
    { name: 'YouTube Atelier', handle: '@royalbiteskitchen' },
  ];

  return (
    <div className="rb-bg rb-text min-h-screen py-14 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left Concierge Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <p className="text-xs rb-accent font-semibold tracking-wide">
                Guest Relations & Direct Dispatch
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl font-semibold rb-text">
                Contact Concierge
              </h1>
              <p className="text-sm sm:text-base rb-text-muted leading-relaxed">
                Reach out regarding private salon buy-outs, bespoke tasting menus, dietary
                accommodations, or chauffeur delivery zones.
              </p>
            </div>

            <div className="space-y-5 pt-2 border-t rb-border">
              <div className="flex items-start gap-3.5">
                <MapPin className="w-5 h-5 rb-accent shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold rb-text">Flagship Dining Room</h2>
                  <p className="text-sm rb-text-muted mt-0.5">
                    14 Berkeley Square, Mayfair, London W1J 6AA
                  </p>
                  <p className="text-xs rb-text-subtle mt-1">
                    Hours: Mon–Thu {settings.weekdayHours} · Fri–Sat {settings.weekendHours}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <Phone className="w-5 h-5 rb-accent shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold rb-text">Reservations & WhatsApp Desk</h2>
                  <p className="font-mono text-sm tabular-nums rb-text-muted mt-0.5">
                    +44 (0) 20 7946 0821
                  </p>
                  <a
                    href={whatsappContactUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold rb-accent hover:underline mt-1"
                  >
                    <span>Message Directly on WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <Mail className="w-5 h-5 rb-accent shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold rb-text">Electronic Correspondence</h2>
                  <p className="text-sm rb-text-muted mt-0.5">concierge@royalbites.example</p>
                  <p className="text-xs rb-text-subtle mt-0.5">events@royalbites.example</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-4 border-t rb-border space-y-3">
              <h2 className="font-serif text-xl font-semibold rb-text">Social Channels</h2>
              <div className="grid grid-cols-2 gap-3">
                {socialChannels.map((soc) => (
                  <button
                    key={soc.name}
                    type="button"
                    onClick={() =>
                      setActiveSocialNotice(
                        `${soc.name} (${soc.handle}) — Follow our seasonal live-fire dispatches.`
                      )
                    }
                    className="p-3.5 rounded-md rb-surface border rb-border text-left hover:border-[#D4AF37] transition-colors"
                  >
                    <p className="text-xs font-semibold rb-text">{soc.name}</p>
                    <p className="text-xs rb-accent mt-0.5 truncate">{soc.handle}</p>
                  </button>
                ))}
              </div>
              {activeSocialNotice && (
                <p className="text-xs rb-text-muted pt-1">{activeSocialNotice}</p>
              )}
            </div>
          </div>

          {/* Right Contact Form */}
          <div className="lg:col-span-7">
            {submitted ? (
              <div className="p-8 sm:p-10 rounded-lg rb-surface border border-[#D4AF37]/40 space-y-5">
                <div className="flex items-center gap-2 rb-accent">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-xs font-semibold tracking-wide">Inquiry Logged</span>
                </div>
                <h2 className="font-serif text-3xl font-semibold rb-text">
                  Thank you for writing, {name}
                </h2>
                <p className="text-sm rb-text-muted leading-relaxed">
                  We have recorded your inquiry regarding{' '}
                  <strong className="rb-text">{subject}</strong>. For immediate assistance, you can
                  also connect via our WhatsApp Concierge link.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={whatsappContactUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs sm:text-sm font-semibold"
                  >
                    <span>Continue on WhatsApp</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setEmail('');
                      setMessage('');
                    }}
                    className="px-5 py-3 rounded-md border rb-border text-xs sm:text-sm font-semibold rb-text"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="p-7 sm:p-9 rounded-lg rb-surface border rb-border space-y-5"
              >
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold rb-text">
                  Send a Direct Inquiry
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold rb-text mb-2"
                    >
                      Your Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-3.5 py-2.5 min-h-[42px] rounded-md rb-bg border rb-border text-sm rb-text focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold rb-text mb-2"
                    >
                      Email Address *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.example"
                      className="w-full px-3.5 py-2.5 min-h-[42px] rounded-md rb-bg border rb-border text-sm rb-text focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="block text-xs font-semibold rb-text mb-2"
                  >
                    Inquiry Topic
                  </label>
                  <select
                    id="contact-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 min-h-[42px] rounded-md rb-bg border rb-border text-sm rb-text focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Private Dining & Events">Private Dining & Events</option>
                    <option value="Bespoke Catering & Chauffeur Orders">
                      Bespoke Catering & Chauffeur Orders
                    </option>
                    <option value="Dietary & Allergen Consultation">
                      Dietary & Allergen Consultation
                    </option>
                    <option value="Press & Partnerships">Press & Partnerships</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-semibold rb-text mb-2"
                  >
                    Message *
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share your preferred dates, guest count, or questions..."
                    className="w-full px-3.5 py-2.5 rounded-md rb-bg border rb-border text-sm rb-text focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <a
                    href={whatsappContactUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold rb-accent hover:underline"
                  >
                    <span>Prefer WhatsApp? Message Concierge</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="submit"
                    className="px-7 py-3 min-h-[44px] rounded-md bg-[#D4AF37] text-[#0A0A0C] text-sm font-semibold hover:bg-[#E5C76B] transition-colors whitespace-nowrap shrink-0"
                  >
                    Submit Inquiry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Active Delivery Zones Overview */}
        <section className="pt-10 border-t rb-border space-y-6">
          <div className="space-y-1">
            <p className="text-xs rb-accent font-semibold tracking-wide">Chauffeur Coverage</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold rb-text">
              Active Delivery Zones & Charges
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {deliveryZones.map((zone) => (
              <div key={zone.id} className="p-5 rounded-lg rb-surface border rb-border space-y-2">
                <h3 className="text-sm font-semibold rb-text">{zone.name}</h3>
                <p className="font-mono text-lg tabular-nums rb-accent font-semibold">
                  ${zone.fee.toFixed(2)}{' '}
                  <span className="text-xs rb-text-subtle font-normal">fee</span>
                </p>
                <p className="text-xs rb-text-muted">
                  Est. {zone.estimatedTime} · Min Order ${zone.minOrder}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

import React from 'react';
import { BRAND_IMAGES } from '../data/initialData';
import { PageView } from '../types';
import { SafeImage } from './SafeImage';

interface AboutViewProps {
  onNavigate: (page: PageView) => void;
}

const CORE_VALUES = [
  {
    index: '01.',
    title: 'Provenance Without Compromise',
    body: 'We partner directly with single-estate Wagyu breeders, heritage British pasture farms, and Italian stone-ground flour mills so every ingredient arrives with full lineage transparency.',
  },
  {
    index: '02.',
    title: 'Live Fire & Patient Fermentation',
    body: 'Great flavor refuses shortcuts. Our pizza dough rests 48 hours in cold marble proofing rooms, and our prime beef ribs smoke 14 hours over seasoned white oak.',
  },
  {
    index: '03.',
    title: 'Warmth Without Pretension',
    body: 'Whether savoring hand-cut truffle fries at midnight or celebrating a milestone in our Private Salon, every guest receives attentive, unhurried hospitality.',
  },
];

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  return (
    <div className="rb-bg rb-text min-h-screen py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Story Split Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <p className="text-xs rb-accent font-semibold tracking-wide">Our Culinary Heritage</p>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold rb-text leading-tight">
              Elevating Familiar Comforts Into Fine Dining Rituals
            </h1>
            <p className="text-sm sm:text-base rb-text-muted leading-relaxed">
              Founded around an open obsidian hearth and a wood-fired brick oven, Royal Bites began
              with a singular question: what happens when universally loved dishes—burgers,
              sourdough pizza, smokehouse ribs, and crisp buttermilk sliders—are executed with the
              rigor of an international tasting kitchen?
            </p>
            <p className="text-sm sm:text-base rb-text-muted leading-relaxed">
              Led by Executive Chef Antoine Dubois and a brigade trained across London, Tokyo, and
              Naples, our kitchen treats every brioche glaze, Tellicherry peppercorn rub, and
              Valrhona chocolate temper as an exercise in craft.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate(PageView.MENU)}
                className="px-6 py-3 min-h-[44px] rounded-md bg-[#D4AF37] text-[#0A0A0C] text-sm font-semibold hover:bg-[#E5C76B] transition-colors whitespace-nowrap"
              >
                Explore the Menu
              </button>
              <button
                type="button"
                onClick={() => onNavigate(PageView.RESERVATIONS)}
                className="px-6 py-3 min-h-[44px] rounded-md border rb-border rb-text text-sm font-semibold hover:border-[#D4AF37] transition-colors whitespace-nowrap"
              >
                Book a Table
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[320px] sm:min-h-[420px] rounded-lg overflow-hidden border rb-border bg-[#131317]">
              <SafeImage
                src={BRAND_IMAGES.storyAtelier}
                alt="Executive chef plating a signature dish under brass pendant lights at Royal Bites"
                className="w-full h-full lg:h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Culinary Mission Section */}
        <section className="py-14 px-6 sm:px-12 rounded-lg rb-surface border rb-border text-center max-w-5xl mx-auto space-y-4">
          <p className="text-xs rb-accent font-semibold tracking-wide">Our Mission</p>
          <h2 className="font-serif text-2xl sm:text-4xl font-semibold rb-text leading-snug max-w-3xl mx-auto">
            “To honor elemental fire, ethical sourcing, and generous hospitality—whether served on
            warm porcelain in our dining room or delivered to your residence.”
          </h2>
          <p className="text-xs rb-text-subtle pt-2">
            Antoine Dubois · Culinary Director, Royal Bites Hospitality
          </p>
        </section>

        {/* Core Values Grid */}
        <section className="space-y-10">
          <div className="max-w-xl space-y-2">
            <p className="text-xs rb-accent font-semibold tracking-wide">Guiding Principles</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold rb-text">
              The Three Pillars of Our Kitchen
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {CORE_VALUES.map((val) => (
              <div
                key={val.index}
                className="p-7 rounded-lg rb-surface border rb-border space-y-4"
              >
                <span className="font-mono text-sm rb-accent font-semibold">{val.index}</span>
                <h3 className="font-serif text-2xl font-semibold rb-text">{val.title}</h3>
                <p className="text-sm rb-text-muted leading-relaxed">{val.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

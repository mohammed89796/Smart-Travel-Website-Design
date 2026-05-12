import { Calendar, MapPin, DollarSign, Clock, Star, Sparkles, Download, Share2 } from 'lucide-react';
import { motion } from 'motion/react';

export interface ItineraryDay {
  day: number;
  destinations: {
    name: string;
    city: string;
    time: string;
    description: string;
    cost: number;
    imageUrl: string;
    rating: number;
  }[];
  accommodation: {
    name: string;
    cost: number;
    type: string;
  };
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
    };
  totalDayCost: number;
}

export interface Itinerary {
  totalCost: number;
  days: ItineraryDay[];
  summary: {
    accommodationTotal: number;
    activitiesTotal: number;
    foodTotal: number;
    transportTotal: number;
  };
}

interface ItineraryDisplayProps {
  itinerary: Itinerary;
  budget: number;
  onBack: () => void;
  onBookJourney: () => void;
}

export function ItineraryDisplay({ itinerary, budget, onBack, onBookJourney }: ItineraryDisplayProps) {
  const budgetUtilization = (itinerary.totalCost / budget) * 100;
  const coverImage = itinerary.days[0]?.destinations[0]?.imageUrl || 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1400';

  const exportItineraryPdf = () => {
    const reportHtml = `
      <html>
      <head>
        <title>Smart Travel Itinerary</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; margin: 0; color: #1f2937; background: #f8fafc; }
          .page { padding: 28px; }
          .cover {
            position: relative;
            height: 320px;
            border-radius: 28px;
            overflow: hidden;
            margin-bottom: 24px;
            color: #fff;
            background: linear-gradient(135deg, #2563eb, #7c3aed, #ec4899);
          }
          .cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.35; }
          .cover::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.78), rgba(0,0,0,.18)); }
          .cover-content { position: relative; z-index: 1; height: 100%; padding: 28px; display: flex; flex-direction: column; justify-content: space-between; }
          .eyebrow { display: inline-flex; gap: 8px; align-items: center; align-self: flex-start; padding: 8px 12px; border-radius: 999px; background: rgba(255,255,255,.18); backdrop-filter: blur(10px); font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
          h1 { margin: 14px 0 8px; font-size: 40px; line-height: 1.05; }
          .subtitle { max-width: 760px; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,.92); }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 18px; }
          .stat { background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.2); border-radius: 18px; padding: 14px; }
          .label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.68); margin-bottom: 4px; }
          .value { font-size: 18px; font-weight: 700; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 22px; padding: 18px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06); }
          .section-title { margin: 0 0 12px; font-size: 22px; color: #0f172a; }
          .row { display: flex; justify-content: space-between; gap: 12px; }
          .muted { color: #64748b; }
          .pill-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
          .pill { padding: 8px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; color: #0f172a; background: #e2e8f0; }
          .day { margin-top: 18px; overflow: hidden; }
          .day-head { padding: 18px 18px 0; }
          .day-banner { height: 180px; border-radius: 18px; overflow: hidden; margin-top: 12px; }
          .day-banner img { width: 100%; height: 100%; object-fit: cover; }
          .day-body { padding: 18px; }
          .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px; }
          .photo-grid img { width: 100%; height: 110px; object-fit: cover; border-radius: 14px; }
          .timeline { margin-top: 18px; }
          .bullet { display: flex; gap: 10px; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
          .dot { width: 10px; height: 10px; border-radius: 999px; background: #2563eb; margin-top: 6px; flex: 0 0 10px; }
          ul { margin: 8px 0 0 18px; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="cover">
            <img src="${coverImage}" alt="Egypt travel cover" />
            <div class="cover-content">
              <div class="eyebrow">Smart Travel • Egypt Journey</div>
              <div>
                <h1>Your Beautiful Egypt Itinerary</h1>
                <div class="subtitle">A polished trip summary with costs, destinations, photos, and daily highlights prepared for easy printing or saving as PDF.</div>
                <div class="stats">
                  <div class="stat"><div class="label">Total Cost</div><div class="value">${itinerary.totalCost.toLocaleString()} EGP</div></div>
                  <div class="stat"><div class="label">Budget</div><div class="value">${budget.toLocaleString()} EGP</div></div>
                  <div class="stat"><div class="label">Duration</div><div class="value">${itinerary.days.length} Days</div></div>
                  <div class="stat"><div class="label">Budget Used</div><div class="value">${budgetUtilization.toFixed(0)}%</div></div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <h2 class="section-title">Cost Breakdown</h2>
              <div class="row"><strong>Accommodation</strong><span>${itinerary.summary.accommodationTotal.toLocaleString()} EGP</span></div>
              <div class="row"><strong>Activities</strong><span>${itinerary.summary.activitiesTotal.toLocaleString()} EGP</span></div>
              <div class="row"><strong>Food & Dining</strong><span>${itinerary.summary.foodTotal.toLocaleString()} EGP</span></div>
              <div class="row"><strong>Transport</strong><span>${itinerary.summary.transportTotal.toLocaleString()} EGP</span></div>
            </div>

            <div class="card">
              <h2 class="section-title">Trip Snapshot</h2>
              <div class="row"><strong>Exported</strong><span class="muted">${new Date().toLocaleString()}</span></div>
              <div class="row"><strong>Travel Style</strong><span class="muted">Egypt Explorer</span></div>
              <div class="row"><strong>Format</strong><span class="muted">Print-ready PDF</span></div>
              <div class="pill-list">
                <span class="pill">Pyramids</span>
                <span class="pill">Nile</span>
                <span class="pill">Culture</span>
                <span class="pill">Adventure</span>
              </div>
            </div>
          </div>

          ${itinerary.days.map((day) => {
            const destinationPhotos = day.destinations.slice(0, 3).map((destination) => `<img src="${destination.imageUrl}" alt="${destination.name}" />`).join('');
            return `
              <div class="card day">
                <div class="day-head">
                  <div class="row"><h2 class="section-title">Day ${day.day}</h2><strong>${day.totalDayCost.toLocaleString()} EGP</strong></div>
                  <div class="muted">${day.accommodation.name} • ${day.accommodation.type}</div>
                  <div class="day-banner"><img src="${day.destinations[0]?.imageUrl || coverImage}" alt="Day ${day.day} feature" /></div>
                </div>
                <div class="day-body">
                  <div class="row"><strong>Accommodation</strong><span>${day.accommodation.cost.toLocaleString()} EGP</span></div>
                  <div class="row"><strong>Meals</strong><span>${day.meals.breakfast}, ${day.meals.lunch}, ${day.meals.dinner}</span></div>
                  <div class="timeline">
                    ${day.destinations.map((destination) => `
                      <div class="bullet">
                        <div class="dot"></div>
                        <div>
                          <div><strong>${destination.name}</strong> • ${destination.city}</div>
                          <div class="muted">${destination.time} • ${destination.cost.toLocaleString()} EGP • Rating ${destination.rating}</div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                  <div class="photo-grid">${destinationPhotos}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      window.alert('Please allow pop-ups to export PDF.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const shareItinerary = async () => {
    const shareText = `My Egyptian journey costs ${itinerary.totalCost.toLocaleString()} EGP over ${itinerary.days.length} days.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Smart Travel Itinerary',
          text: shareText,
        });
        return;
      }

      await navigator.clipboard.writeText(shareText);
      window.alert('Itinerary summary copied to clipboard');
    } catch (error) {
      console.error('Sharing failed:', error);
      window.alert('Sharing is unavailable on this browser.');
    }
  };

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 min-h-screen overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border-2 border-primary/20"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Your Perfect Egyptian Journey
                </h2>
              </div>
              <p className="text-muted-foreground">Tailored itinerary built around your preferences</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={exportItineraryPdf}
                className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={shareItinerary}
                className="px-6 py-3 bg-white border-2 border-primary/30 rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
            <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20">
              <div className="text-sm text-muted-foreground mb-1">Total Cost</div>
              <div className="text-2xl font-bold text-primary">
                {itinerary.totalCost.toLocaleString()} EGP
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl border-2 border-secondary/20">
              <div className="text-sm text-muted-foreground mb-1">Budget</div>
              <div className="text-2xl font-bold text-secondary">
                {budget.toLocaleString()} EGP
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border-2 border-accent/20">
              <div className="text-sm text-muted-foreground mb-1">Remaining</div>
              <div className="text-2xl font-bold text-accent">
                {(budget - itinerary.totalCost).toLocaleString()} EGP
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-tertiary/10 to-tertiary/5 rounded-xl border-2 border-tertiary/20">
              <div className="text-sm text-muted-foreground mb-1">Duration</div>
              <div className="text-2xl font-bold text-tertiary">
                {itinerary.days.length} Days
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-quaternary/10 to-quaternary/5 rounded-xl border-2 border-quaternary/20">
              <div className="text-sm text-muted-foreground mb-1">Budget Used</div>
              <div className="text-2xl font-bold text-quaternary">
                {budgetUtilization.toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Budget Breakdown */}
          <div className="mt-6 p-6 bg-gradient-to-br from-muted/50 to-transparent rounded-xl">
            <h3 className="mb-4">Cost Breakdown</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-muted-foreground">Accommodation</span>
                <span className="font-bold text-primary">
                  {itinerary.summary.accommodationTotal.toLocaleString()} EGP
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-muted-foreground">Activities</span>
                <span className="font-bold text-secondary">
                  {itinerary.summary.activitiesTotal.toLocaleString()} EGP
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-muted-foreground">Food & Dining</span>
                <span className="font-bold text-accent">
                  {itinerary.summary.foodTotal.toLocaleString()} EGP
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-muted-foreground">Transport</span>
                <span className="font-bold text-quaternary">
                  {itinerary.summary.transportTotal.toLocaleString()} EGP
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Daily Itinerary */}
        <div className="space-y-6">
          {itinerary.days.map((day, index) => (
            <motion.div
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              key={day.day}
              className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-all"
            >
              {/* Day Header */}
              <div className="bg-gradient-to-r from-primary via-secondary to-accent p-6">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6" />
                    <h3 className="text-2xl font-bold">Day {day.day}</h3>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-bold">{day.totalDayCost.toLocaleString()} EGP</span>
                  </div>
                </div>
              </div>

              {/* Destinations */}
              <div className="p-6 space-y-4">
                {day.destinations.map((destination, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col lg:flex-row gap-6 p-6 bg-gradient-to-br from-muted/30 to-transparent rounded-2xl hover:shadow-lg transition-all border border-border"
                  >
                    {/* Image */}
                    <div className="lg:w-48 h-48 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={destination.imageUrl}
                        alt={destination.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-xl font-bold text-foreground mb-1">
                            {destination.name}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-secondary" />
                              {destination.city}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-accent" />
                              {destination.time}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-primary fill-primary" />
                              {destination.rating}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {destination.cost.toLocaleString()} EGP
                          </div>
                          <div className="text-xs text-muted-foreground">per person</div>
                        </div>
                      </div>
                      <p className="text-muted-foreground">{destination.description}</p>
                    </div>
                  </div>
                ))}

                {/* Accommodation & Meals */}
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  {/* Accommodation */}
                  <div className="p-5 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl border border-secondary/20">
                    <h4 className="font-bold text-secondary mb-3">Accommodation</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">{day.accommodation.name}</span>
                        <span className="font-bold text-secondary">
                          {day.accommodation.cost.toLocaleString()} EGP
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">{day.accommodation.type}</div>
                    </div>
                  </div>

                  {/* Meals */}
                  <div className="p-5 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/20">
                    <h4 className="font-bold text-accent mb-3">Meals Included</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        <span>Breakfast: {day.meals.breakfast}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        <span>Lunch: {day.meals.lunch}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        <span>Dinner: {day.meals.dinner}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center gap-4 mt-12"
        >
          <button
            onClick={onBack}
            className="px-8 py-4 bg-white border-2 border-border rounded-xl hover:shadow-lg transition-all"
          >
            Plan Another Trip
          </button>
          <button
            onClick={onBookJourney}
            className="px-8 py-4 bg-gradient-to-r from-primary via-secondary to-accent text-white rounded-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            Book This Journey
          </button>
        </motion.div>
      </div>
    </section>
  );
}
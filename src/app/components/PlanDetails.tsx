import { X, Calendar, MapPin, Star, Check, DollarSign, Users, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { BuiltInPlan } from '../data/builtInPlans';

interface PlanDetailsProps {
  plan: BuiltInPlan;
  onClose: () => void;
  onBook: (plan: BuiltInPlan) => void;
}

export function PlanDetails({ plan, onClose, onBook }: PlanDetailsProps) {
  const categoryLabel = (plan.category || 'cultural').toUpperCase();
  const rating = plan.rating ?? 4.8;
  const reviews = plan.reviews ?? 120;
  const highlights = plan.highlights ?? [];
  const destinations = plan.destinations ?? [];
  const included = plan.included ?? [];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/55 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <div className="min-h-screen px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/30"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`${plan.name} details`}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Hero Image */}
          <div className="relative h-96">
            <img
              src={plan.image}
              alt={plan.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            
            {/* Title Overlay */}
            <div className="absolute bottom-8 left-8 right-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full mb-4 border border-white/40">
                <Star className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">{categoryLabel}</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-3">{plan.name}</h2>
              <p className="text-white/90 text-lg max-w-2xl">{plan.description}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Quick Info */}
            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border-2 border-primary/20">
                <Clock className="w-5 h-5 text-primary mb-2" />
                <div className="text-2xl font-bold text-primary">{plan.duration}</div>
                <div className="text-xs text-muted-foreground">Days</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl border-2 border-secondary/20">
                <MapPin className="w-5 h-5 text-secondary mb-2" />
                <div className="text-2xl font-bold text-secondary">{destinations.length}</div>
                <div className="text-xs text-muted-foreground">Destinations</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-quaternary/10 to-quaternary/5 rounded-2xl border-2 border-quaternary/20">
                <Star className="w-5 h-5 text-quaternary mb-2" />
                <div className="text-2xl font-bold text-quaternary">{rating}</div>
                <div className="text-xs text-muted-foreground">{reviews} Reviews</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl border-2 border-accent/20">
                <DollarSign className="w-5 h-5 text-accent mb-2" />
                <div className="text-2xl font-bold text-accent">{plan.price.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">EGP</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Highlights */}
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    Tour Highlights
                  </h3>
                  {highlights.length === 0 ? (
                    <div className="p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground">
                      Highlights are being finalized for this package.
                    </div>
                  ) : (
                  <div className="space-y-2">
                    {highlights.map((highlight, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl"
                      >
                        <div className="p-1 bg-primary rounded-lg mt-0.5">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm">{highlight}</span>
                      </div>
                    ))}
                  </div>
                  )}
                </div>

                {/* Destinations */}
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-secondary" />
                    Destinations Covered
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {destinations.map((dest, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-gradient-to-r from-secondary/10 to-secondary/5 border-2 border-secondary/20 rounded-xl text-sm font-medium"
                      >
                        {dest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* What's Included */}
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Check className="w-5 h-5 text-tertiary" />
                    What's Included
                  </h3>
                  {included.length === 0 ? (
                    <div className="p-4 bg-tertiary/5 rounded-xl border border-tertiary/20 text-sm text-muted-foreground">
                      Final inclusion list will be shared after booking confirmation.
                    </div>
                  ) : (
                  <div className="space-y-2">
                    {included.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-tertiary/5 rounded-xl border border-tertiary/20"
                      >
                        <Check className="w-5 h-5 text-tertiary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                  )}
                </div>

                {/* Pricing Card */}
                <div className="p-6 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl text-white">
                  <div className="text-sm opacity-90 mb-2">Starting from</div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-5xl font-bold">{plan.price.toLocaleString()}</span>
                    <span className="text-xl">EGP</span>
                  </div>
                  <div className="text-sm opacity-90 mb-6">per person</div>

                  <div className="flex items-center gap-2 text-sm bg-white/20 rounded-lg px-3 py-2 mb-4">
                    <Users className="w-4 h-4" />
                    Free cancellation up to 72 hours before departure
                  </div>
                  
                  <button
                    onClick={() => onBook(plan)}
                    className="w-full py-4 bg-white text-primary rounded-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    Book This Package
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

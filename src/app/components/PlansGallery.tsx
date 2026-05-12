import { Clock, DollarSign, Star, Users, MapPin, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { plansAPI } from '../../services/api';
import { BuiltInPlan } from '../data/builtInPlans';

interface PlansGalleryProps {
  onSelectPlan: (plan: BuiltInPlan) => void;
}

export function PlansGallery({ onSelectPlan }: PlansGalleryProps) {
  const [plans, setPlans] = useState<BuiltInPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | BuiltInPlan['category']>('all');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await plansAPI.getAll();
      // Transform API response to match component expectations
      const transformedPlans = response.data.plans.map((plan: any) => ({
        id: plan.id || plan._id,
        name: plan.name || 'Untitled Plan',
        description: plan.description || 'Discover an unforgettable travel experience.',
        price: Number(plan.price || plan.budget || plan.average_cost || 1200),
        duration: Number(plan.duration || 5),
        destinations: Array.isArray(plan.destinations) ? plan.destinations : [plan.destination || 'Egypt'],
        highlights: Array.isArray(plan.highlights) ? plan.highlights : [],
        ...plan,
        category: plan.category || 'cultural',
        rating: plan.average_rating || 4.8,
        reviews: 150,
        image: plan.image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3',
      }));
      setPlans(transformedPlans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plans');
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };
  const categoryColors = {
    budget: 'from-tertiary to-green-600',
    luxury: 'from-quaternary to-amber-600',
    adventure: 'from-accent to-rose-600',
    family: 'from-secondary to-purple-600',
    cultural: 'from-primary to-blue-600',
  };

  const categoryLabels = {
    budget: 'Budget Friendly',
    luxury: 'Luxury',
    adventure: 'Adventure',
    family: 'Family',
    cultural: 'Cultural',
  };

  const filteredPlans = plans.filter((plan) => {
    if (activeCategory === 'all') return true;
    return plan.category === activeCategory;
  });

  return (
    <section id="plans" className="py-16 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border-2 border-primary/20 mb-4">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Curated Travel Packages
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Pre-Designed Egypt Tours
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose from our expertly crafted travel packages or customize your own adventure
          </p>

          {!loading && !error && (
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 rounded-full text-sm border-2 transition-all ${
                  activeCategory === 'all'
                    ? 'bg-primary text-white border-primary shadow-lg'
                    : 'bg-white text-foreground border-primary/20 hover:border-primary/50'
                }`}
              >
                All Plans
              </button>
              {(Object.keys(categoryLabels) as BuiltInPlan['category'][]).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm border-2 transition-all ${
                    activeCategory === category
                      ? 'bg-gradient-to-r from-primary via-secondary to-accent text-white border-transparent shadow-lg'
                      : 'bg-white text-foreground border-primary/20 hover:border-primary/50'
                  }`}
                >
                  {categoryLabels[category]}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">Loading travel plans...</p>
            </div>
          )}

          {error && (
            <div className="col-span-full text-center py-12">
              <p className="text-red-500 text-lg">{error}</p>
              <button
                onClick={loadPlans}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && filteredPlans.map((plan, index) => (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              key={plan.id}
              className="group bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-border hover:border-primary/40 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={plan.image}
                  alt={plan.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                
                {/* Category Badge */}
                <div className="absolute top-4 right-4">
                  <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${categoryColors[plan.category]} text-white text-xs font-bold shadow-lg`}>
                    {categoryLabels[plan.category]}
                  </div>
                </div>

                {/* Rating */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Star className="w-4 h-4 text-quaternary fill-quaternary" />
                  <span className="font-bold">{plan.rating}</span>
                  <span className="text-xs text-muted-foreground">({plan.reviews})</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {plan.description}
                  </p>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{plan.duration} Days</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-secondary" />
                    <span>{plan.destinations.length} Cities</span>
                  </div>
                </div>

                {/* Highlights */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-muted-foreground uppercase">Top Highlights</div>
                  <div className="flex flex-wrap gap-1">
                    {(plan.highlights || []).slice(0, 3).map((highlight, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-lg"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price & CTA */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Starting from</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          {plan.price.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">EGP</span>
                      </div>
                      <div className="text-xs text-muted-foreground">per person</div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectPlan(plan)}
                    className="w-full py-3 bg-gradient-to-r from-primary via-secondary to-accent text-white rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {!loading && !error && filteredPlans.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">No plans found for this category yet.</p>
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Show All Plans
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

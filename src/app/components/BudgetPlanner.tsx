import { useState } from 'react';
import { motion } from 'motion/react';
import { DollarSign, Users, Calendar, Sparkles, Map, Utensils, Car } from 'lucide-react';
import { budgetAPI } from '../../services/api';

interface BudgetPlannerProps {
  onGeneratePlan: (data: PlanData) => void | Promise<void>;
}

export interface PlanData {
  budget: number;
  travelers: number;
  duration: number;
  interests: string[];
  budgetBreakdown?: any[];
  allocation?: any;
}

export function BudgetPlanner({ onGeneratePlan }: BudgetPlannerProps) {
  const [budget, setBudget] = useState(5000);
  const [travelers, setTravelers] = useState(2);
  const [duration, setDuration] = useState(5);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['history']);
  const [loading, setLoading] = useState(false);

  const interests = [
    { id: 'history', label: 'Historic Sites', icon: Map, color: 'from-primary to-blue-600' },
    { id: 'food', label: 'Local Cuisine', icon: Utensils, color: 'from-accent to-rose-600' },
    { id: 'adventure', label: 'Adventures', icon: Car, color: 'from-tertiary to-green-600' },
  ];

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let planPayload: PlanData = {
      budget,
      travelers,
      duration,
      interests: selectedInterests,
    };

    try {
      // Calculate budget from backend
      const budgetResponse = await budgetAPI.calculate(duration, budget, selectedInterests);

      // Pass plan data to parent component
      planPayload = {
        budget,
        travelers,
        duration,
        interests: selectedInterests,
        budgetBreakdown: budgetResponse.data.breakdown,
        allocation: budgetResponse.data.allocation,
      };
    } catch (error) {
      console.error('Error generating plan:', error);
    }

    try {
      await onGeneratePlan(planPayload);
    } catch (error) {
      console.error('Error finalizing plan generation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Plan Your Perfect Trip
            </span>
          </h2>
          <p className="text-muted-foreground">
            Tell us your preferences, and we will craft the perfect Egyptian adventure
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Budget Input */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gradient-to-br from-primary/5 to-accent/5 p-8 rounded-2xl border-2 border-primary/20 shadow-lg"
          >
            <label className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-primary" />
              <span>Budget (EGP)</span>
            </label>
            <input
              type="range"
              min="1000"
              max="50000"
              step="500"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-3 bg-gradient-to-r from-primary to-accent rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between mt-2">
              <span className="text-sm text-muted-foreground">1,000 EGP</span>
              <span className="text-xl font-bold text-primary">{budget.toLocaleString()} EGP</span>
              <span className="text-sm text-muted-foreground">50,000 EGP</span>
            </div>
          </motion.div>

          {/* Travelers and Duration */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Travelers */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-br from-secondary/5 to-tertiary/5 p-6 rounded-2xl border-2 border-secondary/20 shadow-lg"
            >
              <label className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-secondary" />
                <span>Number of Travelers</span>
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setTravelers(Math.max(1, travelers - 1))}
                  className="w-12 h-12 bg-secondary text-white rounded-xl hover:shadow-lg transition-all"
                >
                  -
                </button>
                <span className="text-3xl font-bold text-secondary flex-1 text-center">
                  {travelers}
                </span>
                <button
                  type="button"
                  onClick={() => setTravelers(Math.min(10, travelers + 1))}
                  className="w-12 h-12 bg-secondary text-white rounded-xl hover:shadow-lg transition-all"
                >
                  +
                </button>
              </div>
            </motion.div>

            {/* Duration */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gradient-to-br from-accent/5 to-primary/5 p-6 rounded-2xl border-2 border-accent/20 shadow-lg"
            >
              <label className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-accent" />
                <span>Trip Duration (Days)</span>
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setDuration(Math.max(1, duration - 1))}
                  className="w-12 h-12 bg-accent text-white rounded-xl hover:shadow-lg transition-all"
                >
                  -
                </button>
                <span className="text-3xl font-bold text-accent flex-1 text-center">
                  {duration}
                </span>
                <button
                  type="button"
                  onClick={() => setDuration(Math.min(30, duration + 1))}
                  className="w-12 h-12 bg-accent text-white rounded-xl hover:shadow-lg transition-all"
                >
                  +
                </button>
              </div>
            </motion.div>
          </div>

          {/* Interests */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <label className="mb-4 block">Select Your Interests</label>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {interests.map((interest) => {
                const Icon = interest.icon;
                const isSelected = selectedInterests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleInterest(interest.id)}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                      isSelected
                        ? `bg-gradient-to-br ${interest.color} text-white border-transparent shadow-xl`
                        : 'bg-white border-border hover:border-primary/30'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mb-2 mx-auto ${isSelected ? 'text-white' : 'text-primary'}`} />
                    <div className={`text-sm ${isSelected ? 'text-white' : 'text-foreground'}`}>
                      {interest.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.5 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary via-secondary to-accent text-white rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className={`w-5 h-5 ${loading ? '' : 'animate-pulse'}`} />
            {loading ? 'Building Your Plan...' : 'Generate Travel Plan'}
            <Sparkles className={`w-5 h-5 ${loading ? '' : 'animate-pulse'}`} />
          </motion.button>
        </form>
      </div>
    </section>
  );
}

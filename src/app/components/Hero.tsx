import { Sparkles, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  const featuredImages = [
    'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=600',
    'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=600',
    'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=600',
  ];

  return (
    <section id="explore" className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 py-20">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-xl border-2 border-primary/20"
            >
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-medium">
                Tailor-Made Travel Planning
              </span>
            </motion.div>

            {/* Main Heading */}
            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight"
              >
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Discover Egypt
                </span>
                <br />
                <span className="text-foreground">Your Way</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-xl text-muted-foreground max-w-xl"
              >
                Experience the magic of ancient pyramids, vibrant cities, and hidden treasures. 
                Let us craft your perfect Egyptian adventure based on your budget and dreams.
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <button
                onClick={onGetStarted}
                className="group px-8 py-4 bg-gradient-to-r from-primary via-secondary to-accent text-white rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-3 shadow-lg"
              >
                <Calendar className="w-5 h-5" />
                Start Planning Now
                <Sparkles className="w-4 h-4 animate-pulse" />
              </button>
              <button
                onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white border-2 border-primary/30 text-foreground rounded-2xl hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <MapPin className="w-5 h-5 text-secondary" />
                Browse Destinations
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6, staggerChildren: 0.1 }}
              className="grid grid-cols-3 gap-6 pt-4"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="space-y-1"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  50+
                </div>
                <div className="text-sm text-muted-foreground">Historic Sites</div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="space-y-1"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                  1000+
                </div>
                <div className="text-sm text-muted-foreground">Happy Travelers</div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="space-y-1"
              >
                <div className="flex items-center gap-1">
                  <div className="text-4xl font-bold bg-gradient-to-r from-accent to-tertiary bg-clip-text text-transparent">
                    4.9
                  </div>
                  <TrendingUp className="w-5 h-5 text-tertiary" />
                </div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Content - Image Grid */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Large Image */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="col-span-2 rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
              >
                <img
                  src={featuredImages[0]}
                  alt="Pyramids of Giza"
                  className="w-full h-80 object-cover"
                />
              </motion.div>
              {/* Two smaller images */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl overflow-hidden shadow-xl border-4 border-white"
              >
                <img
                  src={featuredImages[1]}
                  alt="Luxor Temple"
                  className="w-full h-56 object-cover"
                />
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl overflow-hidden shadow-xl border-4 border-white"
              >
                <img
                  src={featuredImages[2]}
                  alt="Abu Simbel"
                  className="w-full h-56 object-cover"
                />
              </motion.div>
            </div>

            {/* Floating Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-2xl p-6 border-2 border-primary/20 transform rotate-3 hover:rotate-0 transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-tertiary to-green-600 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-tertiary">Tailor Made</div>
                  <div className="text-sm text-muted-foreground">Smart Itineraries</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import { Calendar, MapPin, DollarSign, Trash2, Eye, Download, Heart, Bell, BadgeInfo, PlaneTakeoff } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import jsPDF from 'jspdf';

export interface SavedPlan {
  id: string;
  name: string;
  destination: string;
  duration: number;
  budget: number;
  createdAt: string;
  status: 'upcoming' | 'completed' | 'draft' | 'cancelled';
  image: string;
  description?: string;
  itinerary?: Array<Record<string, unknown>>;
  departureDate?: string;
  travelers?: number;
  notes?: string;
  bookingReference?: string;
  updatedAt?: string;
}

interface UserDashboardProps {
  userName: string;
  savedPlans: SavedPlan[];
  onViewPlan: (planId: string) => void;
  onDeletePlan: (planId: string) => void;
  onCreatePlan: () => void;
}

export function UserDashboard({ userName, savedPlans, onViewPlan, onDeletePlan, onCreatePlan }: UserDashboardProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'draft'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'budget-high' | 'budget-low'>('newest');
  const displayUserName = userName
    ? userName.charAt(0).toUpperCase() + userName.slice(1)
    : userName;

  const statusColors = {
    upcoming: 'from-primary to-blue-600',
    completed: 'from-tertiary to-green-600',
    draft: 'from-muted-foreground to-gray-600',
    cancelled: 'from-rose-500 to-red-600',
  };

  const statusLabels = {
    upcoming: 'Upcoming',
    completed: 'Completed',
    draft: 'Draft',
    cancelled: 'Cancelled',
  };

  const filteredPlans = savedPlans.filter((plan) => {
    if (activeFilter === 'all') return true;
    return plan.status === activeFilter;
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visiblePlans = filteredPlans
    .filter((plan) => {
      if (!normalizedSearch) return true;
      return `${plan.name} ${plan.destination}`.toLowerCase().includes(normalizedSearch);
    })
    .sort((a, b) => {
      if (sortBy === 'budget-high') return b.budget - a.budget;
      if (sortBy === 'budget-low') return a.budget - b.budget;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const downloadPlan = (plan: SavedPlan) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, fontSize: number, isBold: boolean = false) => {
      pdf.setFontSize(fontSize);
      if (isBold) {
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFont('helvetica', 'normal');
      }
      const lines = pdf.splitTextToSize(text, contentWidth);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 8;
      });
      return lines.length; // Return number of lines for spacing
    };

    // Title
    pdf.setFillColor(79, 70, 229); // Primary color
    pdf.rect(0, 0, pageWidth, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Travel Itinerary', margin, 25);
    
    yPosition = 50;
    pdf.setTextColor(0, 0, 0);

    // Trip Name
    addWrappedText(`Trip: ${plan.name}`, 16, true);
    yPosition += 5;

    // Destination
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);
    pdf.text('📍 Destination:', margin, yPosition);
    yPosition += 7;
    pdf.setTextColor(0, 0, 0);
    addWrappedText(plan.destination, 12);
    yPosition += 3;

    // Trip Details Section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(79, 70, 229);
    pdf.text('Trip Details', margin, yPosition);
    yPosition += 12;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);

    const details = [
      `Duration: ${plan.duration} days`,
      `Budget: $${plan.budget.toLocaleString()}`,
      `Travelers: ${plan.travelers || 1}`,
      `Status: ${plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}`,
      plan.departureDate ? `Departure Date: ${new Date(plan.departureDate).toLocaleDateString()}` : '',
    ].filter(Boolean);

    details.forEach((detail) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(detail, margin + 10, yPosition);
      yPosition += 7;
    });

    yPosition += 5;

    // Description
    if (plan.description) {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(79, 70, 229);
      pdf.text('Description', margin, yPosition);
      yPosition += 8;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      addWrappedText(plan.description, 11);
      yPosition += 5;
    }

    // Notes
    if (plan.notes) {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(79, 70, 229);
      pdf.text('Special Notes', margin, yPosition);
      yPosition += 8;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      addWrappedText(plan.notes, 11);
      yPosition += 5;
    }

    // Itinerary Items
    if (plan.itinerary && Array.isArray(plan.itinerary) && plan.itinerary.length > 0) {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(79, 70, 229);
      pdf.text('Detailed Itinerary', margin, yPosition);
      yPosition += 10;
      pdf.setTextColor(0, 0, 0);

      plan.itinerary.forEach((item: Record<string, unknown>, index: number) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        const day = item.day || `Day ${index + 1}`;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(`${day}`, margin + 5, yPosition);
        yPosition += 7;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const itemText = typeof item.activity === 'string' ? item.activity : JSON.stringify(item);
        addWrappedText(itemText, 10);
        yPosition += 3;
      });
    }

    // Footer
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, pageHeight - 10);
    pdf.text(`Booking Reference: ${plan.bookingReference || 'N/A'}`, pageWidth - margin - 60, pageHeight - 10);

    // Save the PDF
    pdf.save(`${plan.name.replace(/\s+/g, '-').toLowerCase()}-itinerary.pdf`);
  };

  const notifications = [
    ...savedPlans
      .filter((plan) => plan.status === 'upcoming' && plan.departureDate)
      .slice(0, 2)
      .map((plan) => ({
        id: `upcoming-${plan.id}`,
        title: `${plan.name} is booked`,
        message: `${plan.travelers || 2} traveler(s) leaving on ${new Date(plan.departureDate as string).toLocaleDateString()}`,
        tone: 'booked',
      })),
    ...savedPlans
      .filter((plan) => plan.status === 'draft')
      .slice(0, 2)
      .map((plan) => ({
        id: `draft-${plan.id}`,
        title: `${plan.name} is still a draft`,
        message: 'Open it to add dates or convert it into a confirmed booking.',
        tone: 'draft',
      })),
  ];

  const formatHistoryDate = (value?: string) => {
    if (!value) return 'Not set';
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-4xl font-bold mb-2">
            Welcome back, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{displayUserName}</span>!
          </h2>
          <p className="text-muted-foreground">Manage your travel plans and explore new destinations</p>
        </motion.div>

        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mb-10 rounded-3xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold">Travel Notifications</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-2xl border p-4 shadow-sm ${notification.tone === 'booked' ? 'bg-white border-primary/20' : 'bg-white/70 border-amber-200'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${notification.tone === 'booked' ? 'bg-primary/10' : 'bg-amber-100'}`}>
                      {notification.tone === 'booked' ? (
                        <PlaneTakeoff className="w-4 h-4 text-primary" />
                      ) : (
                        <BadgeInfo className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{notification.title}</div>
                      <div className="text-sm text-muted-foreground">{notification.message}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1, staggerChildren: 0.1 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border-2 border-primary/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-muted-foreground">Total Trips</span>
            </div>
            <div className="text-3xl font-bold text-primary">{savedPlans.length}</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl border-2 border-secondary/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-secondary rounded-lg">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-muted-foreground">Destinations</span>
            </div>
            <div className="text-3xl font-bold text-secondary">
              {new Set(savedPlans.map(p => p.destination)).size}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl border-2 border-accent/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-accent rounded-lg">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-muted-foreground">Upcoming</span>
            </div>
            <div className="text-3xl font-bold text-accent">
              {savedPlans.filter(p => p.status === 'upcoming').length}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-6 bg-gradient-to-br from-tertiary/10 to-tertiary/5 rounded-2xl border-2 border-tertiary/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-tertiary rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-muted-foreground">Total Budget</span>
            </div>
            <div className="text-3xl font-bold text-tertiary">
              {savedPlans.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}
            </div>
          </motion.div>
        </motion.div>

        {/* Saved Plans */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">My Travel Plans</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg transition-all text-sm ${activeFilter === 'all' ? 'bg-muted' : 'hover:bg-muted'}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('upcoming')}
                className={`px-4 py-2 rounded-lg transition-all text-sm ${activeFilter === 'upcoming' ? 'bg-muted' : 'hover:bg-muted'}`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setActiveFilter('draft')}
                className={`px-4 py-2 rounded-lg transition-all text-sm ${activeFilter === 'draft' ? 'bg-muted' : 'hover:bg-muted'}`}
              >
                Drafts
              </button>
            </div>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by trip name or destination..."
              className="w-full rounded-xl border border-border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as 'newest' | 'budget-high' | 'budget-low')}
              className="rounded-xl border border-border px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="newest">Sort: Newest</option>
              <option value="budget-high">Sort: Highest Budget</option>
              <option value="budget-low">Sort: Lowest Budget</option>
            </select>
          </div>

          {visiblePlans.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-center py-16 bg-gradient-to-br from-muted/30 to-transparent rounded-3xl border-2 border-dashed border-border"
            >
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No matching plans found</h3>
              <p className="text-muted-foreground mb-6">
                {savedPlans.length === 0
                  ? 'Start planning your Egyptian adventure today!'
                  : 'Try a different search term or filter.'}
              </p>
              <button
                onClick={onCreatePlan}
                className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl hover:shadow-lg transition-all"
              >
                {savedPlans.length === 0 ? 'Create Your First Plan' : 'Create New Plan'}
              </button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visiblePlans.map((plan, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  key={plan.id}
                  className="group bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-border hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={plan.image}
                      alt={plan.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${statusColors[plan.status]} text-white text-xs font-bold shadow-lg`}>
                        {statusLabels[plan.status]}
                      </div>
                    </div>

                    {/* Title on Image */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h4 className="text-white font-bold text-lg drop-shadow-lg">
                        {plan.name}
                      </h4>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-primary" />
                        {plan.destination}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-secondary" />
                        {plan.duration} days
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">
                        {plan.budget.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">EGP</span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Created on {new Date(plan.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>

                    {plan.bookingReference && (
                      <div className="text-xs text-muted-foreground">
                        Booking Ref: {plan.bookingReference}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() => onViewPlan(plan.id)}
                        className="flex-1 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => downloadPlan(plan)}
                        className="p-2 bg-muted rounded-lg hover:bg-muted/80 transition-all"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeletePlan(plan.id)}
                        className="p-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

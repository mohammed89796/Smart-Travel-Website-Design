import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { BudgetPlanner, PlanData } from './components/BudgetPlanner';
import { ItineraryDisplay, Itinerary } from './components/ItineraryDisplay';
import { PlansGallery } from './components/PlansGallery';
import { UserDashboard, SavedPlan } from './components/UserDashboard';
import { AuthModal } from './components/AuthModal';
import { PlanDetails } from './components/PlanDetails';
import { AdminDashboard } from './components/AdminDashboard';
import { generateItinerary } from './utils/aiItineraryGenerator';
import { BuiltInPlan } from './data/builtInPlans';
import { aiAPI, authAPI, clearUserData, savedPlansAPI } from '../services/api';
import { CalendarDays, MapPin, Users, BadgeCheck, Sparkles } from 'lucide-react';

type AppView = 'home' | 'planning' | 'itinerary' | 'dashboard' | 'admin';

type PendingBooking =
  | { type: 'built-in'; plan: BuiltInPlan }
  | { type: 'generated'; planData: PlanData; itinerary: Itinerary };

type BookingDetails = {
  departureDate: string;
  travelers: number;
  notes: string;
};

type EditableSavedPlan = {
  name: string;
  destination: string;
  duration: number;
  budget: number;
  status: SavedPlan['status'];
  departureDate: string;
  travelers: number;
  notes: string;
};

const capitalizeName = (name: string) => {
  const trimmedName = (name ?? '').trim();
  if (!trimmedName) return '';
  return trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1);
};

const createBookingReference = () => `ST-${Date.now().toString().slice(-8)}`;
const BOOKING_DEBUG = import.meta.env.DEV || import.meta.env.VITE_BOOKING_DEBUG === 'true';

const getTripShowcasePhotos = (plan: SavedPlan) => [
  plan.image,
  'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200',
  'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=1200',
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [_userEmail, setUserEmail] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  const [generatedItinerary, setGeneratedItinerary] = useState<Itinerary | null>(null);
  const [currentPlanData, setCurrentPlanData] = useState<PlanData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<BuiltInPlan | null>(null);
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    departureDate: '',
    travelers: 2,
    notes: '',
  });
  const [activeSavedPlan, setActiveSavedPlan] = useState<SavedPlan | null>(null);
  const [isEditingSavedPlan, setIsEditingSavedPlan] = useState(false);
  const [editableSavedPlan, setEditableSavedPlan] = useState<EditableSavedPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [_loading, setLoading] = useState(true);

  // Check authentication and load saved plans on mount
  useEffect(() => {
    checkAuthAndLoadPlans();
  }, []);

  // Sync URL with current view
  useEffect(() => {
    const pathname = location.pathname;
    
    if (pathname === '/dashboard') {
      setCurrentView('dashboard');
    } else if (pathname === '/planning') {
      setCurrentView('planning');
    } else if (pathname === '/itinerary') {
      setCurrentView('itinerary');
    } else {
      setCurrentView('home');
    }
  }, [location.pathname]);

  // Sync current view with URL
  useEffect(() => {
    const pathMap: Record<AppView, string> = {
      'home': '/',
      'planning': '/planning',
      'itinerary': '/itinerary',
      'dashboard': '/dashboard',
      'admin': '/', // Admin view is only accessible through login, not URL
    };

    const targetPath = pathMap[currentView];
    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: true });
    }
  }, [currentView, navigate, location.pathname]);

  useEffect(() => {
    if (currentView === 'admin' && !isAdminAuthenticated) {
      setCurrentView('home');
    }
  }, [currentView, isAdminAuthenticated]);

  const checkAuthAndLoadPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Verify token is still valid
        const response = await authAPI.getMe();
        setIsAuthenticated(true);
        setUserName(capitalizeName(response.data.user.name));
        setUserEmail(response.data.user.email);

        // Load saved plans
        await loadSavedPlans();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token
      setIsAuthenticated(false);
      setUserName('');
      setUserEmail('');
      clearUserData();
    } finally {
      setLoading(false);
    }
  };

  const loadSavedPlans = async () => {
    try {
      const response = await savedPlansAPI.getAll();
      setSavedPlans(response.data.plans);
    } catch (error) {
      console.error('Failed to load saved plans:', error);
    }
  };

  const navigateToHomeSection = (sectionId: 'explore' | 'plans' | 'about') => {
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const saveTrip = async (planData: Parameters<typeof savedPlansAPI.create>[0]) => {
    const response = await savedPlansAPI.create(planData);

    setSavedPlans(prev => [response.data.plan, ...prev]);
    return response.data.plan;
  };

  const saveBuiltInJourney = async (plan: BuiltInPlan, details?: BookingDetails) => {
    return saveTrip({
      name: plan.name,
      destination: plan.destinations.join(', '),
      duration: plan.duration,
      budget: plan.price,
      status: 'upcoming',
      image: plan.image,
      description: plan.description,
      departureDate: details?.departureDate,
      travelers: details?.travelers,
      notes: details?.notes,
      bookingReference: details?.departureDate ? createBookingReference() : undefined,
      itinerary: plan.highlights.map((highlight, index) => ({
        day: index + 1,
        title: highlight,
      })),
    });
  };

  const saveGeneratedJourney = async (planData: PlanData, itinerary: Itinerary, details?: BookingDetails) => {
    return saveTrip({
      name: `Egypt Tour ${planData.duration} Days`,
      destination: 'Multiple Cities',
      duration: planData.duration,
      budget: planData.budget,
      status: 'upcoming',
      image: 'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=800',
      description: 'Tailored itinerary built around your budget and interests.',
      departureDate: details?.departureDate,
      travelers: details?.travelers,
      notes: details?.notes,
      bookingReference: details?.departureDate ? createBookingReference() : undefined,
      itinerary: itinerary.days.map((day) => ({
        day: day.day,
        title: `Day ${day.day}`,
        destinations: day.destinations.map((destination) => ({
          name: destination.name,
          city: destination.city,
          time: destination.time,
        })),
        accommodation: day.accommodation.name,
        meals: day.meals,
        totalDayCost: day.totalDayCost,
      })),
    });
  };

  const handleAuthClick = () => {
    if (isAuthenticated) {
      // Logout
      setIsAuthenticated(false);
      setUserName('');
      setUserEmail('');
      setIsAdminAuthenticated(false);
      setAdminData(null);
      setCurrentView('home');
      clearUserData();
      localStorage.removeItem('adminToken');
    } else {
      // Open login modal
      setIsAuthModalOpen(true);
    }
  };

  const handleAuth = (payload: {
    accountType: 'user' | 'admin';
    token: string;
    user?: { name: string; email: string };
    admin?: any;
  }) => {
    setIsAuthModalOpen(false);

    if (payload.accountType === 'admin' && payload.admin) {
      setIsAuthenticated(false);
      setUserName('');
      setUserEmail('');
      clearUserData();

      setIsAdminAuthenticated(true);
      setAdminData(payload.admin);
      localStorage.setItem('adminToken', payload.token);
      setCurrentView('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!payload.user) {
      return;
    }

    setIsAuthenticated(true);
    setIsAdminAuthenticated(false);
    setAdminData(null);
    localStorage.removeItem('adminToken');
    setUserName(capitalizeName(payload.user.name));
    setUserEmail(payload.user.email);

    const bookingToComplete = pendingBooking;

    if (bookingToComplete) {
      setIsBookingModalOpen(true);
      return;
    }

    loadSavedPlans();
  };

  const handleDashboardClick = () => {
    setCurrentView('dashboard');
    loadSavedPlans();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHomeClick = () => {
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const handleGetStarted = () => {
    setCurrentView('planning');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleGeneratePlan = async (planData: PlanData) => {
    setCurrentPlanData(planData);

    let itinerary: Itinerary;

    try {
      const response = await aiAPI.generateItinerary({
        budget: planData.budget,
        travelers: planData.travelers,
        duration: planData.duration,
        interests: planData.interests,
      });

      const responseItinerary = response?.data?.itinerary ?? response?.data;
      if (!responseItinerary?.days?.length) {
        throw new Error('Invalid itinerary response from the planning service');
      }

      itinerary = responseItinerary as Itinerary;
    } catch (error) {
      console.error('Itinerary generation failed, using fallback:', error);
      itinerary = generateItinerary(planData);
    }

    setGeneratedItinerary(itinerary);
    setCurrentView('itinerary');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Auto-save generated plan as draft to backend if authenticated
    if (isAuthenticated) {
      saveTrip({
        name: `Egypt Tour ${planData.duration} Days`,
        destination: 'Multiple Cities',
        duration: planData.duration,
        budget: planData.budget,
        status: 'draft',
        image: 'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=800',
        description: 'Draft trip plan. Review then book when ready.',
        itinerary: itinerary.days.map((day) => ({
          day: day.day,
          title: `Day ${day.day}`,
        })),
      }).catch((error) => {
        console.error('Failed to auto-save generated draft:', error);
      });
    }
  };

  const handleBackToPlanning = () => {
    setCurrentView('planning');
    setGeneratedItinerary(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookGeneratedJourney = async () => {
    if (!currentPlanData || !generatedItinerary) {
      return;
    }

    if (!isAuthenticated) {
      setPendingBooking({
        type: 'generated',
        planData: currentPlanData,
        itinerary: generatedItinerary,
      });
      setIsAuthModalOpen(true);
      return;
    }

    setPendingBooking({
      type: 'generated',
      planData: currentPlanData,
      itinerary: generatedItinerary,
    });
    setIsBookingModalOpen(true);
  };

  const handleSelectPlan = (plan: BuiltInPlan) => {
    setSelectedPlan(plan);
  };

  const handleBookPlan = async (plan: BuiltInPlan) => {
    if (!isAuthenticated) {
      setPendingBooking({ type: 'built-in', plan });
      setSelectedPlan(null);
      setIsAuthModalOpen(true);
      return;
    }

    setPendingBooking({ type: 'built-in', plan });
    setSelectedPlan(null);
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!pendingBooking || !bookingDetails.departureDate) {
      return;
    }

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (BOOKING_DEBUG) {
      console.log('[BOOKING_DEBUG] confirm:start', {
        pendingType: pendingBooking.type,
        hasDepartureDate: Boolean(bookingDetails.departureDate),
        hasToken: Boolean(token),
        isAuthenticated,
        bookingDetails,
      });
    }

    if (!isAuthenticated || !token) {
      if (BOOKING_DEBUG) {
        console.warn('[BOOKING_DEBUG] confirm:blocked:not-authenticated', {
          hasToken: Boolean(token),
          isAuthenticated,
        });
      }
      setIsAuthenticated(false);
      clearUserData();
      setBookingError('Please log in to confirm your booking');
      setIsAuthModalOpen(true);
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const persistBooking = async () => {
        return pendingBooking.type === 'built-in'
          ? saveBuiltInJourney(pendingBooking.plan, bookingDetails)
          : saveGeneratedJourney(pendingBooking.planData, pendingBooking.itinerary, bookingDetails);
      };

      let saved;
      try {
        saved = await persistBooking();
      } catch (firstError) {
        const firstStatus = (firstError as any)?.status;
        if (BOOKING_DEBUG) {
          console.warn('[BOOKING_DEBUG] confirm:first-attempt-failed', {
            status: firstStatus,
            message: (firstError as any)?.message,
            data: (firstError as any)?.data,
          });
        }
        if (firstStatus !== 401) {
          throw firstError;
        }

        // If session is still valid, retry once to recover from transient auth mismatch.
        await authAPI.getMe();
        if (BOOKING_DEBUG) {
          console.log('[BOOKING_DEBUG] confirm:retry-after-auth-me');
        }
        saved = await persistBooking();
      }

      // Ensure dashboard reflects canonical backend state immediately after booking.
      await loadSavedPlans();

      setPendingBooking(null);
      setIsBookingModalOpen(false);
      setBookingDetails({ departureDate: '', travelers: 2, notes: '' });
      setCurrentView('dashboard');
      if (BOOKING_DEBUG) {
        console.log('[BOOKING_DEBUG] confirm:success', {
          savedPlanId: saved?.id,
          bookingReference: saved?.bookingReference,
        });
      }
    } catch (error) {
      const status = (error as any)?.status;
      if (BOOKING_DEBUG) {
        console.error('[BOOKING_DEBUG] confirm:catch', {
          status,
          message: (error as any)?.message,
          data: (error as any)?.data,
        });
      }

      if (status === 401) {
        try {
          // If /auth/me still works, do not force logout; show actionable backend reason instead.
          await authAPI.getMe();
          if (BOOKING_DEBUG) {
            console.warn('[BOOKING_DEBUG] confirm:401-but-auth-me-ok');
          }
          const apiMessage =
            (error as any)?.data?.message ||
            'Booking authorization failed. Please try again in a moment.';
          setBookingError(apiMessage);
        } catch {
          if (BOOKING_DEBUG) {
            console.error('[BOOKING_DEBUG] confirm:401-auth-me-failed:forcing-logout');
          }
          setIsAuthenticated(false);
          clearUserData();
          setBookingError('Your session has expired. Please log in again to confirm your booking.');
          setIsAuthModalOpen(true);
        }
        return;
      }

      const apiMessage = (error as any)?.data?.message;
      const errorMessage = apiMessage || (error instanceof Error ? error.message : 'Failed to confirm booking. Please try again.');
      setBookingError(errorMessage);
      console.error('Failed to confirm booking:', error);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleViewPlan = async (planId: string) => {
    try {
      const response = await savedPlansAPI.getById(planId);
      setActiveSavedPlan(response.data.plan);
      setIsEditingSavedPlan(false);
      setEditableSavedPlan(null);
    } catch (error) {
      const fallbackPlan = savedPlans.find(plan => plan.id === planId) ?? null;
      setActiveSavedPlan(fallbackPlan);
      setIsEditingSavedPlan(false);
      setEditableSavedPlan(null);
      console.error('View plan failed, using local fallback:', error);
    }
  };

  const handleStartEditSavedPlan = () => {
    if (!activeSavedPlan) return;

    setEditableSavedPlan({
      name: activeSavedPlan.name,
      destination: activeSavedPlan.destination,
      duration: activeSavedPlan.duration,
      budget: activeSavedPlan.budget,
      status: activeSavedPlan.status,
      departureDate: activeSavedPlan.departureDate || '',
      travelers: activeSavedPlan.travelers || 2,
      notes: activeSavedPlan.notes || '',
    });
    setIsEditingSavedPlan(true);
  };

  const handleSaveEditedPlan = async () => {
    if (!activeSavedPlan || !editableSavedPlan) return;

    try {
      const response = await savedPlansAPI.update(activeSavedPlan.id, {
        ...editableSavedPlan,
      });

      const updatedPlan = response.data.plan as SavedPlan;
      setSavedPlans((prev) => prev.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan)));
      setActiveSavedPlan(updatedPlan);
      setIsEditingSavedPlan(false);
      setEditableSavedPlan(null);
    } catch (error) {
      console.error('Failed to update plan:', error);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    const shouldDelete = window.confirm('Are you sure you want to delete this trip?');
    if (!shouldDelete) {
      return;
    }

    try {
      await savedPlansAPI.delete(planId);
      setSavedPlans(prev => prev.filter(p => p.id !== planId));
      setActiveSavedPlan(prev => (prev?.id === planId ? null : prev));
      setIsEditingSavedPlan(false);
      setEditableSavedPlan(null);
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
  };

  const handleCreateFirstPlan = () => {
    setCurrentView('planning');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminData(null);
    localStorage.removeItem('adminToken');
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <Header 
        onAuthClick={handleAuthClick}
        onDashboardClick={handleDashboardClick}
        onNavigateToSection={navigateToHomeSection}
        onHomeClick={handleHomeClick}
        isAuthenticated={isAuthenticated}
        userName={userName}
      />

      {currentView === 'home' && (
        <>
          <Hero onGetStarted={handleGetStarted} />
          <PlansGallery onSelectPlan={handleSelectPlan} />
          <BudgetPlanner onGeneratePlan={handleGeneratePlan} />
        </>
      )}

      {currentView === 'planning' && (
        <>
          <div className="py-8 bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <button
                onClick={() => setCurrentView('home')}
                className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
              >
                ← Back to Home
              </button>
            </div>
          </div>
          <BudgetPlanner onGeneratePlan={handleGeneratePlan} />
        </>
      )}

      {currentView === 'itinerary' && generatedItinerary && currentPlanData && (
        <ItineraryDisplay 
          itinerary={generatedItinerary}
          budget={currentPlanData.budget}
          onBack={handleBackToPlanning}
          onBookJourney={handleBookGeneratedJourney}
        />
      )}

      {currentView === 'dashboard' && isAuthenticated && (
        <UserDashboard
          userName={userName}
          savedPlans={savedPlans}
          onViewPlan={handleViewPlan}
          onDeletePlan={handleDeletePlan}
          onCreatePlan={handleCreateFirstPlan}
        />
      )}

      {currentView === 'admin' && isAdminAuthenticated && adminData && (
        <AdminDashboard admin={adminData} onLogout={handleAdminLogout} />
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuth={handleAuth}
      />

      {isBookingModalOpen && pendingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6">
            <h3 className="text-2xl font-bold mb-2">Confirm Your Booking</h3>
            <p className="text-muted-foreground mb-6">Choose departure details before finalizing your trip.</p>

            {bookingError && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm mb-4">
                {bookingError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Departure Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDetails.departureDate}
                  onChange={(event) => setBookingDetails((prev) => ({ ...prev, departureDate: event.target.value }))}
                  disabled={bookingLoading}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl disabled:opacity-50"
                />
                {!bookingDetails.departureDate && (
                  <p className="text-red-500 text-sm mt-1">âš ï¸ Departure date is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Number of Travelers <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={bookingDetails.travelers}
                  onChange={(event) => setBookingDetails((prev) => ({ ...prev, travelers: Math.min(20, Math.max(1, Number(event.target.value) || 1)) }))}
                  disabled={bookingLoading}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl disabled:opacity-50"
                />
                <p className="text-gray-500 text-xs mt-1">Max 20 travelers per booking</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Special Notes (optional)</label>
                <textarea
                  value={bookingDetails.notes}
                  onChange={(event) => setBookingDetails((prev) => ({ ...prev, notes: event.target.value }))}
                  disabled={bookingLoading}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl disabled:opacity-50"
                  placeholder="Any dietary needs, room preferences, or requests..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsBookingModalOpen(false);
                  setPendingBooking(null);
                  setBookingError('');
                }}
                disabled={bookingLoading}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={!bookingDetails.departureDate || bookingLoading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {bookingLoading ? 'Confirming...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPlan && (
        <PlanDetails
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onBook={handleBookPlan}
        />
      )}

      {activeSavedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-5xl rounded-[2rem] bg-white shadow-2xl overflow-hidden border border-white/40">
            <div className="relative h-72 bg-gradient-to-br from-primary via-secondary to-accent">
              <img
                src={activeSavedPlan.image}
                alt={activeSavedPlan.name}
                className="absolute inset-0 h-full w-full object-cover opacity-35"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between text-white">
                <div className="flex justify-between items-start gap-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
                    <BadgeCheck className="w-4 h-4" />
                    <span className="text-sm font-medium capitalize">{activeSavedPlan.status}</span>
                  </div>
                  <button
                    onClick={() => setActiveSavedPlan(null)}
                    className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur-sm hover:bg-white/25 transition-all"
                  >
                    Close
                  </button>
                </div>

                <div className="max-w-3xl space-y-3">
                  <h3 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-lg">{activeSavedPlan.name}</h3>
                  <p className="text-white/90 max-w-2xl text-base md:text-lg">
                    {activeSavedPlan.description || 'A curated Egypt trip designed for comfort, discovery, and a smoother travel experience.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 p-3">
                    <div className="text-xs uppercase tracking-wide text-white/70">Destination</div>
                    <div className="font-semibold flex items-center gap-2 mt-1"><MapPin className="w-4 h-4" /> {activeSavedPlan.destination}</div>
                  </div>
                  <div className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 p-3">
                    <div className="text-xs uppercase tracking-wide text-white/70">Travelers</div>
                    <div className="font-semibold flex items-center gap-2 mt-1"><Users className="w-4 h-4" /> {activeSavedPlan.travelers || 2}</div>
                  </div>
                  <div className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 p-3">
                    <div className="text-xs uppercase tracking-wide text-white/70">Budget</div>
                    <div className="font-semibold flex items-center gap-2 mt-1">{activeSavedPlan.budget.toLocaleString()} EGP</div>
                  </div>
                  <div className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 p-3">
                    <div className="text-xs uppercase tracking-wide text-white/70">Departure</div>
                    <div className="font-semibold flex items-center gap-2 mt-1"><CalendarDays className="w-4 h-4" /> {activeSavedPlan.departureDate ? new Date(activeSavedPlan.departureDate).toLocaleDateString() : 'Not set'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-gradient-to-br from-white via-slate-50 to-white">
              <div className="grid lg:grid-cols-[1.35fr_0.9fr] gap-8 items-start">
                <div className="space-y-6">
                {isEditingSavedPlan && editableSavedPlan ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                      <div className="text-sm text-muted-foreground mb-1">Trip Name</div>
                      <input
                        value={editableSavedPlan.name}
                        onChange={(event) => setEditableSavedPlan((prev) => prev ? { ...prev, name: event.target.value } : prev)}
                        className="w-full px-4 py-3 border-2 border-primary/20 rounded-2xl bg-white shadow-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Destination</div>
                      <input
                        value={editableSavedPlan.destination}
                        onChange={(event) => setEditableSavedPlan((prev) => prev ? { ...prev, destination: event.target.value } : prev)}
                        className="w-full px-4 py-3 border-2 border-primary/20 rounded-2xl bg-white shadow-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Duration</div>
                        <input
                          type="number"
                          min={1}
                          value={editableSavedPlan.duration}
                          onChange={(event) => setEditableSavedPlan((prev) => prev ? { ...prev, duration: Number(event.target.value) || 1 } : prev)}
                          className="w-full px-4 py-3 border-2 border-primary/20 rounded-2xl bg-white shadow-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Travelers</div>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={editableSavedPlan.travelers}
                          onChange={(event) => setEditableSavedPlan((prev) => prev ? { ...prev, travelers: Number(event.target.value) || 1 } : prev)}
                          className="w-full px-4 py-3 border-2 border-primary/20 rounded-2xl bg-white shadow-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Budget (EGP)</div>
                      <input
                        type="number"
                        min={100}
                        value={editableSavedPlan.budget}
                        onChange={(event) => setEditableSavedPlan((prev) => prev ? { ...prev, budget: Number(event.target.value) || 100 } : prev)}
                        className="w-full px-4 py-3 border-2 border-primary/20 rounded-2xl bg-white shadow-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Departure Date</div>
                        <input
                          type="date"
                          value={editableSavedPlan.departureDate}
                          onChange={(event) => setEditableSavedPlan((prev) => prev ? { ...prev, departureDate: event.target.value } : prev)}
                          className="w-full px-4 py-3 border-2 border-primary/20 rounded-2xl bg-white shadow-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Status</div>
                        <select
                          value={editableSavedPlan.status}
                          onChange={(event) => setEditableSavedPlan((prev) => prev ? { ...prev, status: event.target.value as SavedPlan['status'] } : prev)}
                          className="w-full px-4 py-3 border-2 border-primary/20 rounded-2xl bg-white shadow-sm focus:border-primary focus:outline-none"
                        >
                          <option value="draft">Draft</option>
                          <option value="upcoming">Upcoming</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Notes</div>
                      <textarea
                        rows={3}
                        value={editableSavedPlan.notes}
                        onChange={(event) => setEditableSavedPlan((prev) => prev ? { ...prev, notes: event.target.value } : prev)}
                        className="w-full px-4 py-3 border-2 border-primary/20 rounded-2xl bg-white shadow-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Destination</div>
                      <div className="mt-1 font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {activeSavedPlan.destination}</div>
                    </div>
                    <div className="rounded-2xl border border-secondary/15 bg-secondary/5 p-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Duration</div>
                      <div className="mt-1 font-semibold flex items-center gap-2"><CalendarDays className="w-4 h-4 text-secondary" /> {activeSavedPlan.duration} days</div>
                    </div>
                    <div className="rounded-2xl border border-accent/15 bg-accent/5 p-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Budget</div>
                      <div className="mt-1 font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" /> {activeSavedPlan.budget.toLocaleString()} EGP</div>
                    </div>
                    <div className="rounded-2xl border border-tertiary/15 bg-tertiary/5 p-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Travelers</div>
                      <div className="mt-1 font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-tertiary" /> {activeSavedPlan.travelers || 2}</div>
                    </div>
                    <div className="rounded-2xl border border-primary/15 bg-white p-4 sm:col-span-2">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Notes</div>
                      <div className="mt-1 text-sm text-foreground/80">{activeSavedPlan.notes || 'No notes added.'}</div>
                    </div>
                    {activeSavedPlan.bookingReference && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:col-span-2">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Booking Reference</div>
                        <div className="mt-1 font-semibold text-emerald-700">{activeSavedPlan.bookingReference}</div>
                      </div>
                    )}
                    {activeSavedPlan.departureDate && (
                      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 sm:col-span-2">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Departure Date</div>
                        <div className="mt-1 font-semibold">{new Date(activeSavedPlan.departureDate).toLocaleDateString()}</div>
                      </div>
                    )}
                    {activeSavedPlan.description && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Description</div>
                        <div className="mt-1 text-sm text-foreground/80">{activeSavedPlan.description}</div>
                      </div>
                    )}
                  </div>
                )}
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl overflow-hidden border border-border shadow-lg">
                    <div className="grid grid-cols-3 gap-1 bg-white">
                      {getTripShowcasePhotos(activeSavedPlan).map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`${activeSavedPlan.name} photo ${index + 1}`}
                          className={`h-36 w-full object-cover ${index === 0 ? 'col-span-3 md:col-span-1 md:h-52' : 'hidden md:block md:h-52'}`}
                        />
                      ))}
                    </div>
                  </div>

                  {Array.isArray(activeSavedPlan.itinerary) && activeSavedPlan.itinerary.length > 0 && (
                    <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
                      <h4 className="font-bold mb-4">Trip Itinerary</h4>
                      <div className="space-y-3">
                        {activeSavedPlan.itinerary.map((day: any, index: number) => (
                          <div key={index} className="rounded-2xl border border-border p-4 bg-gradient-to-r from-slate-50 to-white">
                            <div className="font-semibold">Day {day.day ?? index + 1}</div>
                            <div className="text-sm text-muted-foreground">{day.title ?? 'Trip activity'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isEditingSavedPlan && (
                    <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
                      <h4 className="font-bold mb-4">Booking History</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                          <div className="mt-1 h-3 w-3 rounded-full bg-primary"></div>
                          <div>
                            <div className="font-semibold">Trip created</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(activeSavedPlan.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {activeSavedPlan.bookingReference && (
                          <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                            <div className="mt-1 h-3 w-3 rounded-full bg-secondary"></div>
                            <div>
                              <div className="font-semibold">Booking confirmed</div>
                              <div className="text-sm text-muted-foreground">
                                Reference {activeSavedPlan.bookingReference}
                                {activeSavedPlan.departureDate ? ` â€¢ Departure ${new Date(activeSavedPlan.departureDate).toLocaleDateString()}` : ''}
                              </div>
                            </div>
                          </div>
                        )}

                        {activeSavedPlan.updatedAt && (
                          <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                            <div className="mt-1 h-3 w-3 rounded-full bg-accent"></div>
                            <div>
                              <div className="font-semibold">Last updated</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(activeSavedPlan.updatedAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        )}

                        {activeSavedPlan.status === 'completed' && (
                          <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                            <div className="mt-1 h-3 w-3 rounded-full bg-tertiary"></div>
                            <div>
                              <div className="font-semibold">Trip completed</div>
                              <div className="text-sm text-muted-foreground">
                                Marked completed after the journey ended.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 px-6 md:px-8 pb-6 md:pb-8 bg-gradient-to-r from-slate-50 to-white">
              {isEditingSavedPlan ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditingSavedPlan(false);
                      setEditableSavedPlan(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80"
                  >
                    Cancel Edit
                  </button>
                  <button
                    onClick={handleSaveEditedPlan}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={handleStartEditSavedPlan}
                  className="px-4 py-2 rounded-xl bg-white border-2 border-primary/20 hover:border-primary/40 shadow-sm"
                >
                  Edit Trip
                </button>
              )}
              <button
                onClick={() => activeSavedPlan && handleDeletePlan(activeSavedPlan.id)}
                className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                Delete Trip
              </button>
              <button
                onClick={() => setActiveSavedPlan(null)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-primary via-secondary to-accent text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div id="about" className="col-span-2">
              <h3 className="text-2xl font-bold mb-4">Smart Travel</h3>
              <p className="text-white/80 mb-4">
                Experience Egypt like never before with tailored travel planning.
                Discover ancient wonders, vibrant culture, and unforgettable adventures.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-white/80">
                <li><button type="button" onClick={() => navigateToHomeSection('explore')} className="hover:text-white transition-colors">Explore</button></li>
                <li><button type="button" onClick={() => navigateToHomeSection('plans')} className="hover:text-white transition-colors">Travel Plans</button></li>
                <li><button type="button" onClick={() => navigateToHomeSection('about')} className="hover:text-white transition-colors">About Us</button></li>
                <li><button type="button" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="hover:text-white transition-colors">Contact</button></li>
              </ul>
            </div>
            <div id="contact">
              <h4 className="font-bold mb-4">Destinations</h4>
              <ul className="space-y-2 text-white/80">
                <li>Cairo</li>
                <li>Luxor</li>
                <li>Aswan</li>
                <li>Alexandria</li>
              </ul>
              <div className="mt-6 text-white/80 text-sm space-y-1">
                <div>Contact: hello@smarttravel.example</div>
                <div>Support: +20 100 000 0000</div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 text-center space-y-2">
            <p className="text-white/80">
              Crafted for Egyptian Tourism
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-white/60">
              <span>© 2024 Smart Travel</span>
              <span>•</span>
              <span>Smart Tourism Management System</span>
              <span>•</span>
              <span>Made with ❤️ for Egypt</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}



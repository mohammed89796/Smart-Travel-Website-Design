import { egyptianDestinations, Destination } from '../data/egyptianDestinations';
import { PlanData } from '../components/BudgetPlanner';
import { Itinerary, ItineraryDay } from '../components/ItineraryDisplay';

// Itinerary generation algorithm
export function generateItinerary(planData: PlanData): Itinerary {
  const { budget, travelers, duration, interests } = planData;

  const normalizedInterests = interests.map((interest) =>
    interest === 'history' ? 'historic' : interest
  );

  const activityInterests = normalizedInterests.filter((interest) => interest !== 'luxury');
  const activityDestinations = egyptianDestinations.filter((dest) => dest.category !== 'luxury');

  // Filter destinations based on interests
  const relevantDestinations = activityInterests.length
    ? activityDestinations.filter((dest) => activityInterests.includes(dest.category))
    : activityDestinations;

  // Calculate daily budget
  const dailyBudget = budget / duration / travelers;

  // Allocate budget percentages
  const allocations = {
    accommodation: 0.35, // 35%
    activities: 0.40,     // 40%
    food: 0.15,          // 15%
    transport: 0.10,     // 10%
  };

  const dailyAccommodationBudget = dailyBudget * allocations.accommodation;
  const dailyActivitiesBudget = dailyBudget * allocations.activities;
  const dailyFoodBudget = dailyBudget * allocations.food;
  const dailyTransportBudget = dailyBudget * allocations.transport;
  const wantsLuxury = dailyAccommodationBudget >= 1200;

  const days: ItineraryDay[] = [];
  let totalAccommodation = 0;
  let totalActivities = 0;
  let totalFood = 0;
  let totalTransport = 0;
  const usedDestinationIds = new Set<string>();
  const usedAccommodationNames = new Set<string>();

  // Generate daily itinerary
  for (let dayNum = 1; dayNum <= duration; dayNum++) {
    const remainingDays = duration - dayNum + 1;
    const dayDestinations = selectDestinationsForDay(
      relevantDestinations,
      dailyActivitiesBudget,
      travelers,
      dayNum,
      duration,
      remainingDays,
      usedDestinationIds
    );

    const accommodation = selectAccommodation(
      dailyAccommodationBudget,
      wantsLuxury,
      dayNum,
      usedAccommodationNames
    );

    const meals = selectMeals(interests.includes('food'), dayNum);

    const activitiesCost = dayDestinations.reduce((sum, d) => sum + d.cost, 0);
    const foodCost = dailyFoodBudget * travelers;
    const transportCost = dailyTransportBudget * travelers;

    totalAccommodation += accommodation.cost * travelers;
    totalActivities += activitiesCost * travelers;
    totalFood += foodCost;
    totalTransport += transportCost;

    const totalDayCost = 
      accommodation.cost * travelers +
      activitiesCost * travelers +
      foodCost +
      transportCost;

    days.push({
      day: dayNum,
      destinations: dayDestinations,
      accommodation: {
        name: accommodation.name,
        cost: accommodation.cost * travelers,
        type: accommodation.type,
      },
      meals,
      totalDayCost: Math.round(totalDayCost),
    });
  }

  const totalCost = Math.round(totalAccommodation + totalActivities + totalFood + totalTransport);

  return {
    totalCost,
    days,
    summary: {
      accommodationTotal: Math.round(totalAccommodation),
      activitiesTotal: Math.round(totalActivities),
      foodTotal: Math.round(totalFood),
      transportTotal: Math.round(totalTransport),
    },
  };
}

function selectDestinationsForDay(
  destinations: Destination[],
  budget: number,
  travelers: number,
  dayNum: number,
  totalDays: number,
  remainingDays: number,
  usedDestinationIds: Set<string>
): Array<{ name: string; city: string; time: string; description: string; cost: number; imageUrl: string; rating: number }> {
  // Select 2-3 destinations per day based on budget and remaining unique places
  const baseTarget = dayNum <= 3 ? 2 : dayNum <= 6 ? 3 : 2;
  const remainingUnique = destinations.length - usedDestinationIds.size;
  const maxForDay = Math.min(3, Math.max(1, remainingUnique - (remainingDays - 1)));
  const targetDestinations = remainingUnique > 0 ? Math.min(baseTarget, maxForDay) : Math.min(3, baseTarget);
  const perDestinationBudget = budget / targetDestinations;

  // Sort by rating and filter by budget
  const affordable = destinations.filter((d) => d.costPerDay <= perDestinationBudget * 1.5);
  const candidatePool = affordable.length ? affordable : destinations;
  const available = candidatePool.filter((d) => !usedDestinationIds.has(d.id));
  const sorted = (available.length ? available : candidatePool).sort((a, b) => b.rating - a.rating);

  // Select diverse destinations
  const selected: Destination[] = [];
  const usedCategories = new Set<string>();

  for (const dest of sorted) {
    if (selected.length >= targetDestinations) break;
    
    // Prefer category diversity
    if (!usedCategories.has(dest.category) || selected.length === targetDestinations - 1) {
      selected.push(dest);
      usedCategories.add(dest.category);
    }
  }

  // If we don't have enough, fill with highest rated
  while (selected.length < targetDestinations && selected.length < sorted.length) {
    const next = sorted.find((d) => !selected.includes(d));
    if (next) selected.push(next);
    else break;
  }

  // Format with times
  const times = ['09:00 AM', '02:00 PM', '05:00 PM'];
  selected.forEach((dest) => usedDestinationIds.add(dest.id));

  return selected.map((dest, idx) => ({
    name: dest.name,
    city: dest.city,
    time: times[idx] || '10:00 AM',
    description: dest.description,
    cost: Math.round(dest.costPerDay),
    imageUrl: dest.imageUrl,
    rating: dest.rating,
  }));
}

function selectAccommodation(
  budget: number,
  isLuxury: boolean,
  dayNum: number,
  usedAccommodationNames: Set<string>
): { name: string; cost: number; type: string } {
  const accommodationOptions = [
    { name: 'Four Seasons Hotel Cairo at Nile Plaza', cost: 3200, type: 'Luxury 5-Star Hotel', luxury: true },
    { name: 'The St. Regis Cairo', cost: 3400, type: 'Luxury 5-Star Hotel', luxury: true },
    { name: 'Kempinski Nile Hotel Garden City', cost: 2600, type: 'Luxury 5-Star Hotel', luxury: true },
    { name: 'Marriott Mena House', cost: 2300, type: 'Historic Luxury Hotel', luxury: true },
    { name: 'Sofitel Legend Old Cataract', cost: 2800, type: 'Heritage Luxury Hotel', luxury: true },
    { name: 'Sofitel Winter Palace Luxor', cost: 1900, type: 'Heritage Luxury Hotel', luxury: true },
    { name: 'Hilton Luxor Resort & Spa', cost: 1700, type: 'Resort & Spa', luxury: true },
    { name: 'Steigenberger Nile Palace', cost: 1500, type: 'Nile View Hotel', luxury: true },
    { name: 'Movenpick Resort Aswan', cost: 1400, type: 'Island Resort', luxury: true },
    { name: 'The Oberoi Beach Resort Sahl Hasheesh', cost: 2600, type: 'Luxury Beach Resort', luxury: true },
    { name: 'Four Seasons Resort Sharm El Sheikh', cost: 2800, type: 'Luxury Beach Resort', luxury: true },
    { name: 'Cairo Marriott Hotel & Omar Khayyam', cost: 1800, type: 'Classic Luxury Hotel', luxury: true },
    { name: 'Le Meridien Pyramids Hotel', cost: 1200, type: 'Premium 5-Star Hotel', luxury: false },
    { name: 'Sonesta St. George Hotel Luxor', cost: 1100, type: 'Comfortable 4-Star', luxury: false },
    { name: 'Steigenberger El Tahrir Cairo', cost: 900, type: 'Central 4-Star Hotel', luxury: false },
  ];

  const baseOptions = isLuxury
    ? accommodationOptions.filter((opt) => opt.luxury)
    : accommodationOptions;

  let options = baseOptions.filter((opt) => opt.cost <= budget * 1.2);

  if (options.length < 2) {
    options = baseOptions
      .slice()
      .sort((a, b) => Math.abs(a.cost - budget) - Math.abs(b.cost - budget))
      .slice(0, Math.min(5, baseOptions.length));
  }

  if (!options.length) {
    options = baseOptions.length ? baseOptions : accommodationOptions;
  }

  const available = options.filter((opt) => !usedAccommodationNames.has(opt.name));
  const selectionPool = available.length ? available : options;
  const selected = selectionPool[dayNum % selectionPool.length] || selectionPool[0] || options[0];

  if (selected) {
    usedAccommodationNames.add(selected.name);
  }

  return selected || accommodationOptions[0];
}

function selectMeals(includesFood: boolean, dayNum: number): {
  breakfast: string;
  lunch: string;
  dinner: string;
} {
  const breakfastOptions = [
    'Hotel buffet with Egyptian specialties',
    'Traditional ful medames & ta\'meya',
    'Continental breakfast',
    'Authentic Egyptian breakfast',
  ];

  const lunchOptions = includesFood
    ? [
        'Local koshari restaurant',
        'Nile-side seafood dining',
        'Traditional Egyptian mezze',
        'Nubian cuisine experience',
        'Authentic kebab & kofta',
      ]
    : [
        'Quick local lunch',
        'Street food experience',
        'Casual dining',
        'Market food tour',
      ];

  const dinnerOptions = includesFood
    ? [
        'Fine dining at signature restaurant',
        'Rooftop dinner with pyramids view',
        'Traditional Egyptian feast',
        'Nile cruise dinner',
        'Bedouin-style dinner',
      ]
    : [
        'Local restaurant',
        'Traditional eatery',
        'Casual dinner',
        'Egyptian home cooking',
      ];

  return {
    breakfast: breakfastOptions[dayNum % breakfastOptions.length],
    lunch: lunchOptions[dayNum % lunchOptions.length],
    dinner: dinnerOptions[dayNum % dinnerOptions.length],
  };
}

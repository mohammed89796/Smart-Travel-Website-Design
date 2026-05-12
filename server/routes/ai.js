const express = require('express');
const { validate, aiItinerarySchema } = require('../validations');
const { egyptianDestinations } = require('../data/egyptianDestinations');

const router = express.Router();

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const activityDestinations = egyptianDestinations.filter((destination) => destination.category !== 'luxury');
const hotelDestinations = egyptianDestinations.filter((destination) => destination.category === 'luxury');

const interestAliases = {
  history: 'historic',
  historic: 'historic',
  culture: 'historic',
  luxury: 'luxury',
  food: 'food',
  cuisine: 'food',
  adventure: 'adventure',
  outdoors: 'adventure',
  safari: 'adventure',
  relaxation: 'luxury',
};

const normalizeInterests = (interests = []) => {
  const normalized = interests
    .map((interest) => String(interest || '').trim().toLowerCase())
    .filter(Boolean)
    .map((interest) => interestAliases[interest] || interest);

  return Array.from(new Set(normalized));
};

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const buildDestinationIndex = (destinations) => {
  const byKey = new Map();
  const byName = new Map();
  const searchList = [];

  destinations.forEach((destination) => {
    const nameKey = normalizeText(destination.name);
    const cityKey = normalizeText(destination.city);
    const combinedKey = `${nameKey}|${cityKey}`;

    byKey.set(combinedKey, destination);

    if (!byName.has(nameKey)) {
      byName.set(nameKey, []);
    }
    byName.get(nameKey).push(destination);

    searchList.push({ destination, nameKey, cityKey });
  });

  return { byKey, byName, searchList };
};

const destinationIndex = buildDestinationIndex(activityDestinations);

const resolveDestination = (candidate = {}) => {
  const nameKey = normalizeText(candidate.name);
  const cityKey = normalizeText(candidate.city);

  if (!nameKey) return null;

  const exactMatch = destinationIndex.byKey.get(`${nameKey}|${cityKey}`);
  if (exactMatch) return exactMatch;

  const nameMatches = destinationIndex.byName.get(nameKey) || [];
  if (nameMatches.length === 1) return nameMatches[0];

  if (nameMatches.length > 1 && cityKey) {
    const cityMatch = nameMatches.find((dest) => normalizeText(dest.city) === cityKey);
    if (cityMatch) return cityMatch;
  }

  const fuzzyMatch = destinationIndex.searchList.find(
    (entry) =>
      entry.nameKey.includes(nameKey) || nameKey.includes(entry.nameKey)
  );

  return fuzzyMatch ? fuzzyMatch.destination : null;
};

const getBaseTargetDestinations = (dayNumber) => (dayNumber <= 3 ? 2 : dayNumber <= 6 ? 3 : 2);

const getTargetCount = (baseTarget, remainingUnique, remainingDays) => {
  if (remainingUnique <= 0) return Math.max(1, Math.min(3, baseTarget));

  const maxForDay = Math.min(3, Math.max(1, remainingUnique - (remainingDays - 1)));
  return Math.min(baseTarget, maxForDay);
};

const getDestinationPools = (interests = []) => {
  const primaryPool = interests.length
    ? activityDestinations.filter((destination) => interests.includes(destination.category))
    : activityDestinations;

  return {
    primaryPool: primaryPool.length ? primaryPool : activityDestinations,
    backupPool: activityDestinations,
  };
};

const buildDestinationEntry = (destination, overrides, index) => {
  const timeSlots = ['09:00 AM', '02:00 PM', '05:00 PM'];
  const overrideCost = toNumber(overrides?.cost);
  const overrideRating = toNumber(overrides?.rating);

  return {
    name: destination.name,
    city: destination.city,
    time: String(overrides?.time || timeSlots[index] || '10:00 AM').trim(),
    description: String(overrides?.description || destination.description || '').trim(),
    cost: Math.round(overrideCost ?? destination.costPerDay),
    imageUrl: destination.imageUrl,
    rating: overrideRating ?? destination.rating,
    _id: destination.id,
  };
};

const pickDestinationsFromPool = (pool, usedIds, targetCount, allowRepeats = false) => {
  const candidates = allowRepeats ? pool : pool.filter((dest) => !usedIds.has(dest.id));
  const sorted = candidates.slice().sort((a, b) => b.rating - a.rating);
  const selected = [];
  const usedCategories = new Set();

  for (const destination of sorted) {
    if (selected.length >= targetCount) break;

    if (!selected.includes(destination) && (!usedCategories.has(destination.category) || selected.length === targetCount - 1)) {
      selected.push(destination);
      usedCategories.add(destination.category);
    }
  }

  while (selected.length < targetCount && selected.length < sorted.length) {
    const next = sorted.find((dest) => !selected.includes(dest));
    if (next) selected.push(next);
    else break;
  }

  return selected;
};

const buildAiPrompt = (payload) => {
  const destinationList = activityDestinations
    .map((dest) =>
      `- ${dest.name} (${dest.city}) [${dest.category}] costPerPerson ${dest.costPerDay} EGP rating ${dest.rating} image ${dest.imageUrl} desc ${dest.description}`
    )
    .join('\n');

  const hotelList = hotelDestinations
    .map((hotel) => `- ${hotel.name} (${hotel.city}) approxCostPerPerson ${hotel.costPerDay} EGP`)
    .join('\n');

  const interestLabel = payload.interests.length ? payload.interests.join(', ') : 'balanced';

  return [
    `Trip parameters: budget ${payload.budget} EGP total for all travelers, ${payload.travelers} travelers, ${payload.duration} days.`,
    `Interests: ${interestLabel}.`,
    'Use ONLY the activity destinations listed below for the daily destinations. All places must be in Egypt.',
    'Do not list hotels or resorts as destinations.',
    destinationList,
    'Hotel options (use for accommodation only):',
    hotelList || '- Use a reputable 4-5 star hotel appropriate for the budget',
    'Return JSON with this exact shape and no extra keys:',
    '{',
    '  "totalCost": number,',
    '  "summary": { "accommodationTotal": number, "activitiesTotal": number, "foodTotal": number, "transportTotal": number },',
    '  "days": [',
    '    {',
    '      "day": 1,',
    '      "destinations": [',
    '        { "name": "", "city": "", "time": "09:00 AM", "description": "", "cost": number, "imageUrl": "", "rating": number }',
    '      ],',
    '      "accommodation": { "name": "", "cost": number, "type": "" },',
    '      "meals": { "breakfast": "", "lunch": "", "dinner": "" },',
    '      "totalDayCost": number',
    '    }',
    '  ]',
    '}',
    'Rules:',
    '- costs are in EGP',
    '- destination cost is per person',
    '- accommodation cost is total for all travelers',
    '- 2-3 destinations per day',
    '- do not repeat destinations across different days',
    '- always use the imageUrl from the destination list',
    '- avoid repeating accommodation names across different days when possible',
    '- totalCost is the sum of totalDayCost across days',
    '- keep totalCost within the budget',
  ].join('\n');
};

const toNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeItinerary = (raw, duration, travelers, interests = []) => {
  if (!raw || typeof raw !== 'object') return null;

  const itinerary = raw.itinerary && typeof raw.itinerary === 'object' ? raw.itinerary : raw;
  if (!itinerary || !Array.isArray(itinerary.days)) return null;

  if (duration && itinerary.days.length !== duration) return null;

  const totalDays = duration || itinerary.days.length;
  const { primaryPool, backupPool } = getDestinationPools(interests);
  const usedDestinationIds = new Set();

  const days = itinerary.days.map((day, index) => {
    const dayNumber = toNumber(day?.day) ?? index + 1;
    if (!dayNumber) return null;

    const requestedDestinations = Array.isArray(day?.destinations) ? day.destinations : [];
    const remainingDays = totalDays - index;
    const remainingUnique = backupPool.length - usedDestinationIds.size;
    const baseTarget = getBaseTargetDestinations(dayNumber);
    const targetCount = getTargetCount(baseTarget, remainingUnique, remainingDays);

    const selected = [];
    const usedIdsForDay = new Set();

    requestedDestinations.forEach((destination) => {
      if (selected.length >= targetCount) return;

      const resolved = resolveDestination(destination);
      if (!resolved) return;
      if (usedDestinationIds.has(resolved.id) || usedIdsForDay.has(resolved.id)) return;

      const entry = buildDestinationEntry(resolved, destination, selected.length);
      selected.push(entry);
      usedDestinationIds.add(resolved.id);
      usedIdsForDay.add(resolved.id);
    });

    const fillFromPool = (pool, allowRepeats = false) => {
      if (selected.length >= targetCount) return;

      const needed = targetCount - selected.length;
      const picks = pickDestinationsFromPool(pool, usedDestinationIds, needed, allowRepeats);

      picks.forEach((destination) => {
        if (selected.length >= targetCount) return;
        if (usedIdsForDay.has(destination.id) && !allowRepeats) return;

        const entry = buildDestinationEntry(destination, {}, selected.length);
        selected.push(entry);
        if (!allowRepeats) {
          usedDestinationIds.add(destination.id);
        }
        usedIdsForDay.add(destination.id);
      });
    };

    fillFromPool(primaryPool, false);
    if (selected.length < targetCount) {
      fillFromPool(backupPool, false);
    }
    if (!selected.length) {
      fillFromPool(backupPool, true);
    }

    if (!selected.length) return null;

    const accommodationName = String(day?.accommodation?.name || '').trim();
    const accommodationType = String(day?.accommodation?.type || '').trim();
    const accommodationCost = toNumber(day?.accommodation?.cost);

    if (!accommodationName || !accommodationType || accommodationCost === null) {
      return null;
    }

    const meals = day?.meals || {};
    const breakfast = String(meals.breakfast || '').trim();
    const lunch = String(meals.lunch || '').trim();
    const dinner = String(meals.dinner || '').trim();

    if (!breakfast || !lunch || !dinner) return null;

    const cleanedDestinations = selected.map(({ _id, ...rest }) => rest);
    const destinationsTotal = cleanedDestinations.reduce((sum, destination) => sum + destination.cost, 0) * travelers;
    const computedDayCost = Math.round(accommodationCost + destinationsTotal);
    const totalDayCost = toNumber(day?.totalDayCost) ?? computedDayCost;

    return {
      day: dayNumber,
      destinations: cleanedDestinations,
      accommodation: {
        name: accommodationName,
        cost: accommodationCost,
        type: accommodationType,
      },
      meals: {
        breakfast,
        lunch,
        dinner,
      },
      totalDayCost,
    };
  });

  if (days.some((day) => day === null)) return null;

  const accommodationTotal = days.reduce((sum, day) => sum + day.accommodation.cost, 0);
  const activitiesTotal = days.reduce(
    (sum, day) => sum + day.destinations.reduce((innerSum, destination) => innerSum + destination.cost, 0) * travelers,
    0
  );
  const totalCost = Math.round(days.reduce((sum, day) => sum + day.totalDayCost, 0));
  const remaining = Math.max(0, totalCost - accommodationTotal - activitiesTotal);

  const summary = {
    accommodationTotal: toNumber(itinerary?.summary?.accommodationTotal) ?? Math.round(accommodationTotal),
    activitiesTotal: toNumber(itinerary?.summary?.activitiesTotal) ?? Math.round(activitiesTotal),
    foodTotal: toNumber(itinerary?.summary?.foodTotal) ?? Math.round(remaining * 0.6),
    transportTotal: toNumber(itinerary?.summary?.transportTotal) ?? Math.round(remaining * 0.4),
  };

  return {
    totalCost,
    summary,
    days,
  };
};

const selectDestinationsForDay = ({
  primaryPool,
  backupPool,
  budget,
  dayNum,
  remainingDays,
  usedDestinationIds,
}) => {
  const baseTarget = getBaseTargetDestinations(dayNum);
  const remainingUnique = backupPool.length - usedDestinationIds.size;
  const targetDestinations = getTargetCount(baseTarget, remainingUnique, remainingDays);
  const perDestinationBudget = budget / targetDestinations;

  const filterAffordable = (pool) =>
    pool.filter((dest) => dest.costPerDay <= perDestinationBudget * 1.5);

  const affordablePrimary = filterAffordable(primaryPool);
  const affordableBackup = filterAffordable(backupPool);

  const primaryCandidates = affordablePrimary.length ? affordablePrimary : primaryPool;
  const backupCandidates = affordableBackup.length ? affordableBackup : backupPool;

  let selected = pickDestinationsFromPool(primaryCandidates, usedDestinationIds, targetDestinations, false);

  if (selected.length < targetDestinations) {
    const remaining = targetDestinations - selected.length;
    selected = selected.concat(
      pickDestinationsFromPool(backupCandidates, usedDestinationIds, remaining, false)
    );
  }

  if (!selected.length) {
    selected = pickDestinationsFromPool(backupCandidates, usedDestinationIds, 1, true);
  }

  selected.forEach((destination) => usedDestinationIds.add(destination.id));

  return selected.map((destination, index) => {
    const entry = buildDestinationEntry(destination, {}, index);
    const { _id, ...rest } = entry;
    return rest;
  });
};

const selectAccommodation = (budget, isLuxury, dayNum, usedAccommodationNames) => {
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
    ? accommodationOptions.filter((option) => option.luxury)
    : accommodationOptions;

  let options = baseOptions.filter((option) => option.cost <= budget * 1.2);

  if (options.length < 2) {
    options = baseOptions
      .slice()
      .sort((a, b) => Math.abs(a.cost - budget) - Math.abs(b.cost - budget))
      .slice(0, Math.min(5, baseOptions.length));
  }

  if (!options.length) {
    options = baseOptions.length ? baseOptions : accommodationOptions;
  }

  const available = usedAccommodationNames
    ? options.filter((option) => !usedAccommodationNames.has(option.name))
    : options;

  const selectionPool = available.length ? available : options;
  const selected = selectionPool[dayNum % selectionPool.length] || selectionPool[0] || accommodationOptions[0];

  if (usedAccommodationNames && selected) {
    usedAccommodationNames.add(selected.name);
  }

  return selected || accommodationOptions[0];
};

const selectMeals = (includesFood, dayNum) => {
  const breakfastOptions = [
    'Hotel buffet with Egyptian specialties',
    'Traditional ful medames and tameya',
    'Continental breakfast',
    'Authentic Egyptian breakfast',
  ];

  const lunchOptions = includesFood
    ? [
        'Local koshari restaurant',
        'Nile-side seafood dining',
        'Traditional Egyptian mezze',
        'Nubian cuisine experience',
        'Authentic kebab and kofta',
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
};

const generateFallbackItinerary = (planData) => {
  const { budget, travelers, duration, interests } = planData;

  const { primaryPool, backupPool } = getDestinationPools(interests);
  const usedDestinationIds = new Set();
  const usedAccommodationNames = new Set();

  const dailyBudget = budget / duration / travelers;
  const allocations = {
    accommodation: 0.35,
    activities: 0.4,
    food: 0.15,
    transport: 0.1,
  };

  const dailyAccommodationBudget = dailyBudget * allocations.accommodation;
  const dailyActivitiesBudget = dailyBudget * allocations.activities;
  const dailyFoodBudget = dailyBudget * allocations.food;
  const dailyTransportBudget = dailyBudget * allocations.transport;
  const wantsLuxury = dailyAccommodationBudget >= 1200;

  const days = [];
  let totalAccommodation = 0;
  let totalActivities = 0;
  let totalFood = 0;
  let totalTransport = 0;

  for (let dayNum = 1; dayNum <= duration; dayNum++) {
    const remainingDays = duration - dayNum + 1;
    const dayDestinations = selectDestinationsForDay({
      primaryPool,
      backupPool,
      budget: dailyActivitiesBudget,
      dayNum,
      remainingDays,
      usedDestinationIds,
    });

    const accommodation = selectAccommodation(
      dailyAccommodationBudget,
      wantsLuxury,
      dayNum,
      usedAccommodationNames
    );
    const meals = selectMeals(interests.includes('food'), dayNum);

    const activitiesCost = dayDestinations.reduce((sum, destination) => sum + destination.cost, 0);
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
};

const requestAiItinerary = async (payload) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (typeof fetch !== 'function') {
    throw new Error('Fetch API is not available in this Node.js runtime.');
  }

  const prompt = buildAiPrompt(payload);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: 'You are a senior travel planner who outputs strict JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI response was empty.');
  }

  let parsed = null;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      try {
        parsed = JSON.parse(content.slice(startIndex, endIndex + 1));
      } catch (parseError) {
        parsed = null;
      }
    }
  }

  return parsed;
};

router.post('/itinerary', validate(aiItinerarySchema), async (req, res) => {
  const { budget, duration, travelers } = req.body;
  const rawInterests = [...(req.body.interests || []), ...(req.body.activities || [])];
  const interests = normalizeInterests(rawInterests);
  const activityInterests = interests.filter((interest) => interest !== 'luxury');

  const payload = {
    budget,
    duration,
    travelers,
    interests: activityInterests,
  };

  try {
    const aiResponse = await requestAiItinerary(payload);
    const normalized = aiResponse ? normalizeItinerary(aiResponse, duration, travelers, activityInterests) : null;

    if (normalized) {
      return res.json({
        success: true,
        message: 'AI itinerary generated successfully',
        data: {
          itinerary: normalized,
          source: 'ai',
          model: DEFAULT_MODEL,
        },
      });
    }
  } catch (error) {
    console.error('AI itinerary generation failed:', error.message);
  }

  const fallbackItinerary = generateFallbackItinerary(payload);

  return res.json({
    success: true,
    message: 'Fallback itinerary generated successfully',
    data: {
      itinerary: fallbackItinerary,
      source: 'fallback',
    },
  });
});

module.exports = router;

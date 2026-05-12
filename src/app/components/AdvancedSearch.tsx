/**
 * Advanced Search Component
 * Enhanced destination and plan search with filters
 */

import { useState, useEffect } from 'react';
import { Search, Sliders, MapPin, DollarSign, Calendar, Users, TrendingUp } from 'lucide-react';

interface SearchFilters {
  destination: string;
  minBudget: number;
  maxBudget: number;
  minDuration: number;
  maxDuration: number;
  travelers: number;
  season: string;
  difficulty: string;
  category: string;
  sortBy: string;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

export function AdvancedSearch({ onSearch, isLoading = false }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    destination: '',
    minBudget: 500,
    maxBudget: 10000,
    minDuration: 1,
    maxDuration: 30,
    travelers: 2,
    season: 'any',
    difficulty: 'any',
    category: 'any',
    sortBy: 'recommended',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const seasons = ['any', 'spring', 'summer', 'fall', 'winter'];
  const difficulties = ['any', 'easy', 'moderate', 'challenging'];
  const categories = ['any', 'beach', 'cultural', 'adventure', 'luxury', 'budget'];
  const sortOptions = ['recommended', 'price-low', 'price-high', 'duration-short', 'duration-long', 'rating'];

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
      destination: '',
      minBudget: 500,
      maxBudget: 10000,
      minDuration: 1,
      maxDuration: 30,
      travelers: 2,
      season: 'any',
      difficulty: 'any',
      category: 'any',
      sortBy: 'recommended',
    });
  };

  return (
    <div className="space-y-4">
      {/* Basic Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-4 flex-col md:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter destination (e.g., Cairo, Luxor, Aswan)..."
              value={filters.destination}
              onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg font-semibold transition disabled:opacity-50"
          >
            Search
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-3 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition flex items-center gap-2"
          >
            <Sliders className="w-5 h-5" />
            {showAdvanced ? 'Hide' : 'Show'} Filters
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border-2 border-indigo-200 p-6 space-y-6">
          {/* Row 1: Budget & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Budget Range */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Budget Range
              </label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600">Min: ${filters.minBudget}</label>
                  <input
                    type="range"
                    min="100"
                    max="20000"
                    step="500"
                    value={filters.minBudget}
                    onChange={(e) => setFilters({ ...filters, minBudget: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Max: ${filters.maxBudget}</label>
                  <input
                    type="range"
                    min="100"
                    max="20000"
                    step="500"
                    value={filters.maxBudget}
                    onChange={(e) => setFilters({ ...filters, maxBudget: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Duration Range */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Trip Duration
              </label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600">Min: {filters.minDuration} days</label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={filters.minDuration}
                    onChange={(e) => setFilters({ ...filters, minDuration: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Max: {filters.maxDuration} days</label>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={filters.maxDuration}
                    onChange={(e) => setFilters({ ...filters, maxDuration: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Season, Difficulty, Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Season */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Season</label>
              <select
                value={filters.season}
                onChange={(e) => setFilters({ ...filters, season: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 outline-none"
              >
                {seasons.map((season) => (
                  <option key={season} value={season}>
                    {season.charAt(0).toUpperCase() + season.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Difficulty Level</label>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 outline-none"
              >
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Trip Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Travelers & Sort */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Travelers */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Number of Travelers: {filters.travelers}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={filters.travelers}
                onChange={(e) => setFilters({ ...filters, travelers: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option} value={option}>
                    {option
                      .replace('-', ' ')
                      .split(' ')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t-2 border-indigo-200">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-indigo-700 hover:bg-indigo-100 rounded-lg transition font-medium"
            >
              Reset Filters
            </button>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              Search with Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

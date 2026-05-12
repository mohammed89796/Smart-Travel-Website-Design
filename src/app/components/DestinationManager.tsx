/**
 * Destination Manager Component
 * Manage travel destinations
 */

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { adminApi } from '../../api/adminClient';

export function DestinationManager() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadDestinations();
  }, [page, searchTerm, filterCategory]);

  const loadDestinations = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (filterCategory) filters.category = filterCategory;

      const response = await adminApi.getDestinations(page, 20, filters);
      if (response.success) {
        setDestinations(response.data.destinations);
      }
    } catch (error: any) {
      console.error('Error loading destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Destinations</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add Destination
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Categories</option>
            <option value="beach">Beach</option>
            <option value="mountain">Mountain</option>
            <option value="cultural">Cultural</option>
            <option value="adventure">Adventure</option>
          </select>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <DestinationForm onSuccess={() => { setShowForm(false); loadDestinations(); }} />
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading destinations...</div>
        ) : destinations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No destinations found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Name</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Country</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Category</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Rating</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {destinations.map((dest: any) => (
                  <tr key={dest._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{dest.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{dest.country}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {dest.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">⭐ {dest.rating}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button className="p-1 text-gray-600 hover:text-indigo-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-600 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function DestinationForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    country: '',
    region: '',
    category: 'cultural',
    climate: 'temperate',
    bestSeason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await adminApi.createDestination(formData);
      if (response.success) {
        onSuccess();
      } else {
        setError(response.message || 'Failed to create destination');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create destination');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Destination</h3>
      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}
      
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Destination Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <input
          type="text"
          placeholder="Country"
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          required
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="beach">Beach</option>
          <option value="mountain">Mountain</option>
          <option value="cultural">Cultural</option>
          <option value="adventure">Adventure</option>
        </select>
        <select
          value={formData.climate}
          onChange={(e) => setFormData({ ...formData, climate: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="tropical">Tropical</option>
          <option value="temperate">Temperate</option>
          <option value="arid">Arid</option>
          <option value="cold">Cold</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="col-span-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition"
        >
          {loading ? 'Creating...' : 'Create Destination'}
        </button>
      </form>
    </div>
  );
}

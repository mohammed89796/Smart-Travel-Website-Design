/**
 * Booking Manager Component
 * Manage travel bookings and their status
 */

import { useState, useEffect } from 'react';
import { Search, Filter, Check, X, Clock } from 'lucide-react';
import { adminApi } from '../../api/adminClient';

export function BookingManager() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBookings();
  }, [page, filterStatus, searchTerm]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filterStatus) filters.status = filterStatus;
      if (searchTerm) filters.search = searchTerm;

      const response = await adminApi.getBookings(page, 20, filters);
      if (response.success) {
        setBookings(response.data.bookings);
      }
    } catch (error: any) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
      completed: 'bg-blue-100 text-blue-700',
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    const icons: any = {
      confirmed: <Check className="w-4 h-4" />,
      pending: <Clock className="w-4 h-4" />,
      cancelled: <X className="w-4 h-4" />,
      completed: <Check className="w-4 h-4" />,
    };
    return icons[status] || null;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by booking ID or user..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No bookings found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Booking ID</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">User</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Package</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Dates</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-900">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((booking: any) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{booking._id.slice(-8)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{booking.userId?.name ? booking.userId.name.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{booking.packageId?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      ₹{booking.totalPrice?.toLocaleString()}
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

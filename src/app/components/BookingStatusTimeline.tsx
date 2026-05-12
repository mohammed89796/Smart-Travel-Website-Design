/**
 * Booking Status Timeline Component
 * Shows real-time booking status updates for users
 */

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, Package, MapPin, DollarSign } from 'lucide-react';

interface StatusUpdate {
  status: string;
  date: string;
  message: string;
  icon?: React.ReactNode;
}

interface BookingStatusProps {
  bookingId: string;
  currentStatus: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  departureDate: string;
  destination: string;
  amount: number;
}

export function BookingStatusTimeline({ bookingId, currentStatus, departureDate, destination, amount }: BookingStatusProps) {
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) setUserEmail(email);
  }, []);

  const getStatusUpdates = (): StatusUpdate[] => {
    const updates: StatusUpdate[] = [
      {
        status: 'pending',
        date: new Date().toLocaleDateString(),
        message: 'Booking created and awaiting confirmation',
        icon: <Clock className="w-5 h-5" />,
      },
    ];

    if (['confirmed', 'in-progress', 'completed'].includes(currentStatus)) {
      const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString();
      updates.push({
        status: 'confirmed',
        date: tomorrow,
        message: 'Your booking has been confirmed. Confirmation email sent.',
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      });
    }

    if (['in-progress', 'completed'].includes(currentStatus)) {
      const departDate = new Date(departureDate).toLocaleDateString();
      updates.push({
        status: 'in-progress',
        date: departDate,
        message: 'Your trip is in progress. Happy travels!',
        icon: <Package className="w-5 h-5 text-blue-600" />,
      });
    }

    if (currentStatus === 'completed') {
      const endDate = new Date(new Date(departureDate).getTime() + 7 * 86400000).toLocaleDateString();
      updates.push({
        status: 'completed',
        date: endDate,
        message: 'Trip completed. Thank you for booking with us!',
        icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      });
    }

    if (currentStatus === 'cancelled') {
      updates.push({
        status: 'cancelled',
        date: new Date().toLocaleDateString(),
        message: 'This booking has been cancelled.',
        icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      });
    }

    return updates;
  };

  const statusUpdates = getStatusUpdates();
  const statusColors: any = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      {/* Booking Summary Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border-2 border-indigo-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Booking Reference</p>
            <p className="text-lg font-mono font-bold text-gray-900">{bookingId.slice(-8).toUpperCase()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Destination
            </p>
            <p className="text-lg font-bold text-gray-900">{destination}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Departure
            </p>
            <p className="text-lg font-bold text-gray-900">{new Date(departureDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Total Amount
            </p>
            <p className="text-lg font-bold text-gray-900">${amount.toLocaleString()}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Current Status:</span>
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${statusColors[currentStatus] || 'bg-gray-100 text-gray-700'}`}>
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Booking Timeline</h3>
        <div className="space-y-6">
          {statusUpdates.map((update, index) => (
            <div key={index} className="relative pl-8">
              {/* Timeline line */}
              {index < statusUpdates.length - 1 && (
                <div className="absolute left-3 top-10 h-8 w-0.5 bg-gradient-to-b from-indigo-400 to-indigo-200"></div>
              )}

              {/* Timeline dot */}
              <div className="absolute left-0 top-0 w-6 h-6 bg-white border-2 border-indigo-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              </div>

              {/* Content */}
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{update.status.charAt(0).toUpperCase() + update.status.slice(1)}</h4>
                  <span className="text-sm text-gray-500">{update.date}</span>
                </div>
                <p className="text-gray-600 text-sm mt-1">{update.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
        <div className="flex flex-col gap-3">
          {currentStatus === 'pending' && (
            <button className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition">
              Cancel Booking
            </button>
          )}
          {currentStatus !== 'cancelled' && (
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition">
              Download Itinerary
            </button>
          )}
          <button className="px-4 py-2 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition">
            Contact Support
          </button>
        </div>
      </div>

      {/* Notifications */}
      {userEmail && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            📧 Status updates are sent to <strong>{userEmail}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

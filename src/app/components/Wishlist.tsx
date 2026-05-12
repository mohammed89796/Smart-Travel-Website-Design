/**
 * Wishlist Component
 * Display and manage user wishlists
 */

import { useState, useEffect } from 'react';
import { Heart, MapPin, DollarSign, Calendar, Trash2, ArrowRight } from 'lucide-react';

interface WishlistItem {
  _id: string;
  destinationName: string;
  destinationImage: string;
  destinationCategory: string;
  estimatedBudget: number;
  duration: number;
  addedAt: string;
}

interface WishlistProps {
  isAuthenticated: boolean;
  onLoginRequired?: () => void;
}

export function Wishlist({ isAuthenticated, onLoginRequired }: WishlistProps) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist();
    }
  }, [isAuthenticated]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wishlist', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data.data.wishlist || []);
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (destinationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/wishlist/${destinationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setWishlistItems(wishlistItems.filter(item => item._id !== destinationId));
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border-2 border-red-200 p-12 text-center">
        <Heart className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Saved Favorites</h2>
        <p className="text-gray-600 mb-6">Log in to save your favorite destinations and create wishlists.</p>
        <button
          onClick={onLoginRequired}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          My Wishlist
        </h2>
        <p className="text-gray-600 mt-2">{wishlistItems.length} destinations saved</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading wishlist...</div>
      ) : wishlistItems.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No destinations saved yet.</p>
          <p className="text-gray-500 text-sm">Explore destinations and click the heart icon to save them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <div key={item._id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden group">
              {/* Image */}
              <div className="relative h-48 bg-gray-200 overflow-hidden">
                {item.destinationImage && (
                  <img
                    src={item.destinationImage}
                    alt={item.destinationName}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                )}
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white text-gray-900">
                    {item.destinationCategory}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <h3 className="text-lg font-bold text-gray-900">{item.destinationName}</h3>

                <div className="space-y-2 text-sm text-gray-600">
                  {item.estimatedBudget && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span>Budget: ${item.estimatedBudget}</span>
                    </div>
                  )}
                  {item.duration && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>{item.duration} days</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Clock className="w-4 h-4" />
                    <span>Saved {new Date(item.addedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition text-sm">
                    <ArrowRight className="w-4 h-4" />
                    Plan Trip
                  </button>
                  <button
                    onClick={() => removeFromWishlist(item._id)}
                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Add Clock import
import { Clock } from 'lucide-react';

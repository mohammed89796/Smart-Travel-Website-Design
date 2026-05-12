/**
 * Review Manager Component
 * Moderate and manage user reviews
 */

import { useState, useEffect } from 'react';
import { Search, Check, X, AlertCircle } from 'lucide-react';
import { adminApi } from '../../api/adminClient';

export function ReviewManager() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadReviews();
  }, [page, filterStatus]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filterStatus) filters.status = filterStatus;

      const response = await adminApi.getReviews(page, 20, filters);
      if (response.success) {
        setReviews(response.data.reviews);
      }
    } catch (error: any) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      const response = await adminApi.updateReview(reviewId, { status: 'published' });
      if (response.success) {
        setReviews(reviews.map(r => r._id === reviewId ? { ...r, status: 'published' } : r));
      }
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      const response = await adminApi.updateReview(reviewId, { status: 'rejected' });
      if (response.success) {
        setReviews(reviews.filter(r => r._id !== reviewId));
      }
    } catch (error) {
      console.error('Error rejecting review:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No reviews found</div>
        ) : (
          reviews.map((review: any) => (
            <div key={review._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{review.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-600">
                      By {review.userId?.name ? review.userId.name.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Anonymous'}
                    </span>
                    <span className="text-sm text-yellow-600">
                      {'⭐'.repeat(review.rating)}
                    </span>
                  </div>
                </div>
                <div>
                  {review.status === 'pending' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                      <AlertCircle className="w-3 h-3" />
                      Pending
                    </span>
                  ) : review.status === 'published' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <Check className="w-3 h-3" />
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      <X className="w-3 h-3" />
                      Rejected
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-700 mb-4">{review.comment}</p>

              <div className="text-xs text-gray-500 mb-4">
                Posted on {new Date(review.createdAt).toLocaleDateString()}
              </div>

              {review.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(review._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-sm font-medium rounded transition"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(review._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded transition"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

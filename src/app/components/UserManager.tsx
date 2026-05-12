/**
 * User Manager Component
 * Manage users and their access/roles
 */

import { useState, useEffect } from 'react';
import { Search, MoreVertical, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/adminClient';

export function UserManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [page, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;

      const response = await adminApi.getUsers(page, 20, filters);
      if (response.success) {
        setUsers(response.data.users);
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setDeletingUserId(userId);
      const response = await adminApi.deleteUser(userId);
      if (response.success) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        setPendingDeleteUserId(null);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 p-8 text-center text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="col-span-3 p-8 text-center text-gray-500">No users found</div>
        ) : (
          users.map((user: any) => (
            <div key={user._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{user.name || 'Unknown User'}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <div className="relative group">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bookings:</span>
                  <span className="text-sm font-medium text-gray-900">{user.totalBookings || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Joined:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500 mb-3">Account Status:</p>
                <div className="flex gap-2">
                  {user.isActive ? (
                    <span className="flex-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded text-center">
                      Active
                    </span>
                  ) : (
                    <span className="flex-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded text-center">
                      Inactive
                    </span>
                  )}
                  {pendingDeleteUserId === user._id ? (
                    <div className="flex-1 flex gap-2">
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        disabled={deletingUserId === user._id}
                        className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-xs font-medium rounded transition"
                      >
                        {deletingUserId === user._id ? 'Deleting...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setPendingDeleteUserId(null)}
                        disabled={deletingUserId === user._id}
                        className="flex-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 text-xs font-medium rounded transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPendingDeleteUserId(user._id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

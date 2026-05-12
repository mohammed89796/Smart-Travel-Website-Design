/**
 * Activity Log Viewer Component
 * Display admin activity audit trail
 */

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Trash2, Clock, User, FileText, MapPin } from 'lucide-react';
import { adminApi } from '../../api/adminClient';

export function ActivityLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadActivityLogs();
    loadActivityStats();
  }, [page, filterAction, filterResource]);

  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filterAction) filters.action = filterAction;
      if (filterResource) filters.resource = filterResource;

      const response = await adminApi.getActivityLogs(page, 20, filters);
      if (response.success) {
        setLogs(response.data.logs);
      }
    } catch (error: any) {
      console.error('Error loading activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityStats = async () => {
    try {
      const response = await adminApi.getActivityLogsSummary();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getActionBadge = (action: string) => {
    const badges: any = {
      CREATE: 'bg-green-100 text-green-700',
      UPDATE: 'bg-blue-100 text-blue-700',
      DELETE: 'bg-red-100 text-red-700',
      APPROVE: 'bg-emerald-100 text-emerald-700',
      REJECT: 'bg-orange-100 text-orange-700',
      LOGIN: 'bg-purple-100 text-purple-700',
      LOGOUT: 'bg-gray-100 text-gray-700',
    };
    return badges[action] || 'bg-gray-100 text-gray-700';
  };

  const getResourceIcon = (resource: string) => {
    const icons: any = {
      DESTINATION: MapPin,
      BOOKING: FileText,
      USER: User,
      REVIEW: FileText,
      ADMIN: User,
    };
    return icons[resource] || FileText;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const exportLogs = () => {
    const csv = [
      ['Date', 'Admin', 'Action', 'Resource', 'Resource ID', 'Status'],
      ...logs.map(log => [
        formatDate(log.createdAt),
        log.adminEmail,
        log.action,
        log.resource,
        log.resourceId,
        log.status,
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Actions</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalActions}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Today's Actions</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.todayActions}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Updates</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats.actionsByType.find((a: any) => a._id === 'UPDATE')?.count || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Deletions</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {stats.actionsByType.find((a: any) => a._id === 'DELETE')?.count || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex gap-4 flex-col md:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by admin email or resource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <select
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="APPROVE">Approve</option>
            <option value="REJECT">Reject</option>
          </select>
          <select
            value={filterResource}
            onChange={(e) => {
              setFilterResource(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Resources</option>
            <option value="DESTINATION">Destination</option>
            <option value="BOOKING">Booking</option>
            <option value="USER">User</option>
            <option value="REVIEW">Review</option>
          </select>
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Activity Log Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading activity logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No activity found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Date & Time</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Admin</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Action</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Resource</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Details</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log: any) => {
                  const Icon = getResourceIcon(log.resource);
                  return (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {formatDate(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.adminEmail.split('@')[0]}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-500" />
                          {log.resource}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>
                          <p className="font-mono text-xs">ID: {log.resourceId.slice(-8)}</p>
                          {log.resourceName && <p className="text-gray-600">{log.resourceName}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          log.status === 'SUCCESS'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

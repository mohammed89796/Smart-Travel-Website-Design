/**
 * Admin Dashboard Main Component
 * Displays comprehensive admin management interface
 */

import { useState, useEffect } from 'react';
import { BarChart3, Users, MapPin, FileText, TrendingUp, LogOut, Menu, X, History, Moon, Sun } from 'lucide-react';
import { adminApi } from '../../api/adminClient';
import { useTheme } from '../context/ThemeContext';
import { DestinationManager } from './DestinationManager';
import { BookingManager } from './BookingManager';
import { UserManager } from './UserManager';
import { ReviewManager } from './ReviewManager';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { ActivityLogViewer } from './ActivityLogViewer';

type DashboardTab = 'overview' | 'destinations' | 'bookings' | 'users' | 'reviews' | 'analytics' | 'activity';

interface AdminDashboardProps {
  admin: any;
  onLogout: () => void;
}

export function AdminDashboard({ admin, onLogout }: AdminDashboardProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const adminDisplayName = String(admin?.name || 'Admin')
    .split(' ')
    .filter(Boolean)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  useEffect(() => {
    // Debug: Log admin data and token on mount
    const token = localStorage.getItem('adminToken');
    console.log('AdminDashboard mounted with admin:', admin);
    console.log('AdminToken in localStorage:', token ? 'Present' : 'Missing');
    
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      const response = await adminApi.getDashboardStats();
      if (response.success) {
        setStats(response.data.statistics);
      } else {
        setError(response.message || 'Failed to load dashboard statistics');
      }
    } catch (err: any) {
      console.error('Dashboard stats error:', err);
      
      // Provide specific error messages based on error type
      if (err.response?.status === 403) {
        setError('Access denied: You do not have permission to access the admin dashboard. Please log in again.');
      } else if (err.response?.status === 401) {
        setError('Session expired: Please log in again to access the admin dashboard.');
      } else {
        setError(err.message || 'Failed to load dashboard statistics. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await adminApi.logout();
    onLogout();
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'destinations' as const, label: 'Destinations', icon: MapPin },
    { id: 'bookings' as const, label: 'Bookings', icon: FileText },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'reviews' as const, label: 'Reviews', icon: FileText },
    { id: 'analytics' as const, label: 'Analytics', icon: TrendingUp },
    { id: 'activity' as const, label: 'Activity Log', icon: History },
  ];

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${isDarkMode ? 'bg-gray-950 border-gray-700' : 'bg-gray-900'} text-white transition-all duration-300 flex flex-col border-r`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className={`${sidebarOpen ? 'block' : 'hidden'}`}>
              <h2 className="text-lg font-bold">Smart Travel</h2>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white p-1"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-800 p-3 space-y-3">
          {sidebarOpen && (
            <div className="px-4 py-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400">Logged in as</p>
              <p className="text-sm font-semibold truncate">{adminDisplayName}</p>
              <p className="text-xs text-indigo-400 capitalize">{admin.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && 'log out'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-8 py-4 flex items-center justify-between`}>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {tabs.find((t) => t.id === activeTab)?.label}
          </h1>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Content Area */}
        <div className={`flex-1 overflow-auto p-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {activeTab === 'overview' && (
            <OverviewTab stats={stats} loading={loading} onRefresh={loadDashboardStats} onNavigateTab={setActiveTab} />
          )}

          {activeTab === 'destinations' && <DestinationManager />}
          {activeTab === 'bookings' && <BookingManager />}
          {activeTab === 'users' && <UserManager />}
          {activeTab === 'reviews' && <ReviewManager />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'activity' && <ActivityLogViewer />}
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  stats,
  loading,
  onRefresh,
  onNavigateTab,
}: {
  stats: any;
  loading: boolean;
  onRefresh: () => void;
  onNavigateTab: (tab: DashboardTab) => void;
}) {
  if (loading) {
    return <div className="text-center py-12">Loading statistics...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12 text-gray-600">No statistics available</div>;
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: FileText, color: 'bg-green-100 text-green-600' },
    { label: 'Completed Bookings', value: stats.completedBookings, icon: BarChart3, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue?.toLocaleString()}`, icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
    { label: 'Total Destinations', value: stats.totalDestinations, icon: MapPin, color: 'bg-orange-100 text-orange-600' },
    { label: 'Pending Reviews', value: stats.pendingReviews, icon: FileText, color: 'bg-red-100 text-red-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => onNavigateTab('bookings')} className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700">
            View Pending Bookings
          </button>
          <button onClick={() => onNavigateTab('reviews')} className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700">
            Moderate Reviews
          </button>
          <button onClick={() => onNavigateTab('destinations')} className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700">
            Add Destination
          </button>
          <button onClick={onRefresh} className="p-4 border border-indigo-300 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition text-sm font-medium text-indigo-700">
            Refresh Stats
          </button>
        </div>
      </div>
    </div>
  );
}

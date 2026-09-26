import React from 'react';
import { Users, FileText, TrendingUp, Activity, Calendar, MapPin, Fish as FishIcon, Target } from 'lucide-react';

const OverviewTab = ({ stats }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">{stats.overview.totalUsers}</p>
            <p className="text-xs text-green-600 mt-1">+{stats.overview.recentUsers} this month</p>
          </div>
          <Users className="w-12 h-12 text-blue-500 opacity-80" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Logs</p>
            <p className="text-3xl font-bold text-gray-900">{stats.overview.totalLogs}</p>
            <p className="text-xs text-green-600 mt-1">+{stats.overview.recentLogs} this month</p>
          </div>
          <FileText className="w-12 h-12 text-green-500 opacity-80" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Success Rate</p>
            <p className="text-3xl font-bold text-gray-900">{stats.overview.successRate}%</p>
          </div>
          <Target className="w-12 h-12 text-purple-500 opacity-80" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Active Users</p>
            <p className="text-3xl font-bold text-gray-900">{stats.topUsers?.filter(u => u.log_count > 0).length || 0}</p>
          </div>
          <Activity className="w-12 h-12 text-orange-500 opacity-80" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-cyan-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">This Month</p>
            <p className="text-3xl font-bold text-gray-900">{stats.overview.recentLogs}</p>
          </div>
          <Calendar className="w-12 h-12 text-cyan-500 opacity-80" />
        </div>
      </div>
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="w-6 h-6 text-blue-600" /> Most Active Users</h2>
        <div className="space-y-3">
          {stats.topUsers?.map((user, index) => (
            <div key={user.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">{index + 1}</div>
                <div><p className="font-semibold text-gray-900">{user.username}</p><p className="text-xs text-gray-500">{user.email}</p></div>
              </div>
              <div className="text-right"><p className="font-bold text-blue-600">{user.log_count}</p><p className="text-xs text-gray-500">trips</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-6 h-6 text-green-600" /> Popular Locations</h2>
        <div className="space-y-3">
          {stats.topLocations?.map((location, index) => (
            <div key={location.location_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">{index + 1}</div>
                <p className="font-semibold text-gray-900">{location.location_name}</p>
              </div>
              <div className="text-right"><p className="font-bold text-green-600">{location.visit_count}</p><p className="text-xs text-gray-500">visits</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><FishIcon className="w-6 h-6 text-purple-600" /> Most Caught Species</h2>
        <div className="space-y-3">
          {stats.topFish?.map((fish, index) => (
            <div key={fish.fish_species} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">{index + 1}</div>
                <p className="font-semibold text-gray-900">{fish.fish_species}</p>
              </div>
              <div className="text-right"><p className="font-bold text-purple-600">{fish.catch_count}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Fishing Method Distribution</h2>
        <div className="space-y-4">
          {stats.methodDistribution?.map((method) => {
            const total = stats.methodDistribution.reduce((sum, m) => sum + parseInt(m.count), 0);
            const percentage = total > 0 ? Math.round((method.count / total) * 100) : 0;
            return (
              <div key={method.fishing_method}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold capitalize">{method.fishing_method === 'land' ? '🏖️ Land' : '🚤 Boat'}</span>
                  <span className="text-gray-600">{method.count} trips ({percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className={`h-3 rounded-full ${method.fishing_method === 'land' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

export default OverviewTab;

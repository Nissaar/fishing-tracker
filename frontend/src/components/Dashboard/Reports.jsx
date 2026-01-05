import React, { useState, useEffect } from 'react';
import { fishingAPI } from '../../services/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Fish, MapPin, Calendar } from 'lucide-react';

const Reports = () => {
  const [logs, setLogs] = useState([]);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        fishingAPI.getLogs(100),
        fishingAPI.getStatistics()
      ]);
      setLogs(logsRes.data.logs);
      setStatistics(statsRes.data.statistics);
    } catch (error) {
      console.error('Failed to load reports');
    }
  };

  const getMonthlyData = () => {
    const monthly = {};
    logs.forEach((log) => {
      const date = new Date(log.log_date);
      const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      if (!monthly[key]) {
        monthly[key] = { month: key, caught: 0, total: 0 };
      }
      monthly[key].total += 1;
      if (log.caught_fish) monthly[key].caught += log.fish_count;
    });
    return Object.values(monthly).reverse().slice(0, 12);
  };

  const getMoonPhaseData = () => {
    const phases = {};
    logs.filter((log) => log.caught_fish).forEach((log) => {
      const phase = log.moon_phase?.split(' ')[1] || 'Unknown';
      phases[phase] = (phases[phase] || 0) + log.fish_count;
    });
    return Object.entries(phases).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  return (
    <div className="space-y-8">
      {statistics && (
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <Calendar className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Total Trips</p>
            <p className="text-3xl font-bold text-blue-700">{statistics.total_trips}</p>
          </div>

          <div className="bg-green-50 p-6 rounded-xl border border-green-200">
            <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Successful Trips</p>
            <p className="text-3xl font-bold text-green-700">{statistics.successful_trips}</p>
          </div>

          <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
            <Fish className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Total Fish</p>
            <p className="text-3xl font-bold text-purple-700">{statistics.total_fish_caught}</p>
          </div>

          <div className="bg-orange-50 p-6 rounded-xl border border-orange-200">
            <MapPin className="w-8 h-8 text-orange-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Locations Visited</p>
            <p className="text-3xl font-bold text-orange-700">{statistics.locations_visited}</p>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Monthly Catch Statistics</h2>
        {getMonthlyData().length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getMonthlyData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="caught" fill="#3b82f6" name="Fish Caught" />
              <Bar dataKey="total" fill="#06b6d4" name="Total Trips" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">No data yet</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Catches by Moon Phase</h2>
        {getMoonPhaseData().length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getMoonPhaseData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {getMoonPhaseData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">No catch data yet</p>
        )}
      </div>
    </div>
  );
};

export default Reports;
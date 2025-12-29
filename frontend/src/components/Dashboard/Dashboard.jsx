import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Fish, Activity, TrendingUp, Table, LogOut, User, MapPin } from 'lucide-react';
import Header from '../Layout/Header';
import LogTrip from './LogTrip';
import Reports from './Reports';
import Predictions from './Predictions';
import DataTable from './DataTable';
import BrowseLocation from './BrowseLocation';
import BestConditions from './BestConditions';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('log');

  const tabs = [
    { id: 'log', name: 'Log Trip', icon: Calendar },
    { id: 'table', name: 'View Data', icon: Table },
    { id: 'reports', name: 'Reports', icon: Activity },
    { id: 'predictions', name: 'Predictions', icon: TrendingUp },
    { id: 'browse', name: 'Browse Locations', icon: MapPin },
    { id: 'best', name: 'Best Conditions', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <Header />
      
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-6 font-semibold transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5 inline mr-2" />
                {tab.name}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'log' && <LogTrip />}
            {activeTab === 'table' && <DataTable />}
            {activeTab === 'reports' && <Reports />}
            {activeTab === 'predictions' && <Predictions />}
            {activeTab === 'browse' && <BrowseLocation />}
            {activeTab === 'best' && <BestConditions />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

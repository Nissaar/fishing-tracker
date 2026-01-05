import React from 'react';
import { Link } from 'react-router-dom';
import { Fish, Moon, Waves, BarChart, MapPin } from 'lucide-react';
import PublicNav from './PublicNav';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <PublicNav />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            About Fishing Tracker Pro 🎣
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-700 mb-6">
              Fishing Tracker Pro is designed specifically for Anglers in Mauritius to help track, analyze, and predict the best fishing conditions.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-700 mb-6">
              We aim to help Mauritian Anglers make data-driven decisions by providing accurate, real-time environmental data and AI-powered insights based on historical catches.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Features
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 my-8">
              <div className="flex gap-4">
                <Fish className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Catch Logging</h3>
                  <p className="text-gray-600 text-sm">Track every catch with details about species, quantity, and conditions</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Moon className="w-8 h-8 text-purple-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Moon Phases</h3>
                  <p className="text-gray-600 text-sm">Accurate moon phase calculations for Mauritius timezone</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Waves className="w-8 h-8 text-cyan-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Tide Data</h3>
                  <p className="text-gray-600 text-sm">Real-time tide levels and predictions for Mauritian waters</p>
                </div>
              </div>

              <div className="flex gap-4">
                <BarChart className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Analytics</h3>
                  <p className="text-gray-600 text-sm">Visual reports and charts to identify patterns</p>
                </div>
              </div>

              <div className="flex gap-4">
                <MapPin className="w-8 h-8 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">60+ Locations</h3>
                  <p className="text-gray-600 text-sm">All major fishing spots around Mauritius mapped</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 text-2xl flex-shrink-0">🤖</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">AI Predictions</h3>
                  <p className="text-gray-600 text-sm">Smart recommendations based on your fishing history</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Data Sources
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Moon phase calculations using astronomical algorithms</li>
              <li>Tide data based on Mauritius Meteorological Services</li>
              <li>Weather data from \open-meteo.com</li>
              <li>Location data for 60+ fishing spots around Mauritius</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              Contact
            </h2>
            <p className="text-gray-700">
              Have questions or suggestions? We'd love to hear from you!
            </p>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <Link
                to="/register"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Tracking Your Catches
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
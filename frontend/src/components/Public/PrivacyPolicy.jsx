import React from 'react';
import PublicNav from './PublicNav';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <PublicNav />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Privacy Policy
          </h1>
          
          <p className="text-sm text-gray-500 mb-8">
            Last updated: December 28, 2025
          </p>

          <div className="prose prose-lg max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700">
                Fishing Tracker Pro collects the following information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Account Information:</strong> Username, email address</li>
                <li><strong>Fishing Logs:</strong> Date, location, catch details, environmental conditions</li>
                <li><strong>Usage Data:</strong> How you interact with our application</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700">We use your information to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide and improve our services</li>
                <li>Generate personalized fishing predictions</li>
                <li>Display analytics and reports</li>
                <li>Send important updates about the service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Storage</h2>
              <p className="text-gray-700">
                Your fishing logs and account information are stored securely in our database. We implement industry-standard security measures to protect your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Sharing</h2>
              <p className="text-gray-700">
                We do NOT sell or share your personal information with third parties. Your fishing logs are private and only visible to you unless you choose to share them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Third-Party Services</h2>
              <p className="text-gray-700">
                We use the following third-party services:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Google OAuth:</strong> For authentication</li>
                <li><strong>WeatherAPI.com:</strong> For weather data</li>
              </ul>
              <p className="text-gray-700 mt-2">
                These services have their own privacy policies which we encourage you to review.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="text-gray-700">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and all associated data</li>
                <li>Export your fishing logs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies</h2>
              <p className="text-gray-700">
                We use essential cookies to maintain your login session. We do not use tracking or advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to Privacy Policy</h2>
              <p className="text-gray-700">
                We may update this privacy policy from time to time. We will notify users of any significant changes via email or in-app notification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about this privacy policy or your data, please contact us through the application.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
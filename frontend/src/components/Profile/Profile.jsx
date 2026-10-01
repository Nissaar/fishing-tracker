import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, KeyRound, UserRound } from 'lucide-react';
import Header from '../Layout/Header';
import { useAuth } from '../../context/AuthContext';
import { PASSWORD_RULES, passwordProblem } from '../../utils/passwordRules';

const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500';
const buttonClass = 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50';

// Validation failures come back as a list of errors rather than one message
const errorMessage = (error, fallback) => {
  const data = error.response?.data;
  const firstInvalid = data?.errors?.[0]?.path;
  return data?.error || (firstInvalid ? `Please check your ${firstInvalid}` : fallback);
};

const DetailsForm = ({ user, updateProfile }) => {
  const [username, setUsername] = useState(user.username || '');
  const [email, setEmail] = useState(user.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const emailChanged = email.trim().toLowerCase() !== (user.email || '').toLowerCase();
  const usernameChanged = username.trim() !== user.username;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.trim().length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    setSaving(true);
    try {
      const data = {};
      if (usernameChanged) data.username = username.trim();
      if (emailChanged) {
        data.email = email.trim();
        data.currentPassword = currentPassword;
      }
      await updateProfile(data);
      setCurrentPassword('');
      toast.success('Profile updated');
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="profile-username" className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
        <input
          id="profile-username"
          type="text"
          autoComplete="username"
          maxLength={50}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
          required
        />
        <p className="text-xs text-gray-500 mt-1">Shown on the leaderboard and events.</p>
      </div>

      <div>
        <label htmlFor="profile-email" className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
        <input
          id="profile-email"
          type="email"
          autoComplete="email"
          maxLength={100}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          disabled={!user.has_password}
          required
        />
        {!user.has_password && (
          <p className="text-xs text-gray-500 mt-1">You sign in with Google, so your email comes from your Google account.</p>
        )}
      </div>

      {emailChanged && (
        <div>
          <label htmlFor="profile-email-password" className="block text-sm font-semibold text-gray-700 mb-1">Current password</label>
          <input
            id="profile-email-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
            required
          />
          <p className="text-xs text-gray-500 mt-1">Needed to change your email. You'll log in with the new email from now on.</p>
        </div>
      )}

      <button type="submit" disabled={saving || (!usernameChanged && !emailChanged)} className={buttonClass}>
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  );
};

const PasswordForm = ({ email, changePassword }) => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = passwordProblem(form.newPassword);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed. Your other devices have been logged out.');
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to change password'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Lets password managers attach the new password to the right account */}
      <input type="text" autoComplete="username" value={email} hidden readOnly />
      <div>
        <label htmlFor="profile-current-password" className="block text-sm font-semibold text-gray-700 mb-1">Current password</label>
        <input
          id="profile-current-password"
          type="password"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          className={inputClass}
          required
        />
      </div>
      <div>
        <label htmlFor="profile-new-password" className="block text-sm font-semibold text-gray-700 mb-1">New password</label>
        <input
          id="profile-new-password"
          type="password"
          autoComplete="new-password"
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          className={inputClass}
          required
        />
        <ul className="text-xs text-gray-600 list-disc list-inside mt-2 space-y-0.5 pl-2">
          {PASSWORD_RULES.map(rule => (
            <li key={rule.label} className={rule.test(form.newPassword) ? 'text-green-600' : ''}>{rule.label}</li>
          ))}
        </ul>
      </div>
      <div>
        <label htmlFor="profile-confirm-password" className="block text-sm font-semibold text-gray-700 mb-1">Confirm new password</label>
        <input
          id="profile-confirm-password"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          className={inputClass}
          required
        />
      </div>
      <button type="submit" disabled={saving} className={buttonClass}>
        {saving ? 'Changing...' : 'Change password'}
      </button>
    </form>
  );
};

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <Header />

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to dashboard
        </Link>

        <section className="bg-white rounded-2xl shadow-2xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <UserRound className="w-6 h-6 text-blue-600" aria-hidden="true" />
            Profile
          </h2>
          {/* Keyed so the form resets to the saved values after an update */}
          <DetailsForm key={`${user.username}|${user.email}`} user={user} updateProfile={updateProfile} />
        </section>

        <section className="bg-white rounded-2xl shadow-2xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-blue-600" aria-hidden="true" />
            Password
          </h2>
          {user.has_password ? (
            <PasswordForm email={user.email} changePassword={changePassword} />
          ) : (
            <p className="text-gray-600">You sign in with Google, so there's no password to change here. Manage your password in your Google account.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default Profile;

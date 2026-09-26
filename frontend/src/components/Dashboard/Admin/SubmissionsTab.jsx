import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { adminAPI } from '../../../services/adminAPI';
import ErrorState from '../../Common/ErrorState';

const SubmissionsTab = () => {
  const [submissions, setSubmissions] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, total: 0 });
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  const onRefresh = useCallback(async () => {
    try {
      setError(null);
      const response = await adminAPI.getSubmissions(filter === 'pending' ? 'pending' : undefined);
      setSubmissions(response.data.submissions || []);
      setCounts(response.data.counts || { pending: 0, total: 0 });
    } catch (err) {
      setError("Couldn't load submissions.");
    }
  }, [filter]);

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  const onAction = async (submissionId, status) => {
    try {
      await adminAPI.reviewSubmission(submissionId, status);
      toast.success(`Submission ${status}`);
      onRefresh();
    } catch (err) {
      // e.g. "This submission was already approved" when another admin got there first
      toast.error(err.response?.data?.error || 'Failed to update submission');
      onRefresh();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Custom Dropdown Submissions</h2>
        <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>
      <p className="text-gray-600 mb-4">Review user-submitted custom values for dropdowns</p>
      {error && <div className="mb-4"><ErrorState message={error} onRetry={onRefresh} compact /></div>}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-lg font-semibold ${filter === 'pending' ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>Pending ({counts.pending})</button>
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-semibold ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>All Submissions</button>
      </div>
      <div className="space-y-4">
        {submissions.length === 0 && !error ? <p className="text-gray-500 text-center py-8">No submissions found</p> : submissions.map((s) => (
          <div key={s.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.submission_type === 'fish_species' ? 'bg-blue-100 text-blue-700' : s.submission_type === 'bait' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{s.submission_type.replace('_', ' ')}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : s.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status === 'approved' && <CheckCircle className="w-3 h-3 inline mr-1" />}{s.status}</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900">{s.submitted_value}</h3>
                <p className="text-sm text-gray-600">Submitted by: <strong>{s.username}</strong> • {new Date(s.created_at).toLocaleString()}</p>
                {s.reviewed_by && <p className="text-sm text-gray-500">Reviewed by: {s.reviewer_username} on {new Date(s.reviewed_at).toLocaleString()}</p>}
              </div>
              {s.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => onAction(s.id, 'approved')} className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><CheckCircle className="w-4 h-4" /> Approve</button>
                  <button onClick={() => onAction(s.id, 'rejected')} className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><XCircle className="w-4 h-4" /> Reject</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubmissionsTab;

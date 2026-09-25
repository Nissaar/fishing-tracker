import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Loader, Send } from 'lucide-react';
import { fishingAPI } from '../../../services/api';
import Modal from '../../Common/Modal';

const humanise = (dropdownType) => dropdownType.replace('_', ' ');
const titleCase = (text) => text.replace(/\b\w/g, l => l.toUpperCase());

/** Suggest a new dropdown option (fishing type, method, bait or species) for admin review. */
const CustomSubmissionModal = ({ dropdownType, onClose }) => {
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim()) {
      toast.error('Please enter a value');
      return;
    }
    try {
      setSubmitting(true);
      await fishingAPI.submitCustomOption({ dropdownType, value, description });
      toast.success('Your custom option has been submitted for admin review!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit custom option');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Submit Custom ${titleCase(humanise(dropdownType))}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label htmlFor="custom-option-value" className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
          <input
            id="custom-option-value"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Enter new ${humanise(dropdownType)}...`}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="custom-option-description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
          <textarea
            id="custom-option-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any additional details..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Your submission will be reviewed by an admin before being added to the dropdown options.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader className="w-5 h-5 animate-spin" aria-label="Submitting" />
            ) : (
              <>
                <Send className="w-5 h-5" aria-hidden="true" />
                Submit
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CustomSubmissionModal;

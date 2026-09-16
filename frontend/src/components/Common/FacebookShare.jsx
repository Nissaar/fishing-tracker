import React, { useMemo, useState } from 'react';
import { Copy, Check, Facebook, Languages } from 'lucide-react';
import { toast } from 'react-toastify';
import { buildLeaderboardPost, buildFacebookShareUrl } from '../../utils/shareText';

/**
 * Generates a ready-to-post Facebook update in Kreol Morisien containing the
 * current leaderboard. Facebook strips pre-filled text from the share dialog
 * for most pages, so copying the text is the primary action and the share
 * button opens the dialog with the link.
 */
const FacebookShare = ({ leaderboard, compact = false }) => {
  const [language, setLanguage] = useState('kreol');
  const [copied, setCopied] = useState(false);
  const [showText, setShowText] = useState(!compact);

  const postText = useMemo(() => buildLeaderboardPost(leaderboard, language), [leaderboard, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(postText);
      setCopied(true);
      toast.success(language === 'kreol' ? 'Teks kopie! Kol li lor Facebook 📋' : 'Text copied! Paste it on Facebook 📋');
      setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      // Clipboard API needs a secure context; fall back to showing the text
      setShowText(true);
      toast.info('Select the text below and copy it manually');
    }
  };

  const handleShare = () => {
    window.open(buildFacebookShareUrl(postText), '_blank', 'noopener,noreferrer,width=660,height=640');
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Facebook className="w-5 h-5 text-blue-600" />
          <h4 className="font-bold text-gray-800">
            {language === 'kreol' ? 'Partaz lor Facebook' : 'Share on Facebook'}
          </h4>
        </div>

        <button
          type="button"
          onClick={() => setLanguage(language === 'kreol' ? 'english' : 'kreol')}
          className="flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900 font-semibold"
        >
          <Languages className="w-4 h-4" />
          {language === 'kreol' ? 'English' : 'Kreol'}
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-3">
        {language === 'kreol'
          ? 'Kopie sa teks-la ek kol li lor to paz Facebook — klasman la ladan deza.'
          : 'Copy this text and paste it on your Facebook page — the leaderboard is already in it.'}
      </p>

      {showText && (
        <textarea
          readOnly
          value={postText}
          onFocus={(e) => e.target.select()}
          rows={12}
          className="w-full text-sm font-mono bg-white border border-gray-300 rounded-lg p-3 mb-3 text-gray-800"
        />
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied
            ? (language === 'kreol' ? 'Kopie!' : 'Copied!')
            : (language === 'kreol' ? 'Kopie teks' : 'Copy text')}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-2 bg-[#1877F2] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#145dbf] transition-colors"
        >
          <Facebook className="w-4 h-4" />
          {language === 'kreol' ? 'Ouver Facebook' : 'Open Facebook'}
        </button>

        {compact && (
          <button
            type="button"
            onClick={() => setShowText(!showText)}
            className="px-5 py-2.5 rounded-lg font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            {showText
              ? (language === 'kreol' ? 'Kasiet teks' : 'Hide text')
              : (language === 'kreol' ? 'Get teks' : 'Preview text')}
          </button>
        )}
      </div>
    </div>
  );
};

export default FacebookShare;

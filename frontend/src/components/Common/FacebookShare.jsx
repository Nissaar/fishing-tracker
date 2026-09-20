import React, { useMemo, useState } from 'react';
import { Copy, Check, Facebook, Languages, Share2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { buildLeaderboardPost, buildFacebookShareUrl, FACEBOOK_PAGE_URL } from '../../utils/shareText';

/**
 * Admin tool: generates a ready-to-post Facebook update in Kreol Morisien with
 * the current leaderboard filled in. The wording is fixed week to week — only
 * the names and numbers change — so it can be pasted straight onto the page.
 *
 * Facebook strips pre-filled text from the share dialog for most pages, so
 * copying the text is the primary action.
 */
const FacebookShare = ({ leaderboard, compact = false }) => {
  const [language, setLanguage] = useState('kreol');
  const [copied, setCopied] = useState(false);
  const [showText, setShowText] = useState(!compact);
  const [includeFeatures, setIncludeFeatures] = useState(true);

  const postText = useMemo(
    () => buildLeaderboardPost(leaderboard, language, includeFeatures),
    [leaderboard, language, includeFeatures]
  );

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

  const handleOpenPage = () => {
    window.open(FACEBOOK_PAGE_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Facebook className="w-5 h-5 text-blue-600" />
          <h4 className="font-bold text-gray-800">
            {language === 'kreol' ? 'Partaz lor Facebook' : 'Share on Facebook'}
          </h4>
          <span className="text-xs font-semibold bg-gray-800 text-white px-2 py-0.5 rounded-full">
            ADMIN
          </span>
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
          ? 'Kopie sa teks-la, ouver paz Nu Lapes App ek kol li — klasman la ladan deza. Sel bann non ek bann sif sanze sak semenn.'
          : 'Copy this text, open the Nu Lapes App page and paste it — the leaderboard is already in it. Only the names and numbers change each week.'}
      </p>

      <label className="flex items-center gap-2 text-sm text-gray-700 mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={includeFeatures}
          onChange={(e) => setIncludeFeatures(e.target.checked)}
          className="w-4 h-4 accent-blue-600"
        />
        {language === 'kreol'
          ? 'Azout blok "nouvo fonksion" (tir li kan nouvote-la fini)'
          : 'Include the "new features" block (uncheck once it is no longer news)'}
      </label>

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
          onClick={handleOpenPage}
          className="flex items-center gap-2 bg-[#1877F2] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#145dbf] transition-colors"
        >
          <Facebook className="w-4 h-4" />
          {language === 'kreol' ? 'Ouver mo paz' : 'Open my page'}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-2 border-2 border-[#1877F2] text-[#1877F2] px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          {language === 'kreol' ? 'Dialog partaz' : 'Share dialog'}
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

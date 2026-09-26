import React, { useCallback, useEffect, useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { adminAPI } from '../../../services/adminAPI';
import ErrorState from '../../Common/ErrorState';

// Entries come back parsed and newest first; show one per line
const formatLogEntries = (entries) => entries
  .map(({ timestamp, level, message, ...rest }) => {
    const extra = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : '';
    return `${timestamp || ''} [${level || 'info'}] ${message ?? ''}${extra}`.trim();
  })
  .join('\n');

const SystemLogsTab = () => {
  const [logFiles, setLogFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  const loadFileList = useCallback(async () => {
    try {
      setError(null);
      const response = await adminAPI.getLogFiles();
      const names = (response.data.files || []).map((file) => file.name);
      setLogFiles(names);
      setSelectedFile(current => (current && names.includes(current) ? current : names[0] || null));
    } catch (err) {
      setLogFiles([]);
      setError("Couldn't load the list of log files.");
    }
  }, []);

  const loadFileContent = useCallback(async (filename) => {
    if (!filename) return;
    setLoadingContent(true);
    try {
      setError(null);
      const response = await adminAPI.getLogFile(filename);
      setFileContent(formatLogEntries(response.data.logs || []));
    } catch (err) {
      setFileContent('');
      setError(`Couldn't load ${filename}.`);
    } finally {
      setLoadingContent(false);
    }
  }, []);

  useEffect(() => {
    loadFileList();
  }, [loadFileList]);

  useEffect(() => {
    loadFileContent(selectedFile);
  }, [selectedFile, loadFileContent]);

  // Refresh picks up new files and new lines in the open file
  const handleRefresh = async () => {
    await loadFileList();
    await loadFileContent(selectedFile);
  };

  const filteredContent = searchTerm
    ? fileContent.split('\n').filter(line => line.toLowerCase().includes(searchTerm.toLowerCase())).join('\n')
    : fileContent;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">System Logs</h2>
        <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" aria-hidden="true" /> Refresh
        </button>
      </div>

      {error && <div className="mb-4"><ErrorState message={error} onRetry={handleRefresh} compact /></div>}

      {/* Search bar */}
      <div className="mb-4">
        <label htmlFor="log-search" className="sr-only">Search logs</label>
        <input
          id="log-search"
          type="text"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-4" style={{ height: '500px' }}>
        {/* File list on the left */}
        <div className="w-64 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700 border-b">
            Log Files
          </div>
          <div className="flex-1 overflow-y-auto">
            {logFiles.length === 0 ? (
              <p className="text-gray-500 text-sm p-4">No log files found</p>
            ) : (
              logFiles.map((file) => (
                <button
                  type="button"
                  key={file}
                  onClick={() => setSelectedFile(file)}
                  aria-pressed={selectedFile === file}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 ${
                    selectedFile === file ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" aria-hidden="true" />
                  {file}
                </button>
              ))
            )}
          </div>
        </div>

        {/* File content on the right */}
        <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700 border-b flex justify-between items-center">
            <span>{selectedFile || 'Select a file'}</span>
            {searchTerm && <span className="text-sm font-normal text-gray-500">{filteredContent.split('\n').length} matching lines</span>}
          </div>
          <div className="flex-1 overflow-auto bg-gray-900 p-4">
            {loadingContent ? (
              <p className="text-gray-400">Loading...</p>
            ) : (
              <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">{filteredContent || 'No content'}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemLogsTab;

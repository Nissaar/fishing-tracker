import React, { useState, useEffect } from 'react';
import { FileText, Search, Download, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const LogsViewer = () => {
  const [logFiles, setLogFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [logContent, setLogContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [linesCount, setLinesCount] = useState(100);

  useEffect(() => {
    fetchLogFiles();
  }, []);

  const fetchLogFiles = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/logs/files`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLogFiles(response.data.files);
    } catch (error) {
      console.error('Failed to fetch log files:', error);
      toast.error('Failed to load log files');
    }
  };

  const fetchLogContent = async (filename) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/logs/content/${filename}?lines=${linesCount}&search=${searchTerm}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setLogContent(response.data);
      setSelectedFile(filename);
    } catch (error) {
      console.error('Failed to fetch log content:', error);
      toast.error('Failed to load log content');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm('Delete log files older than 30 days?')) return;
    
    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/logs/cleanup`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        data: { daysOld: 30 }
      });
      toast.success(response.data.message);
      fetchLogFiles();
    } catch (error) {
      console.error('Failed to cleanup logs:', error);
      toast.error('Failed to cleanup logs');
    }
  };

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'debug': return 'text-gray-600 bg-gray-50';
      case 'http': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Logs</h2>
          <p className="text-gray-600 mt-1">View and manage application logs</p>
        </div>
        <button
          onClick={handleCleanup}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Trash2 className="w-4 h-4" />
          Cleanup Old Logs
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Log Files List */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Log Files</h3>
            <button
              onClick={fetchLogFiles}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logFiles.map((file) => (
              <button
                key={file.name}
                onClick={() => fetchLogContent(file.name)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedFile === file.name
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-gray-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{file.sizeFormatted}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(file.modified).toLocaleString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Log Content */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-4">
          {selectedFile ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <h3 className="font-semibold text-gray-900">{selectedFile}</h3>
                {logContent && (
                  <span className="text-sm text-gray-500">
                    Showing {logContent.logs?.length || 0} of {logContent.totalLines} lines
                  </span>
                )}
              </div>

              {/* Search and Filter */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search logs..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <select
                  value={linesCount}
                  onChange={(e) => setLinesCount(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="50">50 lines</option>
                  <option value="100">100 lines</option>
                  <option value="200">200 lines</option>
                  <option value="500">500 lines</option>
                </select>
                <button
                  onClick={() => fetchLogContent(selectedFile)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>

              {/* Log Entries */}
              <div className="space-y-2 max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4">
                {loading ? (
                  <p className="text-gray-600 text-center">Loading...</p>
                ) : logContent?.logs && logContent.logs.length > 0 ? (
                  logContent.logs.map((log, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white rounded border border-gray-200 text-sm"
                    >
                      <div className="flex items-start gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                          {log.level?.toUpperCase() || 'INFO'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {log.timestamp}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-900 font-mono text-xs break-all">
                        {log.message}
                      </p>
                      {log.stack && (
                        <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-x-auto">
                          {log.stack}
                        </pre>
                      )}
                      {log.url && (
                        <p className="mt-1 text-xs text-gray-600">
                          <span className="font-semibold">{log.method}</span> {log.url}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>No log entries found</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-2" />
                <p>Select a log file to view its content</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogsViewer;

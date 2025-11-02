// Bulk Actions Component (Story 2.7, AC#6)
// Approve all and download ZIP functionality

'use client';

import { useState } from 'react';

type BulkActionsProps = {
  selectedCount: number;
  selectedVideoIds: string[];
  onApproveAll: () => Promise<void>;
  onDownloadZip: () => Promise<void>;
};

/**
 * Bulk Actions (Story 2.7, AC#6)
 * Approve all selected videos or download as ZIP
 */
export function BulkActions({
  selectedCount,
  selectedVideoIds,
  onApproveAll,
  onDownloadZip,
}: BulkActionsProps) {
  const [approving, setApproving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Handle "Approve All" action (Story 2.7, AC#6)
  const handleApproveAll = async () => {
    if (!confirm(`Approve ${selectedCount} selected videos?`)) {
      return;
    }

    setApproving(true);
    try {
      await onApproveAll();
      alert(`Successfully approved ${selectedCount} videos`);
    } catch (error) {
      console.error('Error approving videos:', error);
      alert('Failed to approve all videos');
    } finally {
      setApproving(false);
    }
  };

  // Handle "Download ZIP" action (Story 2.7, AC#6)
  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      // Call API to create ZIP archive
      const response = await fetch('/api/videos/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds: selectedVideoIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to create ZIP');
      }

      // Get the ZIP blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `approved-videos-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert(`Successfully downloaded ${selectedCount} videos`);
    } catch (error) {
      console.error('Error downloading ZIP:', error);
      alert('Failed to download videos');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-blue-900">Bulk Actions</h3>
          <p className="text-sm text-blue-700 mt-1">{selectedCount} videos selected</p>
        </div>

        <div className="flex space-x-3">
          {/* Approve All Button (Story 2.7, AC#6) */}
          <button
            onClick={handleApproveAll}
            disabled={approving}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium py-2 px-6 rounded transition-colors flex items-center space-x-2"
          >
            {approving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Approving...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Approve All</span>
              </>
            )}
          </button>

          {/* Download ZIP Button (Story 2.7, AC#6) */}
          <button
            onClick={handleDownloadZip}
            disabled={downloading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium py-2 px-6 rounded transition-colors flex items-center space-x-2"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating ZIP...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Download ZIP</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

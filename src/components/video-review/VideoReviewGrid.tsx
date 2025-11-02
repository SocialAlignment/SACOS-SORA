// Video Review Interface (Story 2.7)
// Grid display for reviewing generated videos

'use client';

import { useState, useEffect } from 'react';
import { VideoCard } from './VideoCard';
import { BulkActions } from './BulkActions';

export type VideoVariation = {
  notionPageId: string;
  batchId: string;
  combinationId: string;
  bigIdea: string;
  brand: string;
  aesthetic: string;
  type: string;
  demographic: string;
  prompt: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  spritesheetUrl?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Failed';
  approved?: boolean;
  rejected?: boolean;
  rejectionReason?: string;
  errorMessage?: string; // Story 2.8: Error message for failed videos
};

type VideoReviewGridProps = {
  batchId: string;
};

/**
 * Video Review Grid (Story 2.7, AC#1)
 * Displays completed videos in a grid for review and approval
 */
export function VideoReviewGrid({ batchId }: VideoReviewGridProps) {
  const [videos, setVideos] = useState<VideoVariation[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch completed videos for this batch
  useEffect(() => {
    fetchVideos();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchVideos, 5000);
    return () => clearInterval(interval);
  }, [batchId]);

  const fetchVideos = async () => {
    try {
      // In production, this would call /api/notion/batch/{batchId}/videos
      // For now, we'll simulate with local data
      const response = await fetch(`/api/videos/batch/${batchId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();

      // Filter only completed videos (AC#1)
      const completedVideos = data.videos.filter(
        (v: VideoVariation) => v.status === 'Completed' && v.videoUrl
      );

      setVideos(completedVideos);
      setError(null);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (notionPageId: string, selected: boolean) => {
    const newSelected = new Set(selectedVideos);
    if (selected) {
      newSelected.add(notionPageId);
    } else {
      newSelected.delete(notionPageId);
    }
    setSelectedVideos(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedVideos.size === videos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(videos.map((v) => v.notionPageId)));
    }
  };

  const handleApprove = async (notionPageId: string) => {
    try {
      const response = await fetch('/api/videos/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notionPageId }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve video');
      }

      // Update local state
      setVideos((prev) =>
        prev.map((v) =>
          v.notionPageId === notionPageId ? { ...v, approved: true, rejected: false } : v
        )
      );
    } catch (err) {
      console.error('Error approving video:', err);
      alert('Failed to approve video');
    }
  };

  const handleReject = async (notionPageId: string, reason?: string) => {
    try {
      const response = await fetch('/api/videos/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notionPageId, reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject video');
      }

      // Update local state
      setVideos((prev) =>
        prev.map((v) =>
          v.notionPageId === notionPageId
            ? { ...v, approved: false, rejected: true, rejectionReason: reason }
            : v
        )
      );
    } catch (err) {
      console.error('Error rejecting video:', err);
      alert('Failed to reject video');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading videos: {error}</p>
        <button
          onClick={fetchVideos}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No completed videos yet.</p>
        <p className="text-sm text-gray-500 mt-2">
          Videos will appear here once generation and download are complete.
        </p>
      </div>
    );
  }

  const approvedCount = videos.filter((v) => v.approved).length;
  const rejectedCount = videos.filter((v) => v.rejected).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Video Review</h2>
            <p className="text-sm text-gray-600 mt-1">
              {videos.length} videos | {approvedCount} approved | {rejectedCount} rejected
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedVideos.size === videos.length}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Select All</span>
            </label>

            {selectedVideos.size > 0 && (
              <span className="text-sm text-gray-600">
                {selectedVideos.size} selected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions (Story 2.7, AC#6) */}
      {selectedVideos.size > 0 && (
        <BulkActions
          selectedCount={selectedVideos.size}
          selectedVideoIds={Array.from(selectedVideos)}
          onApproveAll={async () => {
            for (const id of selectedVideos) {
              await handleApprove(id);
            }
            setSelectedVideos(new Set());
          }}
          onDownloadZip={async () => {
            // Will be implemented in bulk actions component
          }}
        />
      )}

      {/* Video Grid (Story 2.7, AC#1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <VideoCard
            key={video.notionPageId}
            video={video}
            selected={selectedVideos.has(video.notionPageId)}
            onSelect={(selected) => handleVideoSelect(video.notionPageId, selected)}
            onApprove={() => handleApprove(video.notionPageId)}
            onReject={(reason) => handleReject(video.notionPageId, reason)}
          />
        ))}
      </div>
    </div>
  );
}

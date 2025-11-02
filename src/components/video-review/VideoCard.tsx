// Video Card Component (Story 2.7)
// Updated for Story 2.8: Added error display and retry functionality
// Individual video card with thumbnail, playback, actions, and error handling

'use client';

import { useState, useRef } from 'react';
import { SpritesheetScrubber } from './SpritesheetScrubber';
import { ErrorDisplay } from './ErrorDisplay';
import { categorizeError } from '@/lib/video-error-handler';
import type { VideoVariation } from './VideoReviewGrid';

type VideoCardProps = {
  video: VideoVariation;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onApprove: () => void;
  onReject: (reason?: string) => void;
  onRetry?: (modifiedPrompt?: string) => Promise<void>; // Story 2.8, AC#3
};

/**
 * Video Card (Story 2.7, AC#1-4 + Story 2.8, AC#1-3)
 * Displays video thumbnail with playback, approve/reject actions, and error handling
 */
export function VideoCard({
  video,
  selected,
  onSelect,
  onApprove,
  onReject,
  onRetry,
}: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSpritesheet, setShowSpritesheet] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [showRetryDialog, setShowRetryDialog] = useState(false);
  const [modifiedPrompt, setModifiedPrompt] = useState(video.prompt || '');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Categorize error if video failed (Story 2.8, AC#1, AC#4)
  const videoError =
    video.status === 'Failed' && video.errorMessage
      ? categorizeError(video.errorMessage)
      : null;

  // Handle thumbnail click (Story 2.7, AC#2)
  const handleThumbnailClick = () => {
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  // Handle video playback controls
  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  // Handle approve action (Story 2.7, AC#4)
  const handleApprove = () => {
    onApprove();
  };

  // Handle reject action (Story 2.7, AC#5)
  const handleReject = () => {
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    onReject(rejectionReason || undefined);
    setShowRejectDialog(false);
    setRejectionReason('');
  };

  // Handle retry with optional prompt editing (Story 2.8, AC#3)
  const handleRetry = async () => {
    if (!onRetry) return;

    setRetrying(true);
    try {
      const promptToUse = modifiedPrompt !== video.prompt ? modifiedPrompt : undefined;
      await onRetry(promptToUse);
      setShowRetryDialog(false);
    } catch (error) {
      console.error('Error retrying video:', error);
      alert('Failed to retry video generation');
    } finally {
      setRetrying(false);
    }
  };

  // Quick retry without prompt modification
  const handleQuickRetry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Error retrying video:', error);
      alert('Failed to retry video generation');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      className={`bg-white border-2 rounded-lg overflow-hidden shadow-sm transition-all ${
        selected ? 'border-blue-500' : 'border-gray-200'
      } ${video.approved ? 'ring-2 ring-green-500' : ''} ${
        video.rejected ? 'ring-2 ring-red-500' : ''
      } ${video.status === 'Failed' ? 'border-red-300' : ''}`}
    >
      {/* Checkbox for selection - Hide for failed videos */}
      {video.status !== 'Failed' && (
        <div className="p-2 border-b border-gray-200 bg-gray-50">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(e.target.checked)}
              className="rounded"
            />
            <span className="text-xs text-gray-600">Select</span>
          </label>
        </div>
      )}

      {/* Error Display or Video/Thumbnail Area (Story 2.8 + Story 2.7) */}
      {video.status === 'Failed' && videoError ? (
        // Show error display for failed videos (Story 2.8, AC#1, AC#2)
        <div className="p-4">
          <ErrorDisplay
            error={videoError}
            onRetry={videoError.retryable && onRetry ? handleQuickRetry : undefined}
            retrying={retrying}
          />
        </div>
      ) : (
        // Show video preview for completed videos (Story 2.7)
        <div
          className="relative aspect-video bg-gray-100"
          onMouseEnter={() => setShowSpritesheet(true)}
          onMouseLeave={() => setShowSpritesheet(false)}
        >
        {!isPlaying ? (
          <>
            {/* Thumbnail (AC#1) */}
            {video.thumbnailUrl && (
              <img
                src={video.thumbnailUrl}
                alt={video.bigIdea}
                className="w-full h-full object-cover cursor-pointer"
                onClick={handleThumbnailClick}
              />
            )}

            {/* Play Button Overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer"
              onClick={handleThumbnailClick}
            >
              <div className="bg-white rounded-full p-4 shadow-lg hover:scale-110 transition-transform">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>

            {/* Spritesheet Scrubber (Story 2.7, AC#3) */}
            {showSpritesheet && video.spritesheetUrl && (
              <SpritesheetScrubber spritesheetUrl={video.spritesheetUrl} />
            )}
          </>
        ) : (
          <>
            {/* Video Player (Story 2.7, AC#2) */}
            <video
              ref={videoRef}
              src={video.videoUrl}
              className="w-full h-full object-cover cursor-pointer"
              onClick={handleVideoClick}
              controls
              onEnded={() => setIsPlaying(false)}
            />
          </>
        )}

        {/* Status Badges */}
        {video.approved && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Approved
          </div>
        )}
        {video.rejected && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            Rejected
          </div>
        )}
        </div>
      )}

      {/* Video Details */}
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">{video.bigIdea}</h3>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span className="font-medium">Brand:</span> {video.brand}
          </div>
          <div>
            <span className="font-medium">Aesthetic:</span> {video.aesthetic}
          </div>
          <div>
            <span className="font-medium">Type:</span> {video.type}
          </div>
          <div>
            <span className="font-medium">Demographic:</span> {video.demographic}
          </div>
        </div>

        {/* Rejection Reason */}
        {video.rejected && video.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-800">
            <span className="font-medium">Reason:</span> {video.rejectionReason}
          </div>
        )}
      </div>

      {/* Action Buttons (Story 2.7, AC#4 + Story 2.8, AC#3) */}
      {video.status === 'Failed' && videoError?.retryable && onRetry ? (
        // Show retry options for failed retryable videos (Story 2.8, AC#3)
        <div className="p-3 pt-0 flex space-x-2">
          <button
            onClick={handleQuickRetry}
            disabled={retrying}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium py-2 px-4 rounded transition-colors flex items-center justify-center space-x-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            <span>{retrying ? 'Retrying...' : 'Retry'}</span>
          </button>
          <button
            onClick={() => setShowRetryDialog(true)}
            disabled={retrying}
            className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white text-sm font-medium py-2 px-4 rounded transition-colors flex items-center justify-center space-x-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            <span>Edit & Retry</span>
          </button>
        </div>
      ) : !video.approved && !video.rejected && video.status !== 'Failed' ? (
        // Show approve/reject for completed videos (Story 2.7, AC#4)
        <div className="p-3 pt-0 flex space-x-2">
          <button
            onClick={handleApprove}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
          >
            Approve
          </button>
          <button
            onClick={handleReject}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
          >
            Reject
          </button>
        </div>
      ) : null}

      {/* Rejection Dialog (Story 2.7, AC#5) */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Video</h3>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason (optional)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Low quality, doesn't match brief, technical issues..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4"
              rows={3}
            />

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium py-2 px-4 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retry with prompt editing dialog (Story 2.8, AC#3) */}
      {showRetryDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Prompt & Retry</h3>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modify the prompt to fix the issue before retrying:
            </label>
            <textarea
              value={modifiedPrompt}
              onChange={(e) => setModifiedPrompt(e.target.value)}
              placeholder="Edit the video generation prompt..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4 font-mono"
              rows={6}
            />

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRetryDialog(false);
                  setModifiedPrompt(video.prompt || '');
                }}
                disabled={retrying}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium py-2 px-4 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRetry}
                disabled={retrying || !modifiedPrompt.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
              >
                {retrying ? 'Retrying...' : 'Retry with Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

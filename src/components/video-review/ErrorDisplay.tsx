// Error Display Component (Story 2.8, AC#1, AC#2)
// Shows categorized errors with details and suggested actions

'use client';

import { useState } from 'react';
import {
  ErrorCategory,
  ErrorSeverity,
  VideoError,
  getUserFriendlyMessage,
} from '@/lib/video-error-handler';

type ErrorDisplayProps = {
  error: VideoError;
  onRetry?: () => void;
  retrying?: boolean;
};

/**
 * Error Display Component (Story 2.8, AC#1, AC#2)
 * Shows categorized video generation errors with full details
 */
export function ErrorDisplay({ error, onRetry, retrying }: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Get severity styling
  const getSeverityStyles = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          text: 'text-red-900',
          badge: 'bg-red-100 text-red-800',
          icon: '🚫',
        };
      case ErrorSeverity.RETRYABLE:
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          text: 'text-yellow-900',
          badge: 'bg-yellow-100 text-yellow-800',
          icon: '⚠️',
        };
      case ErrorSeverity.WARNING:
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-300',
          text: 'text-orange-900',
          badge: 'bg-orange-100 text-orange-800',
          icon: '⚡',
        };
    }
  };

  const styles = getSeverityStyles();
  const userMessage = getUserFriendlyMessage(error.category);

  return (
    <div className={`${styles.bg} border-2 ${styles.border} rounded-lg p-4`}>
      {/* Header with icon and category (AC#1) */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">{styles.icon}</span>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-1 rounded ${styles.badge}`}>
                {error.category}
              </span>
              {!error.retryable && (
                <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700">
                  Non-Retryable
                </span>
              )}
            </div>
            <h4 className={`font-semibold ${styles.text}`}>{userMessage}</h4>
          </div>
        </div>

        {/* Retry button (AC#3) */}
        {error.retryable && onRetry && (
          <button
            onClick={onRetry}
            disabled={retrying}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors flex items-center space-x-1"
          >
            {retrying ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                <span>Retrying...</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Retry</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Error message and suggested action */}
      <div className="space-y-2">
        <p className={`text-sm ${styles.text}`}>
          <strong>Error:</strong> {error.message}
        </p>
        {error.suggestedAction && (
          <p className={`text-sm ${styles.text}`}>
            <strong>Suggested Action:</strong> {error.suggestedAction}
          </p>
        )}

        {/* Timestamp (AC#2) */}
        <p className="text-xs text-gray-600">
          <strong>Occurred:</strong> {error.timestamp.toLocaleString()}
        </p>
      </div>

      {/* Details toggle (AC#2 - full API response) */}
      {error.details && (
        <div className="mt-3 border-t border-gray-300 pt-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>{showDetails ? 'Hide' : 'Show'} API Response Details</span>
          </button>

          {showDetails && (
            <pre className="mt-2 p-3 bg-gray-900 text-gray-100 text-xs rounded overflow-x-auto">
              {error.details}
            </pre>
          )}
        </div>
      )}

      {/* Category-specific help text */}
      {error.category === ErrorCategory.CONTENT_POLICY_VIOLATION && (
        <div className="mt-3 p-3 bg-white rounded border border-red-200">
          <p className="text-xs text-gray-700">
            <strong>Content Policy Help:</strong> Review OpenAI's content policy guidelines.
            Remove any references to violence, adult content, or prohibited topics. Edit the
            prompt to comply with guidelines before retrying.
          </p>
        </div>
      )}

      {error.category === ErrorCategory.MISSING_BRAND_DATA && (
        <div className="mt-3 p-3 bg-white rounded border border-yellow-200">
          <p className="text-xs text-gray-700">
            <strong>Brand Data Help:</strong> Ensure the selected brand has been properly
            ingested into Qdrant. Check that brand documentation and canon exist in the vector
            database.
          </p>
        </div>
      )}

      {error.category === ErrorCategory.SCRIPT_VALIDATION_FAILURE && (
        <div className="mt-3 p-3 bg-white rounded border border-orange-200">
          <p className="text-xs text-gray-700">
            <strong>Validation Help:</strong> Check prompt length (max 500 chars), duration (5,
            10, or 20 seconds), and aspect ratio (16:9, 9:16, or 1:1). Ensure all
            parameters meet Sora 2 API requirements.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Error Badge (for grid views)
 */
export function ErrorBadge({ error }: { error: VideoError }) {
  const styles =
    error.severity === ErrorSeverity.CRITICAL
      ? 'bg-red-100 text-red-800'
      : 'bg-yellow-100 text-yellow-800';

  return (
    <div className={`text-xs font-semibold px-2 py-1 rounded ${styles}`}>
      {error.category}
    </div>
  );
}

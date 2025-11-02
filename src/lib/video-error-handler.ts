// Video Error Handler (Story 2.8)
// Categorizes errors and determines retry eligibility

/**
 * Error Categories (Story 2.8, AC#1)
 */
export enum ErrorCategory {
  CONTENT_POLICY_VIOLATION = 'Content Policy Violation',
  API_ERROR = 'API Error',
  MISSING_BRAND_DATA = 'Missing Brand Data',
  SCRIPT_VALIDATION_FAILURE = 'Script Validation Failure',
  UNKNOWN = 'Unknown Error',
}

/**
 * Error Severity Levels
 */
export enum ErrorSeverity {
  CRITICAL = 'critical', // Non-retryable
  RETRYABLE = 'retryable', // Can retry
  WARNING = 'warning', // Minor issue
}

/**
 * Categorized Video Error (Story 2.8, AC#1, AC#2)
 */
export type VideoError = {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  apiResponse?: any;
  timestamp: Date;
  retryable: boolean;
  suggestedAction?: string;
};

/**
 * Retry Attempt Record (Story 2.8, AC#5)
 */
export type RetryAttempt = {
  attemptNumber: number;
  timestamp: Date;
  previousError: string;
  modifiedPrompt?: string;
  outcome: 'pending' | 'success' | 'failed';
  newError?: string;
};

/**
 * Error patterns for categorization (Story 2.8, AC#1)
 */
const ERROR_PATTERNS = {
  [ErrorCategory.CONTENT_POLICY_VIOLATION]: [
    /content policy/i,
    /policy violation/i,
    /inappropriate content/i,
    /violates guidelines/i,
    /not allowed/i,
  ],
  [ErrorCategory.API_ERROR]: [
    /api error/i,
    /timeout/i,
    /rate limit/i,
    /503/i,
    /500/i,
    /502/i,
    /gateway/i,
    /network error/i,
    /connection/i,
  ],
  [ErrorCategory.MISSING_BRAND_DATA]: [
    /missing brand/i,
    /brand not found/i,
    /no brand data/i,
    /invalid brand/i,
    /brand reference/i,
  ],
  [ErrorCategory.SCRIPT_VALIDATION_FAILURE]: [
    /validation failed/i,
    /invalid prompt/i,
    /prompt too long/i,
    /invalid duration/i,
    /invalid aspect ratio/i,
  ],
};

/**
 * Categorizes an error message (Story 2.8, AC#1, AC#4)
 */
export function categorizeError(
  errorMessage: string,
  apiResponse?: any
): VideoError {
  const timestamp = new Date();
  let category = ErrorCategory.UNKNOWN;
  let severity = ErrorSeverity.RETRYABLE;
  let retryable = true;
  let suggestedAction = 'Click "Retry" to attempt regeneration';

  // Check each error pattern
  for (const [cat, patterns] of Object.entries(ERROR_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(errorMessage))) {
      category = cat as ErrorCategory;
      break;
    }
  }

  // Determine severity and retry eligibility (Story 2.8, AC#4)
  switch (category) {
    case ErrorCategory.CONTENT_POLICY_VIOLATION:
      severity = ErrorSeverity.CRITICAL;
      retryable = false;
      suggestedAction =
        'Edit prompt to comply with content policies before retrying';
      break;

    case ErrorCategory.MISSING_BRAND_DATA:
      severity = ErrorSeverity.CRITICAL;
      retryable = false;
      suggestedAction = 'Ensure brand data is properly configured in Qdrant';
      break;

    case ErrorCategory.SCRIPT_VALIDATION_FAILURE:
      severity = ErrorSeverity.CRITICAL;
      retryable = false;
      suggestedAction = 'Edit prompt or parameters to meet validation requirements';
      break;

    case ErrorCategory.API_ERROR:
      severity = ErrorSeverity.RETRYABLE;
      retryable = true;
      suggestedAction = 'Retry automatically - temporary API issue';
      break;

    default:
      severity = ErrorSeverity.RETRYABLE;
      retryable = true;
      suggestedAction = 'Click "Retry" to attempt regeneration';
  }

  return {
    category,
    severity,
    message: errorMessage,
    details: apiResponse ? JSON.stringify(apiResponse, null, 2) : undefined,
    apiResponse,
    timestamp,
    retryable,
    suggestedAction,
  };
}

/**
 * Formats error for display (Story 2.8, AC#1, AC#2)
 */
export function formatErrorForDisplay(error: VideoError): string {
  const lines = [
    `Category: ${error.category}`,
    `Message: ${error.message}`,
    `Timestamp: ${error.timestamp.toISOString()}`,
    `Retryable: ${error.retryable ? 'Yes' : 'No'}`,
  ];

  if (error.suggestedAction) {
    lines.push(`Suggested Action: ${error.suggestedAction}`);
  }

  if (error.details) {
    lines.push(`\nAPI Response:\n${error.details}`);
  }

  return lines.join('\n');
}

/**
 * Formats error for Notion logging (Story 2.8, AC#2, AC#5)
 */
export function formatErrorForNotion(
  error: VideoError,
  retryAttempts?: RetryAttempt[]
): {
  errorCategory: string;
  errorMessage: string;
  errorDetails: string;
  retryable: boolean;
  retryCount: number;
  lastRetryAt?: string;
} {
  return {
    errorCategory: error.category,
    errorMessage: error.message,
    errorDetails: error.details || error.message,
    retryable: error.retryable,
    retryCount: retryAttempts?.length || 0,
    lastRetryAt: retryAttempts?.[retryAttempts.length - 1]?.timestamp.toISOString(),
  };
}

/**
 * Creates retry attempt record (Story 2.8, AC#5)
 */
export function createRetryAttempt(
  attemptNumber: number,
  previousError: string,
  modifiedPrompt?: string
): RetryAttempt {
  return {
    attemptNumber,
    timestamp: new Date(),
    previousError,
    modifiedPrompt,
    outcome: 'pending',
  };
}

/**
 * Updates retry attempt with outcome (Story 2.8, AC#5)
 */
export function updateRetryOutcome(
  attempt: RetryAttempt,
  outcome: 'success' | 'failed',
  newError?: string
): RetryAttempt {
  return {
    ...attempt,
    outcome,
    newError,
  };
}

/**
 * Gets user-friendly error message
 */
export function getUserFriendlyMessage(category: ErrorCategory): string {
  const messages: Record<ErrorCategory, string> = {
    [ErrorCategory.CONTENT_POLICY_VIOLATION]:
      'This video violated content policies. Please edit the prompt to comply with guidelines.',
    [ErrorCategory.API_ERROR]:
      'A temporary API error occurred. You can retry this video.',
    [ErrorCategory.MISSING_BRAND_DATA]:
      'Brand data is missing or incomplete. Please ensure brand is properly configured.',
    [ErrorCategory.SCRIPT_VALIDATION_FAILURE]:
      'The prompt or parameters failed validation. Please edit and try again.',
    [ErrorCategory.UNKNOWN]:
      'An unexpected error occurred. You can try again or contact support.',
  };

  return messages[category];
}

/**
 * Determines if automatic retry should be attempted (Story 2.8, AC#4)
 */
export function shouldAutoRetry(error: VideoError, retryCount: number): boolean {
  // Only auto-retry API errors
  if (error.category !== ErrorCategory.API_ERROR) {
    return false;
  }

  // Max 3 auto-retries
  if (retryCount >= 3) {
    return false;
  }

  // Auto-retry is eligible
  return true;
}

/**
 * Calculates retry delay with exponential backoff
 */
export function getRetryDelay(attemptNumber: number): number {
  // 2s, 4s, 8s, 16s...
  return Math.min(Math.pow(2, attemptNumber) * 1000, 30000);
}

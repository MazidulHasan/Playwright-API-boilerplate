// src/core/ApiError.js

/**
 * Custom error class for issues related to API requests or responses,
 * such as unexpected status codes or invalid response bodies.
 */
export class ApiRequestError extends Error {
  /** @type {number | undefined} The HTTP status code received from the API. */
  statusCode;
  /** @type {string | undefined} The raw response body text, useful for debugging. */
  responseBody;

  /**
   * Creates an instance of ApiRequestError.
   * @param {string} message - The primary error message.
   * @param {number} [statusCode] - The HTTP status code.
   * @param {string} [responseBody] - The raw response body.
   */
  constructor(message, statusCode, responseBody) {
    // Include status code in the main message for quick identification
    const statusString = statusCode ? ` (Status: ${statusCode})` : '';
    super(`${message}${statusString}`);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
    // Maintain proper stack trace in V8 environments (Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiRequestError);
    }
  }
}

/**
 * Custom error class specifically for data validation failures,
 * typically used when schema validation (e.g., Ajv) fails.
 */
export class ValidationError extends Error {
  /**
   * @type {Array<import('ajv').ErrorObject> | any} - Detailed validation errors, usually an array from Ajv (`validateFn.errors`).
   */
  details;

  /**
   * Creates an instance of ValidationError.
   * @param {string} message - The primary validation error message.
   * @param {Array<import('ajv').ErrorObject> | any} [details] - The detailed validation errors.
   */
  constructor(message, details) {
    // Include a summary or count of details in the main message
    const detailSummary = Array.isArray(details) ? ` (${details.length} validation issues)` : '';
    super(`${message}${detailSummary}`);
    this.name = 'ValidationError';
    this.details = details; // Store the detailed errors (e.g., Ajv errors array)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
    // Optionally log the full details when the error is created for easier debugging
    // import { logger } from '../utilities/logger.js'; // Import logger if using this
    // logger.error(`Validation Error Details: ${JSON.stringify(details)}`);
  }
}
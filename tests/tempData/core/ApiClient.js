// src/core/ApiClient.js
import { logger } from '../../../support/commonUtility/API/logger.js';
import { ApiRequestError } from '../../../resources/API/core/ApiError.js';

export class ApiClient {
  /** @type {import('@playwright/test').APIRequestContext} */
  request; // Holds the Playwright APIRequestContext

  /**
   * Constructor for the base API client.
   * @param {import('@playwright/test').APIRequestContext} requestContext - The configured Playwright request context.
   */
  constructor(requestContext) {
    if (!requestContext) {
      throw new Error("APIRequestContext is required for ApiClient");
    }
    this.request = requestContext;
  }

  /**
   * Centralized handler for API responses. Checks status codes, parses JSON, logs details, and throws specific errors on failure.
   * @param {Promise<import('@playwright/test').APIResponse>} responsePromise - The promise returned by a Playwright request method (get, post, etc.).
   * @param {number | number[]} [expectedStatus] - Optional. The expected HTTP status code(s). If provided, the response status must match one of them. If omitted, checks `response.ok()` (status 200-299).
   * @returns {Promise<any>} - The parsed JSON response body if successful and content exists. Returns `null` for 204 No Content.
   * @throws {ApiRequestError} - If the status code doesn't match `expectedStatus` or if `!response.ok()` when `expectedStatus` is omitted. Also thrown for JSON parsing errors on success statuses.
   * @throws {Error} - For underlying network errors or unexpected issues.
   */
  async handleResponse(responsePromise, expectedStatus) {
    let response; // Declare response variable outside try block
    try {
      response = await responsePromise; // Wait for the response
      const request = response.request(); // Get the original request details
      const method = request.method();
      const url = response.url();
      const status = response.status();

      logger.info(`Response: ${status} ${method} ${url}`);

      // Determine if the status check passes
      const statusCheckPassed = () => {
        if (expectedStatus !== undefined) {
          const statuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
          return statuses.includes(status);
        }
        return response.ok(); // Default check: 200-299
      };

      // Handle failed status check
      if (!statusCheckPassed()) {
        const responseBody = await response.text(); // Get body text for error logging
        const expected = expectedStatus !== undefined
          ? (Array.isArray(expectedStatus) ? expectedStatus.join(' or ') : expectedStatus)
          : '2xx'; // Describe expected status
        logger.error(`API Error: Status ${status} on ${method} ${url} (Expected ${expected}). Body: ${responseBody}`);
        throw new ApiRequestError(
          `Expected status ${expected} but received ${status}`,
          status,
          responseBody
        );
      }

      // Handle successful responses (status check passed)
      if (status === 204 || response.headers()['content-length'] === '0') {
        logger.debug(`Response body is empty (Status ${status}).`);
        return null; // No body content for 204 or empty content-length
      }

      // Attempt to parse JSON body for successful responses with content
      try {
        const jsonData = await response.json();
        logger.debug(`Response body parsed successfully.`);
        return jsonData;
      } catch (error) {
        // Handle JSON parsing errors even if status was successful
        if (error instanceof SyntaxError) {
          const rawBody = await response.text();
          logger.error(`Failed to parse JSON response from ${url} (Status ${status}). Body: ${rawBody}`);
          // Throw ApiRequestError because the API returned invalid JSON despite a 'success' status
          throw new ApiRequestError(`Invalid JSON received from ${url}`, status, rawBody);
        }
        throw error; // Re-throw other potential errors during parsing
      }

    } catch (error) {
      // Catch errors from await responsePromise (network errors, timeouts) or errors thrown above
      if (error instanceof ApiRequestError) {
        throw error; // Re-throw our specific API errors
      }
      // Log and wrap other errors (e.g., network issues)
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Attempt to get URL/Method if available from a potential Playwright error context
      const requestInfo = response?.request() ? `${response.request().method()} ${response.url()}` : 'Request details unavailable';
      logger.error(`API Request Failed: ${requestInfo} - ${errorMessage}`);
      throw new Error(`API Request Failed: ${errorMessage}`); // Throw a generic error
    }
  }
}
// src/utilities/responseUtils.js
import { expect } from '@playwright/test';
import { ValidationError } from '../../resources/API/core/ApiError.js'; // Import custom validation error
import { logger } from '../../support/commonUtility/API/logger.js';

/**
 * Asserts that the APIResponse has a successful status code (2xx).
 * @param {import('@playwright/test').APIResponse} response - The APIResponse object.
 * @param {string} [errorMessagePrefix=''] - Optional prefix for assertion error messages.
 * @returns {Promise<void>}
 */
export async function expectSuccessfulResponse(response, errorMessagePrefix = '') {
  const prefix = errorMessagePrefix ? `${errorMessagePrefix}: ` : '';
  try {
    expect(response.ok(), `${prefix}Status ${response.status()} is not OK (expected 2xx)`).toBe(true);
    logger.info(`${prefix}Response status ${response.status()} OK for ${response.url()}`);
  } catch (error) {
    logger.error(`${prefix}Assertion failed: ${response.status()} not OK. Body: ${await response.text()}`);
    throw error; // Re-throw Playwright assertion error
  }
}

/**
 * Asserts that the APIResponse has a specific status code.
 * @param {import('@playwright/test').APIResponse} response - The APIResponse object.
 * @param {number} expectedStatus - The expected HTTP status code.
 * @param {string} [errorMessagePrefix=''] - Optional prefix for assertion error messages.
 * @returns {Promise<void>}
 */
export async function expectStatus(response, expectedStatus, errorMessagePrefix = '') {
  const prefix = errorMessagePrefix ? `${errorMessagePrefix}: ` : '';
  try {
    expect(response.status(), `${prefix}Expected status ${expectedStatus} but got ${response.status()}`).toBe(expectedStatus);
    logger.info(`${prefix}Response status ${response.status()} matches expected ${expectedStatus}`);
  } catch (error) {
    logger.error(`${prefix}Assertion failed: Expected ${expectedStatus}, got ${response.status()}. Body: ${await response.text()}`);
    throw error;
  }
}

/**
 * Validates the response body against a compiled Ajv validation function.
 * Handles JSON parsing and throws ValidationError on failure.
 * @param {import('@playwright/test').APIResponse} response - The APIResponse object.
 * @param {import('ajv').ValidateFunction} validateFn - The compiled Ajv validation function (e.g., validateMedicationResponseSchema).
 * @param {string} [errorMessagePrefix=''] - Optional prefix for assertion error messages.
 * @returns {Promise<any>} The validated data if successful. Null for 204/empty responses.
 * @throws {ValidationError} If Ajv validation fails.
 * @throws {Error} If JSON parsing fails.
 */
export async function validateResponseSchema(response, validateFn, errorMessagePrefix = '') {
  const prefix = errorMessagePrefix ? `${errorMessagePrefix}: ` : '';
  let responseData;

  // 1. Parse JSON (handle empty body)
  try {
    if (response.status() === 204 || response.headers()['content-length'] === '0') {
      responseData = null;
      logger.debug(`${prefix}Response body is empty (Status ${response.status()}), skipping schema validation.`);
      // Check if schema allows null if responseData is null
      if (responseData === null) {
          const isValidNull = validateFn(null);
          if (!isValidNull) {
              logger.error(`${prefix}Schema validation failed for null response body.`);
              throw new ValidationError(`${prefix}Schema does not allow null response`, validateFn.errors);
          }
          logger.info(`${prefix}Null response body validated successfully.`);
          return null; // Return null if allowed by schema
      }
    } else {
      responseData = await response.json(); // Parse body as JSON
    }
  } catch (error) {
    const rawBody = await response.text();
    logger.error(`${prefix}Failed to parse JSON response for schema validation. Status: ${response.status()}. Body: ${rawBody}`);
    throw new Error(`${prefix}Failed to parse JSON response for schema validation: ${error.message}`);
  }

  // 2. Perform Ajv Validation
  const isValid = validateFn(responseData);

  if (isValid) {
    logger.info(`${prefix}Response body schema validated successfully for ${response.url()}`);
    return responseData; // Return the parsed and validated data
  } else {
    // Ajv validation failed
    const errors = validateFn.errors; // Get Ajv errors
    logger.error(`${prefix}Schema validation failed: ${JSON.stringify(errors)}`);
    // Throw custom ValidationError with details
    throw new ValidationError(
      `${prefix}Response schema validation failed`,
      errors
    );
  }
}
// src/api_clients/MedicationClient.js
import { ApiClient } from '../../../resources/API/core/ApiClient.js';
import { logger } from '../../../support/commonUtility/API/logger.js';

/**
 * API Client for interacting with Medication endpoints.
 * Extends the base ApiClient for common request/response handling.
 */
export class MedicationClient extends ApiClient {
  /** @type {string} Base path for medication endpoints */
  baseUrl;

  /**
   * Creates an instance of MedicationClient.
   * @param {import('@playwright/test').APIRequestContext} requestContext - The Playwright APIRequestContext.
   * @param {string} [baseUrl='/medications'] - Base URL path for medication endpoints.
   */
  constructor(requestContext, baseUrl = '/medications') { // Default base path
    super(requestContext); // Pass context to the base ApiClient
    this.baseUrl = baseUrl;
    logger.debug(`MedicationClient initialized with base URL: ${this.baseUrl}`);
  }
  

  /**
   * Creates a new medication entry via POST request.
   * Expects a 201 status code and returns the parsed response body.
   * @param {object} medicationData - Payload conforming to medicationRequestSchema.
   * @returns {Promise<object>} The created medication object from the response body.
   */
  async createMedication(medicationData) {
    logger.info(`Sending POST to create medication at ${this.baseUrl}`);
    const responsePromise = this.request.post(this.baseUrl, {
      data: medicationData,
    });
    // Use base handler, expecting 201 Created
    return this.handleResponse(responsePromise, 201);
  }

  /**
   * Creates a medication via POST but returns the raw APIResponse object.
   * Useful for tests needing direct access to status/headers before validation.
   * @param {object} medicationData - Payload conforming to medicationRequestSchema.
   * @returns {Promise<import('@playwright/test').APIResponse>} The raw Playwright APIResponse.
   */
  async getMedicationCreateResponse(medicationData) {
    logger.info(`Sending POST (raw response) to create medication at ${this.baseUrl}`);
    return this.request.post(this.baseUrl, {
      data: medicationData,
    });
  }

  /**
   * Retrieves a specific medication by its ID via GET request.
   * Expects a 200 status code and returns the parsed response body.
   * @param {string} medicationId - The unique ID of the medication.
   * @returns {Promise<object>} The retrieved medication object.
   */
  async getMedicationById(medicationId) {
    const url = `${this.baseUrl}/${medicationId}`;
    logger.info(`Sending GET to retrieve medication: ${url}`);
    const responsePromise = this.request.get(url);
    // Use base handler, expecting 200 OK
    return this.handleResponse(responsePromise, 200);
  }

  /**
   * Retrieves a medication via GET but returns the raw APIResponse object.
   * @param {string} medicationId - The unique ID of the medication.
   * @returns {Promise<import('@playwright/test').APIResponse>} The raw Playwright APIResponse.
   */
  async getMedicationResponse(medicationId) {
    const url = `${this.baseUrl}/${medicationId}`;
    logger.info(`Sending GET (raw response) for medication: ${url}`);
    return this.request.get(url);
  }

  /**
   * Updates an existing medication via PUT request.
   * Expects a 200 status code and returns the parsed response body.
   * @param {string} medicationId - The ID of the medication to update.
   * @param {object} medicationData - Payload containing updated data.
   * @returns {Promise<object>} The updated medication object from the response body.
   */
  async updateMedication(medicationId, medicationData) {
    const url = `${this.baseUrl}/${medicationId}`;
    logger.info(`Sending PUT to update medication: ${url}`);
    const responsePromise = this.request.put(url, {
      data: medicationData,
    });
    // Use base handler, expecting 200 OK
    return this.handleResponse(responsePromise, 200);
  }

  /**
   * Deletes a medication by its ID via DELETE request.
   * Expects a 204 status code.
   * @param {string} medicationId - The ID of the medication to delete.
   * @returns {Promise<null>} Null is expected upon successful deletion (204 No Content).
   */
  async deleteMedication(medicationId) {
    const url = `${this.baseUrl}/${medicationId}`;
    logger.info(`Sending DELETE for medication: ${url}`);
    const responsePromise = this.request.delete(url);
    // Use base handler, expecting 204 No Content
    return this.handleResponse(responsePromise, 204);
  }

  // Add other medication-related API methods as needed (e.g., list, search)
}
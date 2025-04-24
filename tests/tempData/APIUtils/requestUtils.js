// src/utilities/requestUtils.js
import fs from 'fs';
import path from 'path';
import { logger } from '../../support/commonUtility/API/logger.js';

// Note: With Faker handling data generation, this file might be less crucial,
// but can still hold helpers for specific request manipulations or data loading.

/**
 * Loads test data from a JSON file relative to a specified base directory (e.g., tests/test_data).
 * @param {string} dataFilePath - The path to the JSON file relative to the project root or a known base dir.
 * @returns {object} The parsed JSON data.
 * @throws {Error} If the file cannot be read or parsed.
 */
export function loadJsonTestData(dataFilePath) {
    // Resolve path relative to project root (assuming utils is in src/utilities)
    const projectRoot = path.resolve(__dirname, '../../');
    const absolutePath = path.resolve(projectRoot, dataFilePath);

    logger.debug(`Attempting to load test data from: ${absolutePath}`);
    try {
        const fileContent = fs.readFileSync(absolutePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        logger.info(`Successfully loaded test data from: ${dataFilePath}`);
        return jsonData;
    } catch (error) {
        logger.error(`Error loading test data from ${absolutePath}:`, error);
        throw new Error(`Failed to load or parse test data file: ${dataFilePath}. Error: ${error.message}`);
    }
}

/**
 * Example: Helper to add common query parameters to a URL or params object.
 * @param {object | URLSearchParams} params - Existing parameters object or URLSearchParams instance.
 * @param {object} commonParams - Object containing common parameters to add.
 * @returns {object | URLSearchParams} Updated parameters.
 */
export function addCommonQueryParams(params, commonParams) {
    // Implementation depends on whether params is an object or URLSearchParams
    if (params instanceof URLSearchParams) {
        for (const key in commonParams) {
            if (Object.hasOwnProperty.call(commonParams, key)) {
                params.set(key, commonParams[key]);
            }
        }
        return params;
    } else {
        // Assume plain object
        return { ...params, ...commonParams };
    }
}

// Add other request-related utilities as needed, e.g.,
// - Functions to generate specific header values (timestamps, signatures)
// - Retry logic wrappers IF Playwright's built-in retries are insufficient

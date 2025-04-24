// tests/fixtures/apiFixtures.js
import { test as base, expect } from '@playwright/test';
import { MedicationClient } from '../../resources/API/mh_api_client/MedicationClient.js';
import { getAuthToken, createAuthenticatedContext } from '../../support/APIUtils/authUtils.js';
import { config } from '../../support/APIUtils/settings.js';
import { readExcelData } from '../../support/APIUtils/excelUtils.js';
import { logger } from '../../support/commonUtility/API/logger.js';

/**
 * @typedef {object} ApiTestFixtures
 * @property {MedicationClient} medicationClient - Basic, unauthenticated MedicationClient.
 * @property {MedicationClient} authenticatedMedicationClient - MedicationClient configured with authentication headers based on config.authType.
 * @property {object} defaultLoginCreds - Login credentials loaded from Excel or config. Includes username, password, providerCode.
 */

/** @type {import('@playwright/test').TestType<import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions & ApiTestFixtures, import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions>} */
export const test = base.extend({

  // --- Basic Unauthenticated Client ---
  medicationClient: async ({ request }, use) => {
    const client = new MedicationClient(request);
    await use(client);
  },

  // --- Default Login Credentials ---
  defaultLoginCreds: async ({}, use) => {
    let creds = null;
    const loginSheetName = 'Login Creds'; // ✨ Use the specified sheet name
    try {
      logger.info(`Attempting to load login data from: ${config.filePaths.loginData}, Sheet: ${loginSheetName}`);
      const loginData = readExcelData(config.filePaths.loginData, loginSheetName); // ✨ Use correct sheet name
      if (loginData && loginData.length > 0) {
        creds = {
            username: loginData[0].username,
            password: loginData[0].password,
            providerCode: loginData[0].providerCode // Assuming providerCode column exists
        };
        // Basic validation
        if (!creds.username || !creds.password) {
            logger.warn(`Username or Password missing in the first row of ${loginSheetName} in ${config.filePaths.loginData}`);
            creds = null; // Invalidate if essential fields are missing
        } else {
            logger.info('Loaded default login credentials from Excel.');
        }
      } else {
        logger.warn(`No valid login data found in Excel file/sheet: ${config.filePaths.loginData} / ${loginSheetName}.`);
      }
    } catch (excelError) {
      logger.warn(`Failed to load credentials from Excel (${excelError.message}). Will attempt fallback.`);
    }

    // Fallback if Excel failed or yielded no valid data
    if (!creds) {
      logger.info('Attempting to use default login credentials from config/env.');
      creds = { ...config.defaultLoginCredentials }; // Use credentials from settings.js
    }

    // Final check
    if (!creds || !creds.username || !creds.password) {
      throw new Error('Default login credentials (username, password) could not be loaded from Excel or config/env. Check setup.');
    }

    await use(creds);
  },


  // --- Authenticated Client (Handles Login) ---
  authenticatedMedicationClient: async ({ playwright, request: baseRequestContext, defaultLoginCreds }, use) => {
    let authenticatedContext = null;
    try {
      const credentials = defaultLoginCreds;
      logger.info(`Using credentials for user: ${credentials.username} to authenticate.`);
      const { token, type: tokenType } = await getAuthToken(baseRequestContext, credentials);
      authenticatedContext = await createAuthenticatedContext(playwright, token, tokenType);
      const authClient = new MedicationClient(authenticatedContext);
      logger.info(`Authenticated MedicationClient created using ${tokenType} token.`);
      await use(authClient);
    } catch (error) {
      logger.error(`FATAL: Failed to create authenticatedMedicationClient fixture: ${error.message}`);
      throw new Error(`Authentication failed during fixture setup: ${error.message}`);
    } finally {
      if (authenticatedContext) {
        logger.debug('Disposing authenticated APIRequestContext...');
        await authenticatedContext.dispose();
        logger.debug('Authenticated APIRequestContext disposed.');
      }
    }
  },
});

export { expect }; // Re-export expect
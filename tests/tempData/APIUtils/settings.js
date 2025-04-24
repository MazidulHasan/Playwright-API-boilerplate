// config/settings.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename)); // Project root

// Load environment variables (.env.development, .env.production etc. first, then .env)
dotenv.config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV || 'development'}`) });
dotenv.config({ path: path.resolve(__dirname, '.env') }); // Fallback load from .env

/**
 * @typedef {object} AppConfig - Defines the structure for application configuration.
 * @property {string} baseURL - The base URL for the API under test.
 * @property {string | undefined} jwtAuthUrl - The specific endpoint for JWT authentication.
 * @property {string | undefined} bearerAuthUrl - The specific endpoint for Bearer token authentication.
 * @property {string} authType - Preferred authentication type ('JWT' or 'Bearer').
 * @property {object} defaultLoginCredentials - Default credentials (read from env).
 * @property {string | undefined} defaultLoginCredentials.username - Default username.
 * @property {string | undefined} defaultLoginCredentials.password - Default password.
 * @property {string | undefined} defaultLoginCredentials.providerCode - Default provider code.
 * @property {string | undefined} defaultBearerToken - A static bearer token from env (if applicable).
 * @property {object} filePaths - Paths to data files.
 * @property {string} filePaths.loginData - Path to the login credentials Excel file.
 * @property {string} filePaths.medicationPayloads - Path to the medication payloads Excel file.
 */

/** @type {AppConfig} */
export const config = {
  baseURL: process.env.BASE_URL || 'http://localhost:3000', // Default if not in .env

  // Auth URLs from environment variables
  jwtAuthUrl: process.env.JWT_AUTH_URL,
  bearerAuthUrl: process.env.BEARER_AUTH_URL,

  // Preferred Auth Type (Bearer or JWT) - Default to Bearer if not set
  authType: process.env.AUTH_TYPE || 'Bearer',

  // Default credentials loaded from environment variables
  defaultLoginCredentials: {
    username: process.env.AUTH_USERNAME,
    password: process.env.AUTH_PASSWORD,
    providerCode: process.env.PROVIDERCODE,
  },

  // Static Bearer token if provided via environment (useful for some scenarios)
  defaultBearerToken: process.env.BEARER_TOKEN,

  // Paths to data files (relative to project root)
  filePaths: {
    loginData: process.env.LOGIN_DATA_PATH || 'data/login_data.xlsx',
    medicationPayloads: process.env.MED_PAYLOAD_PATH || 'data/medication_payloads.xlsx',
  },
};

// Validate essential config loaded from environment
if (!config.baseURL) {
    console.warn("WARN: BASE_URL environment variable is not set.");
}
if (!config.defaultLoginCredentials.username || !config.defaultLoginCredentials.password) {
    console.warn("WARN: AUTH_USERNAME or AUTH_PASSWORD environment variables are not set for default login.");
}
if (config.authType === 'JWT' && !config.jwtAuthUrl) {
    console.warn("WARN: AUTH_TYPE is JWT but JWT_AUTH_URL environment variable is not set.");
}
if (config.authType === 'Bearer' && !config.bearerAuthUrl && !config.defaultBearerToken) {
    console.warn("WARN: AUTH_TYPE is Bearer but neither BEARER_AUTH_URL nor BEARER_TOKEN environment variables are set.");
}

module.exports = { config };
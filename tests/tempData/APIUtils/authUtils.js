// src/utilities/authUtils.js
import { logger } from '../../support/commonUtility/API/logger.js';
import { config } from '../../support/APIUtils/settings.js'; // Use centralized config
import { ApiRequestError } from '../../resources/API/core/ApiError.js';

// --- Token Caching (Simple in-memory cache) ---
let cachedToken = null;
let tokenTypeUsed = null; // Stores the type ('Bearer' or 'JWT') of the cached token
let tokenExpiry = 0; // Unix timestamp (ms) when the token expires
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // Refresh 5 minutes before expiry

/** Checks if the cached token is invalid or needs refresh */
function isTokenExpired() {
  return !cachedToken || Date.now() >= tokenExpiry - TOKEN_REFRESH_BUFFER;
}

/** Clears the cached token */
function clearCachedToken() {
    cachedToken = null;
    tokenExpiry = 0;
    tokenTypeUsed = null;
    logger.info("Cleared cached authentication token.");
}

/**
 * Fetches a JWT token using credentials.
 * Adapts your provided logic to use the passed request context and central config.
 * @param {import('@playwright/test').APIRequestContext} request - Playwright request context.
 * @param {object} credentials - Credentials object { username, password, providerCode }.
 * @returns {Promise<{token: string, expiresIn?: number}>} Object containing token and optional expiry.
 * @throws {ApiRequestError} If fetching fails.
 */
async function fetchJWTToken(request, credentials) {
  if (!config.jwtAuthUrl) throw new Error("JWT_AUTH_URL is not configured.");
  if (!credentials.username || !credentials.password) throw new Error("Username and password required for JWT.");

  logger.info(`Fetching JWT token from ${config.jwtAuthUrl} for user ${credentials.username}`);
  const response = await request.post(config.jwtAuthUrl, {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    data: JSON.stringify({ // Ensure body is stringified if API expects raw JSON string
      loginName: credentials.username,
      password: credentials.password,
      providerCode: credentials.providerCode, // Include providerCode if needed
    }),
    failOnStatusCode: false, // Handle errors manually
  });

  if (!response.ok()) {
    const body = await response.text();
    logger.error(`Failed to fetch JWT token: ${response.status()}. Body: ${body}`);
    throw new ApiRequestError(`Failed to fetch JWT token for ${credentials.username}`, response.status(), body);
  }

  const data = await response.json();
  // --- Adapt response parsing for your JWT endpoint ---
  const token = data.token || data.access_token;
  const expiresIn = data.expires_in; // Assuming expiry in seconds
  // --- End adaptation ---

  if (!token) throw new Error("JWT token not found in response ('token' or 'access_token' field).");
  logger.info("Successfully fetched JWT token.");
  return { token, expiresIn };
}

/**
 * Fetches a Bearer token using credentials.
 * Adapts your provided logic to use the passed request context and central config.
 * @param {import('@playwright/test').APIRequestContext} request - Playwright request context.
 * @param {object} credentials - Credentials object { username, password, providerCode }.
 * @returns {Promise<{token: string, expiresIn?: number}>} Object containing token and optional expiry.
 * @throws {ApiRequestError} If fetching fails.
 */
async function fetchBearerToken(request, credentials) {
  if (!config.bearerAuthUrl) throw new Error("BEARER_AUTH_URL is not configured.");
   if (!credentials.username || !credentials.password) throw new Error("Username and password required for Bearer token fetch.");

  // Construct URL with query parameters as per your example
  const url = new URL(config.bearerAuthUrl, config.baseURL); // Use baseURL if Bearer URL is relative
  url.searchParams.append('loginName', credentials.username);
  url.searchParams.append('password', credentials.password);
  if (credentials.providerCode) {
      url.searchParams.append('providerCode', credentials.providerCode);
  }

  logger.info(`Fetching Bearer token from ${url.toString()} for user ${credentials.username}`);
  const response = await request.post(url.toString(), {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    // Body might not be needed if credentials are in query params
    failOnStatusCode: false, // Handle errors manually
  });

  if (!response.ok()) {
    const body = await response.text();
    logger.error(`Failed to fetch Bearer token: ${response.status()}. Body: ${body}`);
    throw new ApiRequestError(`Failed to fetch Bearer token for ${credentials.username}`, response.status(), body);
  }

  const data = await response.json();
   // --- Adapt response parsing for your Bearer endpoint ---
  const token = data.Token || data.access_token; // Your example used data.Token
  const expiresIn = data.expires_in;
   // --- End adaptation ---

  if (!token) throw new Error("Bearer token not found in response ('Token' or 'access_token' field).");
  logger.info("Successfully fetched Bearer token.");
  return { token, expiresIn };
}

/**
 * Gets the authentication token based on configured AUTH_TYPE.
 * Uses cached token if valid, otherwise fetches a new one.
 * Handles both JWT and Bearer token fetching logic.
 *
 * @param {import('@playwright/test').APIRequestContext} request - Playwright request context.
 * @param {object} credentials - Credentials { username, password, providerCode }.
 * @param {boolean} [forceRefresh=false] - Force fetching a new token.
 * @returns {Promise<{token: string, type: 'Bearer' | 'JWT'}>} Object with the token and its type.
 */
export async function getAuthToken(request, credentials, forceRefresh = false) {
  const authTypeToUse = config.authType === 'JWT' ? 'JWT' : 'Bearer'; // Determine type from config

  // If forcing refresh or token is expired or type changed, clear cache
  if (forceRefresh || isTokenExpired() || tokenTypeUsed !== authTypeToUse) {
      clearCachedToken();
  }

  // Return cached token if still valid
  if (cachedToken && tokenTypeUsed === authTypeToUse) {
      logger.info(`Using cached ${tokenTypeUsed} token.`);
      return { token: cachedToken, type: tokenTypeUsed };
  }

  // --- Fetch New Token ---
  logger.info(`Fetching new ${authTypeToUse} token...`);
  let tokenData;
  try {
      if (authTypeToUse === 'JWT') {
          tokenData = await fetchJWTToken(request, credentials);
      } else { // Bearer
          // Check if a static Bearer token is provided in config
          if (config.defaultBearerToken) {
              logger.info("Using static BEARER_TOKEN from config/env.");
              tokenData = { token: config.defaultBearerToken, expiresIn: 3600 * 24 * 365 }; // Assume long expiry for static token
          } else {
              tokenData = await fetchBearerToken(request, credentials);
          }
      }

      // Cache the new token
      cachedToken = tokenData.token;
      tokenTypeUsed = authTypeToUse;
      // Calculate expiry (default to 1 hour if not provided)
      tokenExpiry = tokenData.expiresIn
          ? Date.now() + (tokenData.expiresIn * 1000)
          : Date.now() + (60 * 60 * 1000);

      logger.info(`Successfully cached new ${tokenTypeUsed} token. Expires ~ ${new Date(tokenExpiry).toISOString()}`);
      return { token: cachedToken, type: tokenTypeUsed };

  } catch (error) {
      clearCachedToken(); // Clear cache on fetch failure
      logger.error(`Failed to get auth token: ${error.message}`);
      throw error; // Re-throw the error
  }
}

/**
 * Creates a new Playwright APIRequestContext instance configured with the
 * appropriate Authorization header based on the token type.
 *
 * @param {import('@playwright/test').Playwright} playwright - The Playwright module instance.
 * @param {string} token - The authentication token.
 * @param {'Bearer' | 'JWT'} tokenType - The type of the token.
 * @returns {Promise<import('@playwright/test').APIRequestContext>} A new authenticated APIRequestContext.
 */
export async function createAuthenticatedContext(playwright, token, tokenType) {
  if (!token) throw new Error("Cannot create authenticated context without a token.");
  if (!tokenType) throw new Error("Token type ('Bearer' or 'JWT') required to create authenticated context.");

  logger.debug(`Creating new authenticated APIRequestContext with ${tokenType} token.`);

  // Determine the correct Authorization header format
  const authHeaderValue = tokenType === 'Bearer' ? `Bearer ${token}` : `JWT ${token}`; // Use 'JWT' prefix for JWT

  return playwright.request.newContext({
    baseURL: config.baseURL, // Use baseURL from central config
    extraHTTPHeaders: {
      // Inherit non-auth headers if possible (might need adjustment based on Playwright version/behavior)
      // 'Accept': 'application/json',
      // 'Content-Type': 'application/json',
      'Authorization': authHeaderValue, // Set the dynamic Authorization header
    },
    // Copy other relevant settings from playwright.config.js
    ignoreHTTPSErrors: true, // Example
    // timeout: config.requestTimeout // Example if you have custom timeouts in config
  });
}
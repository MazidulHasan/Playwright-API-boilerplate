// api-auth.test.js
const { test, expect, request } = require('@playwright/test');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

test.describe('DummyJSON API Automation', () => {
  let apiContext;
  let token;

  test.beforeAll(async () => {
    apiContext = await request.newContext({
      baseURL: 'https://dummyjson.com',
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('User login and data retrieval with schema validation', async () => {
    // Schema for login response
    const loginSchema = {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "required": ["id", "username", "email", "firstName", "lastName", "gender", "image", "accessToken", "refreshToken"],
      "properties": {
        "accessToken": { "type": "string", "minLength": 10 },
        "refreshToken": { "type": "string", "minLength": 10 },
        "id": { "type": "integer" },
        "username": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "firstName": { "type": "string" },
        "lastName": { "type": "string" },
        "gender": { "type": "string" },
        "image": { "type": "string", "format": "uri" }
      },
      "additionalProperties": false
    };

    // Schema for user data (auth/me endpoint)
    const userSchema = {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "required": ["id", "firstName", "lastName", "email", "username", "image"],
      "properties": {
        "id": { "type": "integer" },
        "firstName": { "type": "string" },
        "lastName": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "username": { "type": "string" },
        "image": { "type": "string", "format": "uri" },
        "gender": { "type": "string" },
        "age": { "type": "integer" },
        "phone": { "type": "string" }
      },
      "additionalProperties": true // Changed to true to allow extra properties
    };

    // Initialize AJV
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validateLogin = ajv.compile(loginSchema);
    const validateUser = ajv.compile(userSchema);

    // Perform login
    const loginResponse = await apiContext.post('/auth/login', {
      data: {
        username: 'emilys',
        password: 'emilyspass',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();

    // Validate login response
    const validLogin = validateLogin(loginData);
    if (!validLogin) {
      console.error('Login Validation Errors:', validateLogin.errors);
    }
    expect(validLogin).toBeTruthy();

    // Extract token
    token = loginData.accessToken;
    expect(token).toBeTruthy();

    // Fetch user data
    const userResponse = await apiContext.get('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    expect(userResponse.ok()).toBeTruthy();
    const userData = await userResponse.json();
    console.log('User Data:', JSON.stringify(userData, null, 2));

    // Validate user data - only checking required fields
    const validUser = validateUser(userData);
    if (!validUser) {
      console.error('User Data Validation Errors:', validateUser.errors);
    }
    expect(validUser).toBeTruthy();

    // Additional assertions for critical fields
    expect(userData.id).toBe(loginData.id);
    expect(userData.username).toBe(loginData.username);
    expect(userData.email).toBe(loginData.email);
  });
});
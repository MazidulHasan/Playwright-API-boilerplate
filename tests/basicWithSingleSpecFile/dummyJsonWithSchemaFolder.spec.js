// api-tests.spec.js
const { test, expect, request } = require('@playwright/test');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { 
  userCreateRequestSchema,
  userCreateResponseSchema,
  userUpdateRequestSchema,
  userGetResponseSchema,
  generateCreateUserData,
  generateUpdateUserData
} = require('./Schema/schemas.js');

test.describe('DummyJSON User API Tests', () => {
  let apiContext;
  let userId;

  test.beforeAll(async () => {
    apiContext = await request.newContext({
      baseURL: 'https://dummyjson.com',
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  // Helper function for schema validation
  const validateSchema = (schema, data) => {
    const ajv = new Ajv({ 
      allErrors: true,
      verbose: true,
      formats: {
        ipv4: /^(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        uri: /^(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*$/
      }
    });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const isValid = validate(data);
    
    return {
      isValid,
      errors: isValid ? null : validate.errors
    };
  };

  test('Create new user with random data', async () => {
    // Generate random user data
    const userData = generateCreateUserData();
    console.log('Creating user with data:', JSON.stringify(userData, null, 2));

    // Validate request data against schema
    const requestValidation = validateSchema(userCreateRequestSchema, userData);
    expect(requestValidation.isValid, `Request validation failed: ${JSON.stringify(requestValidation.errors, null, 2)}`)
      .toBeTruthy();

    // Make API request
    const response = await apiContext.post('/users/add', {
      headers: { 'Content-Type': 'application/json' },
      data: userData
    });

    expect(response.ok()).toBeTruthy();
    const responseData = await response.json();
    console.log('User created with response:', JSON.stringify(responseData, null, 2));

    // Validate response against schema
    const responseValidation = validateSchema(userCreateResponseSchema, responseData);
    expect(responseValidation.isValid, `Response validation failed: ${JSON.stringify(responseValidation.errors, null, 2)}`)
      .toBeTruthy();

    // Store user ID for subsequent tests
    userId = responseData.id;
    expect(userId).toBeGreaterThan(0);
  });

  test('Update user with random data', async () => {
    // Generate random update data
    const updateData = generateUpdateUserData();
    console.log('Updating user with data:', JSON.stringify(updateData, null, 2));

    // Validate request data against schema
    const requestValidation = validateSchema(userUpdateRequestSchema, updateData);
    expect(requestValidation.isValid, `Request validation failed: ${JSON.stringify(requestValidation.errors, null, 2)}`)
      .toBeTruthy();

    // Make API request
    const response = await apiContext.put(`/users/${2}`, {
      headers: { 'Content-Type': 'application/json' },
      data: updateData
    });

    expect(await response.ok()).toBeTruthy();
    const responseData = await response.json();
    console.log('User updated with response:', JSON.stringify(responseData, null, 2));

    // Validate response against schema
    const responseValidation = validateSchema(userCreateResponseSchema, responseData);
    expect(responseValidation.isValid, `Response validation failed: ${JSON.stringify(responseValidation.errors, null, 2)}`)
      .toBeTruthy();

    // Verify updated fields
    expect(responseData.firstName).toBe(updateData.firstName);
    expect(responseData.lastName).toBe(updateData.lastName);
    expect(responseData.email).toBe(updateData.email);
  });

  test('Get user data and validate', async () => {
    userId = 2;
    // Make API request
    const response = await apiContext.get(`/users/${userId}`);
    expect(response.ok()).toBeTruthy();
    const responseData = await response.json();
    console.log('User data:', JSON.stringify(responseData, null, 2));

    // Validate response against schema
    const responseValidation = validateSchema(userGetResponseSchema, responseData);
    expect(responseValidation.isValid, `Response validation failed: ${JSON.stringify(responseValidation.errors, null, 2)}`)
      .toBeTruthy();

    // Verify basic user data exists
    expect(responseData.id).toBe(userId);
    expect(responseData.firstName).toBeTruthy();
    expect(responseData.lastName).toBeTruthy();
    expect(responseData.email).toBeTruthy();
  });
});
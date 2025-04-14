// api-auth.test.js
const { test, expect, request } = require('@playwright/test');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { faker } = require('@faker-js/faker');

test.describe('DummyJSON API Automation', () => {
  let apiContext;
  let token;
  let userId;
  let generatedUserData = {};

  test.beforeAll(async () => {
    apiContext = await request.newContext({
      baseURL: 'https://dummyjson.com',
    });

    // Generate test data once that will be used across tests
    generatedUserData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      username: faker.internet.userName().replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 20),
      age: faker.number.int({ min: 18, max: 80 }),
      phone: faker.phone.number('+## ###-###-####'),
      address: {
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        postalCode: faker.location.zipCode()
      }
    };
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  // Test 1: Login with static credentials (not using Faker)
  test('User login with schema validation', async () => {
    const loginSchema = {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "required": ["id", "username", "email", "firstName", "lastName", "gender", "image", "accessToken", "refreshToken"],
      "properties": {
        "id": { "type": "integer", "minimum": 1 },
        "username": { "type": "string", "minLength": 3 },
        "email": { "type": "string", "format": "email" },
        "firstName": { "type": "string", "minLength": 1 },
        "lastName": { "type": "string", "minLength": 1 },
        "gender": { "type": "string", "enum": ["male", "female", "other"] },
        "image": { "type": "string", "format": "uri" },
        "token": { "type": "string", "minLength": 10 }
      },
      "additionalProperties": true
    };

    const ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(ajv);
    const validateLogin = ajv.compile(loginSchema);

    const loginResponse = await apiContext.post('/auth/login', {
      data: {
        username: 'emilys',
        password: 'emilyspass',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();

    const isValid = validateLogin(loginData);
    if (!isValid) {
      console.error('Login Validation Errors:', ajv.errorsText(validateLogin.errors, { separator: '\n' }));
    }
    expect(isValid).toBeTruthy();

    token = loginData.accessToken;
    userId = loginData.id;
    expect(token).toBeTruthy();
    expect(userId).toBeTruthy();
  });

  // Test 2: Create new user with Faker data
  test('Create new user with random data', async () => {
    const userSchema = {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "required": ["id", "firstName", "lastName", "email", "username"],
      "properties": {
        "id": { "type": "integer", "minimum": 1 },
        "firstName": { "type": "string", "minLength": 1 },
        "lastName": { "type": "string", "minLength": 1 },
        "email": { "type": "string", "format": "email" },
        "username": { "type": "string", "minLength": 3 },
        "age": { "type": "integer", "minimum": 1, "maximum": 120 }
      },
      "additionalProperties": true
    };

    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(userSchema);

    // Generate new user data with Faker
    const newUser = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      username: faker.internet.userName().replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 20),
      password: faker.internet.password({ length: 12 }),
      age: faker.number.int({ min: 18, max: 80 }),
      phone: faker.phone.number()
    };

    console.log('Creating new user with data:', JSON.stringify(newUser, null, 2));

    const createResponse = await apiContext.post('/users/add', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: newUser
    });

    expect(createResponse.ok()).toBeTruthy();
    const responseData = await createResponse.json();

    console.log("Response Data:", JSON.stringify(responseData, null, 2));
    

    const isValid = validate(responseData);
    if (!isValid) {
      console.error('User Creation Validation Errors:', ajv.errorsText(validate.errors));
    }
    expect(isValid).toBeTruthy();

    // Store the new user ID for potential future tests
    const newUserId = responseData.id;
    console.log(`Created new user with ID: ${newUserId}`);
  });

  // Test 3: Update user with Faker data
  test('Update user with random data', async () => {
    const updateSchema = {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "required": ["id", "firstName", "lastName"],
      "properties": {
        "id": { "type": "integer", "minimum": 1 },
        "firstName": { 
          "type": "string", 
          "minLength": 1,
          "maxLength": 50,
          "pattern": "^[a-zA-Z-' ]+$"
        },
        "lastName": { 
          "type": "string", 
          "minLength": 1,
          "maxLength": 50,
          "pattern": "^[a-zA-Z-' ]+$"
        },
        "email": { 
          "type": "string", 
          "format": "email",
          "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        },
        "age": { 
          "type": "integer", 
          "minimum": 1, 
          "maximum": 120
        },
        "phone": { 
          "type": "string", 
          "pattern": "^\\+?[0-9\\s-]+$"
        }
      },
      "additionalProperties": true
    };

    const ajv = new Ajv({ 
      allErrors: true,
      verbose: true,
      formats: {
        phone: /^\+?[0-9\s-]+$/
      }
    });
    addFormats(ajv);
    const validate = ajv.compile(updateSchema);

    // Generate update data with Faker
    const updateData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      age: faker.number.int({ min: 18, max: 80 }),
      phone: faker.phone.number('+## ###-###-####'),
      address: {
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        postalCode: faker.location.zipCode()
      }
    };

    console.log('Updating user with data:', JSON.stringify(updateData, null, 2));

    const updateResponse = await apiContext.put(`/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: updateData
    });

    expect(updateResponse.ok()).toBeTruthy();
    const responseData = await updateResponse.json();

    const isValid = validate(responseData);
    if (!isValid) {
      console.error('Update Validation Errors:', ajv.errorsText(validate.errors, { separator: '\n' }));
    }
    expect(isValid).toBeTruthy();

    // Verify the updated fields
    expect(responseData.firstName).toBe(updateData.firstName);
    expect(responseData.lastName).toBe(updateData.lastName);
    expect(responseData.email).toBe(updateData.email);
  });

  // Test 4: Get updated user data and validate
  test('Verify updated user data', async () => {
    const userSchema = {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "required": ["id", "firstName", "lastName", "email"],
      "properties": {
        "id": { "type": "integer", "minimum": 1 },
        "firstName": { "type": "string", "minLength": 1 },
        "lastName": { "type": "string", "minLength": 1 },
        "email": { "type": "string", "format": "email" },
        "age": { "type": "integer", "minimum": 1, "maximum": 120 },
        "phone": { "type": "string", "pattern": "^\\+?[0-9\\s-]+$" }
      },
      "additionalProperties": true
    };

    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(userSchema);

    const userResponse = await apiContext.get(`/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    expect(userResponse.ok()).toBeTruthy();
    const userData = await userResponse.json();

    const isValid = validate(userData);
    if (!isValid) {
      console.error('User Data Validation Errors:', ajv.errorsText(validate.errors));
    }
    expect(isValid).toBeTruthy();

    // Verify the data matches our generated test data
    expect(userData.firstName).toBe(generatedUserData.firstName);
    expect(userData.lastName).toBe(generatedUserData.lastName);
    expect(userData.email).toBe(generatedUserData.email);
  });
});
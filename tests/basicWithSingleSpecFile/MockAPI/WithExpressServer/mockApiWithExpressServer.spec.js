const { test, expect } = require('@playwright/test');
const { exec } = require('child_process');

let mockServer;

test.beforeAll(async () => {
  // Start the mock server
  mockServer = exec('node mockServer.js');
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for server to start
});

test.afterAll(async () => {
  // Stop the mock server
  mockServer.kill();
});

test('Test login API with real mock server', async ({ request }) => {
  // Test successful case
  const successResponse = await request.post('http://localhost:3001/api/login', {
    data: { username: 'testData', password: 'testData' }
  });
  console.log("successResponse",await successResponse.json());
  
  expect(await successResponse.ok()).toBeTruthy();
  expect(await successResponse.json()).toEqual({ message: 'Login successful' });

  // Test validation cases
  const missingUserResponse = await request.post('http://localhost:3001/api/login', {
    data: { password: 'testData' }
  });
  expect(missingUserResponse.status()).toBe(400);
  expect(await missingUserResponse.json()).toEqual({ error: 'both are required for login' });
});
const { test, expect } = require('@playwright/test');
const { exec } = require('child_process');
const fs = require('fs');

let mockServer;

test.beforeAll(async () => {
  // Start the mock server
  mockServer = exec('node tests/basicWithSingleSpecFile/MockAPI/WithExpressServer/expressMockServer.js');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for server to start
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

  //User name more than 10 character
  const userNameLengthResponse = await request.post('http://localhost:3001/api/login', {
    data: { username: 'testDatatestDatatestDatatestDatatestDatatestDatatestData', password: 'testData' }
  });
  expect(userNameLengthResponse.status()).toBe(400);
  expect(await userNameLengthResponse.json()).toEqual({ error: 'user name can not be more than 10 character' });
});


test('Test register API with real mock server', async ({ request }) => {
  // Test successful case
  const formData = {
    fname: 'fname',
    lname: 'lname',
    email: 'email@test.com',
    password: 'pass',
    country: 'country',
    region: 'region',
    city: 'city',
    phone: 'phone',
    age: 'age',
    gender: 'gender',
    image: {
      name: 'testImage.png',
      mimeType: 'image/png',
      buffer: fs.readFileSync('tests/basicWithSingleSpecFile/MockAPI/WithExpressServer/testImage.png')
    }
  };

  const successResponse = await request.post('http://localhost:3001/api/register', {
    multipart: formData
  });
  
  const responseBody = await successResponse.json();
  console.log("successResponse", responseBody);
  
  expect(await successResponse.ok()).toBeTruthy();
  expect(await responseBody).toEqual({ message: 'Registration successful' });
});
import { test, expect } from '@playwright/test';
import { resourceSchema, updateSchema } from './api.setup';
import { validateSchema, generateCreateData, generateUpdateData } from './api.helpers';
import { faker } from '@faker-js/faker';

// Use a non-existent domain that will always be mocked
const BASE_URL = 'http://localhost:3000';

test.describe('API Validation Tests', () => {
  let authToken;

  // Mock API routes before all tests
  test.beforeEach(async ({ request }) => {
  });

  test.beforeAll(async ({ request }) => {
    // This will be intercepted by our mock
    const response = await request.post(`${BASE_URL}/api/login`, {
      data: { username: 'test', password: 'test' }
    });
    authToken = (await response.json()).token;
  });

  test('Create resource with valid data', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/resources`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: generateCreateData()
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeDefined();
  });

  test('Reject creation with missing required field', async ({ request }) => {
    const data = generateCreateData();
    delete data.name;
    const response = await request.post(`${BASE_URL}/api/resources`, { data });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.errors).toBeDefined();
  });

  test('Reject active status without activationDate', async ({ request }) => {
    const data = generateCreateData({ status: 'active'});
    delete data.activationDate;
    const response = await request.post(`${BASE_URL}/api/resources`, { data });
    expect(response.status()).toBe(400);
    const body = await response.json();
    console.log("body::",body);
    expect(body.errors).toContain('activationDate is required when status is active');
  });

  test('Reject update without updateReason', async ({ request }) => {
    // First create a resource
    const createResponse = await request.post(`${BASE_URL}/api/resources`, {
      data: generateCreateData()
    });
    const createdResource = await createResponse.json();
    
    // Try to update without required field
    const updateData = generateUpdateData(createdResource);
    delete updateData.updateReason;
    const updateResponse = await request.put(
      `${BASE_URL}/api/resources/${createdResource.id}`,
      { data: updateData }
    );
    expect(updateResponse.status()).toBe(400);
  });
});
import { test, expect } from '@playwright/test';
import { resourceSchema, updateSchema } from './api.setup';
import { validateSchema, generateCreateData, generateUpdateData } from './api.helpers';

// Mock API routes with schema validation
test.beforeEach(async ({ request }) => {
  // Mock login
  await request.route('/api/login', async (route) => {
    const { username, password } = await route.request().json();
    route.fulfill({
      status: username && password ? 200 : 401,
      body: JSON.stringify({ token: 'fake-jwt-token' })
    });
  });

  // Mock resource creation
  await request.route('/api/resources', async (route) => {
    const data = await route.request().json();
    const { valid, errors } = validateSchema(resourceSchema, data);

    if (!valid) {
      return route.fulfill({ status: 400, body: JSON.stringify({ errors }) });
    }

    route.fulfill({
      status: 201,
      body: JSON.stringify({ 
        ...data, 
        id: faker.string.uuid(),
        createdAt: new Date().toISOString()
      })
    });
  });

  // Mock resource update
  await request.route('/api/resources/*', async (route) => {
    const data = await route.request().json();
    const { valid, errors } = validateSchema(updateSchema, data);

    if (!valid) {
      return route.fulfill({ status: 400, body: JSON.stringify({ errors }) });
    }

    route.fulfill({
      status: 200,
      body: JSON.stringify({ 
        ...data, 
        updatedAt: new Date().toISOString()
      })
    });
  });
});

// Test suite
test.describe('API Validation Tests', () => {
  let authToken;

  test.beforeAll(async ({ request }) => {
    const response = await request.post('/api/login', {
      data: { username: 'test', password: 'test' }
    });
    authToken = (await response.json()).token;
  });

  // Success cases
  test('Create resource with valid data', async ({ request }) => {
    const response = await request.post('/api/resources', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: generateCreateData()
    });
    expect(response.status()).toBe(201);
  });

  // Failure cases
  test('Reject creation with missing required field', async ({ request }) => {
    const data = generateCreateData();
    delete data.name; // Remove required field
    const response = await request.post('/api/resources', { data });
    expect(response.status()).toBe(400);
    expect(await response.json()).toHaveProperty('errors');
  });

  // Dependency tests
  test('Reject active status without activationDate', async ({ request }) => {
    const data = generateCreateData({ status: 'active' });
    delete data.activationDate; // Remove dependent field
    const response = await request.post('/api/resources', { data });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.errors.some(e => e.keyword === 'dependentRequired')).toBeTruthy();
  });

  // Update-specific tests
  test('Reject update without updateReason', async ({ request }) => {
    const resource = await request.post('/api/resources', {
      data: generateCreateData()
    });
    const data = generateUpdateData(await resource.json());
    delete data.updateReason; // Remove update-specific field
    const response = await request.put(`/api/resources/${data.id}`, { data });
    expect(response.status()).toBe(400);
  });
});
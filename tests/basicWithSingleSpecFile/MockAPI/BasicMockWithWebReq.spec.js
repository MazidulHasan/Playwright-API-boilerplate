const { test, expect } = require('@playwright/test');

test('Test API validation with mocked response', async ({ page }) => {
  // Mock the API response
  await page.route('**/api/validate', async (route) => {
    // Get the request payload
    const request = route.request();
    const requestData = request.postDataJSON();
    
    // Mock different responses based on input
    if (requestData.email && !requestData.email.includes('@')) {
      // Return validation error for invalid email
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid email format'
        }),
      });
    } else {
      // Return success response for valid data
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Validation successful'
        }),
      });
    }
  });

  // Navigate to your page that makes the API call
  await page.goto('http://your-app.com/form-page');

  // Test with invalid data
  await page.fill('#email', 'invalid-email');
  await page.click('#submit');
  await expect(page.locator('.error-message')).toHaveText('Invalid email format');

  // Test with valid data
  await page.fill('#email', 'valid@example.com');
  await page.click('#submit');
  await expect(page.locator('.success-message')).toHaveText('Validation successful');
});
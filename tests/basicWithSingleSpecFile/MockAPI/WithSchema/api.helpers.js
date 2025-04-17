import { faker } from '@faker-js/faker';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({
  allErrors: true, // Collect all errors (not just the first one)
  strict: false, // Allow slight deviations (e.g., extra fields)
  coerceTypes: true // Auto-convert strings to numbers/dates where possible
});
addFormats(ajv); // Add support for 'email', 'date-time', etc.

// Validate data against schema
export const validateSchema = (schema, data) => {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  return { valid, errors: validate.errors };
};

// Generate valid fake data for creation
export const generateCreateData = (overrides = {}) => {
  const category = faker.helpers.arrayElement(['premium', 'standard', 'basic']);
  const status = faker.helpers.arrayElement(['active', 'inactive', 'pending']);

  const baseData = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    status,
    category,
    ...overrides
  };

  // Handle field dependencies
  if (status === 'active') {
    baseData.activationDate = faker.date.recent().toISOString();
  } else if (status === 'inactive') {
    baseData.deactivationReason = faker.lorem.sentence();
  }

  if (category === 'premium') {
    baseData.premiumFeatures = Array(2)
      .fill()
      .map(() => faker.commerce.productName());
  } else if (category === 'basic') {
    baseData.basicLimitations = {
      maxStorage: faker.number.int({ min: 1, max: 10 }),
      maxRequests: faker.number.int({ min: 10, max: 100 })
    };
  }

  return baseData;
};

// Generate valid fake data for updates
export const generateUpdateData = (existingData) => ({
  ...existingData,
  updatedBy: faker.internet.userName(),
  updateReason: faker.lorem.sentence(),
  // Randomly modify some fields
  ...(Math.random() > 0.5 && { name: faker.person.fullName() }),
  ...(Math.random() > 0.5 && { 
    status: faker.helpers.arrayElement(['active', 'inactive', 'pending']) 
  })
});
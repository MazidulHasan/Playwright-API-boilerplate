import { faker } from '@faker-js/faker';

// Base schema with all validation rules
export const resourceSchema = {
  type: 'object',
  required: ['name', 'email', 'status', 'category'],
  properties: {
    name: { 
      type: 'string',
      minLength: 3,
      maxLength: 50,
      pattern: '^[a-zA-Z ]+$'
    },
    email: { 
      type: 'string', 
      format: 'email',
      maxLength: 100 
    },
    status: { 
      type: 'string', 
      enum: ['active', 'inactive', 'pending'],
      dependencies: {
        active: ['activationDate'],
        inactive: ['deactivationReason']
      }
    },
    activationDate: { 
      type: 'string', 
      format: 'date-time',
      dependencies: { '^': ['status:active'] } // Only required if status=active
    },
    deactivationReason: {
      type: 'string',
      minLength: 10,
      dependencies: { '^': ['status:inactive'] }
    },
    category: {
      type: 'string',
      enum: ['premium', 'standard', 'basic'],
      dependencies: {
        premium: ['premiumFeatures'],
        basic: ['basicLimitations']
      }
    },
    premiumFeatures: {
      type: 'array',
      items: { type: 'string' },
      dependencies: { '^': ['category:premium'] }
    },
    basicLimitations: {
      type: 'object',
      properties: {
        maxStorage: { type: 'number', minimum: 1 },
        maxRequests: { type: 'number', minimum: 10 }
      },
      dependencies: { '^': ['category:basic'] }
    }
  }
};

// Update schema extends base schema + adds 2 required fields
export const updateSchema = {
  allOf: [
    { $ref: '#/definitions/baseSchema' },
    {
      required: ['updatedBy', 'updateReason'],
      properties: {
        updatedBy: { type: 'string', minLength: 3 },
        updateReason: { type: 'string', minLength: 5 }
      }
    }
  ],
  definitions: {
    baseSchema: resourceSchema
  }
};
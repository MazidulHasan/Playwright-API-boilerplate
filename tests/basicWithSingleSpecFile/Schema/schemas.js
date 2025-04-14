// schemas.js
const { faker } = require('@faker-js/faker');

const userCreateRequestSchema = {
  type: 'object',
  required: ['firstName', 'lastName', 'email', 'username', 'password'],
  properties: {
    firstName: { type: 'string', minLength: 1, maxLength: 50 },
    lastName: { type: 'string', minLength: 1, maxLength: 50 },
    email: { type: 'string', format: 'email' },
    username: { type: 'string', minLength: 3, maxLength: 30 },
    password: { type: 'string', minLength: 6 },
    age: { type: 'integer', minimum: 1, maximum: 120 },
    phone: { type: 'string', pattern: '^[+\\d\\s-]+(?:x\\d+)?$' }
  },
  additionalProperties: false
};

const userCreateResponseSchema = {
  type: 'object',
  required: ['id', 'firstName', 'lastName', 'email', 'username'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    maidenName: { type: 'string' },
    age: { type: 'integer' },
    gender: { type: 'string' },
    email: { type: 'string', format: 'email' },
    phone: { type: 'string' },
    username: { type: 'string' },
    password: { type: 'string' },
    birthDate: { type: 'string' },
    image: { type: 'string' },
    bloodGroup: { type: 'string' },
    height: { type: ['number', 'null'] },
    weight: { type: ['number', 'null'] },
    eyeColor: { type: 'string' },
    hair: {
      type: 'object',
      properties: {
        color: { type: 'string' },
        type: { type: 'string' }
      }
    },
    domain: { type: 'string' },
    ip: { type: 'string' },
    address: { type: 'object' },
    macAddress: { type: 'string' },
    university: { type: 'string' },
    bank: { type: 'object' },
    company: { type: 'object' },
    ein: { type: 'string' },
    ssn: { type: 'string' },
    userAgent: { type: 'string' }
  }
};

const userUpdateRequestSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string', minLength: 1, maxLength: 50 },
    lastName: { type: 'string', minLength: 1, maxLength: 50 },
    email: { type: 'string', format: 'email' },
    username: { type: 'string', minLength: 3, maxLength: 30 },
    age: { type: 'integer', minimum: 1, maximum: 120 },
    phone: { type: 'string', pattern: '^\\+\\d{2} \\d{3}-\\d{3}-\\d{3}( x\\d+)?$' },
    birthDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    bloodGroup: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    height: { type: 'number', minimum: 50, maximum: 250 },
    weight: { type: 'number', minimum: 20, maximum: 300 },
    eyeColor: { type: 'string' },
    hair: {
      type: 'object',
      properties: {
        color: { type: 'string' },
        type: { type: 'string', enum: ['Straight', 'Wavy', 'Curly', 'Coily'] }
      }
    }
  },
  additionalProperties: true
};

const userGetResponseSchema = {
  type: 'object',
  required: ['id', 'firstName', 'lastName', 'email', 'username'],
  properties: {
    id: { type: 'integer' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    maidenName: { type: 'string' },
    age: { type: 'integer' },
    gender: { type: 'string', enum: ['male', 'female', 'other'] },
    email: { type: 'string', format: 'email' },
    phone: { type: 'string' },
    username: { type: 'string' },
    password: { type: 'string' },
    birthDate: { type: 'string' },
    image: { type: 'string', format: 'uri' },
    bloodGroup: { type: 'string' },
    height: { type: 'number' },
    weight: { type: 'number' },
    eyeColor: { type: 'string' },
    hair: {
      type: 'object',
      properties: {
        color: { type: 'string' },
        type: { type: 'string' }
      }
    },
    ip: { type: 'string', format: 'ipv4' },
    address: {
      type: 'object',
      properties: {
        address: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        stateCode: { type: 'string' },
        postalCode: { type: 'string' },
        coordinates: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' }
          }
        },
        country: { type: 'string' }
      }
    },
    macAddress: { type: 'string', pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$' },
    university: { type: 'string' },
    bank: {
      type: 'object',
      properties: {
        cardExpire: { type: 'string' },
        cardNumber: { type: 'string' },
        cardType: { type: 'string' },
        currency: { type: 'string' },
        iban: { type: 'string' }
      }
    },
    company: {
      type: 'object',
      properties: {
        department: { type: 'string' },
        name: { type: 'string' },
        title: { type: 'string' },
        address: { type: 'object' }
      }
    },
    ein: { type: 'string' },
    ssn: { type: 'string' },
    userAgent: { type: 'string' },
    crypto: {
      type: 'object',
      properties: {
        coin: { type: 'string' },
        wallet: { type: 'string' },
        network: { type: 'string' }
      }
    },
    role: { type: 'string', enum: ['admin', 'user', 'guest'] }
  }
};

// Faker data generators
const generateCreateUserData = () => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  username: faker.internet.username().replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 20),
  password: faker.internet.password({ length: 12 }),
  age: faker.number.int({ min: 18, max: 80 }),
  phone: `+${faker.number.int({ min: 10, max: 99 })} ` +
         `${faker.number.int({ min: 100, max: 999 })}-` +
         `${faker.number.int({ min: 100, max: 999 })}-` +
         `${faker.number.int({ min: 100, max: 999 })}`
});

const generateUpdateUserData = () => ({
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  age: faker.number.int({ min: 18, max: 80 }),
  phone: `+${faker.number.int({ min: 10, max: 99 })} ` +
         `${faker.number.int({ min: 100, max: 999 })}-` +
         `${faker.number.int({ min: 100, max: 999 })}-` +
         `${faker.number.int({ min: 100, max: 999 })}`,
  birthDate: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0],
  bloodGroup: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  height: faker.number.float({ min: 150, max: 200, precision: 0.01 }),
  weight: faker.number.float({ min: 50, max: 120, precision: 0.01 }),
  eyeColor: faker.helpers.arrayElement(['Amber', 'Blue', 'Brown', 'Gray', 'Green', 'Hazel']),
  hair: {
    color: faker.color.human(),
    type: faker.helpers.arrayElement(['Straight', 'Wavy', 'Curly', 'Coily'])
  }
});

module.exports = {
  userCreateRequestSchema,
  userCreateResponseSchema,
  userUpdateRequestSchema,
  userGetResponseSchema,
  generateCreateUserData,
  generateUpdateUserData
};
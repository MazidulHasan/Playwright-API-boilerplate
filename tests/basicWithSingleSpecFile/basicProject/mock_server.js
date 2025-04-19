const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { faker } = require('@faker-js/faker');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Schemas
const resourceSchema = {
  required: ['name'],
  validate: (data) => {
    const errors = [];
    if (!data.name) errors.push('"name" is required');
    if (data.status === 'active' && !data.activationDate) {
      errors.push('activationDate is required when status is active');
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }
};

const updateSchema = {
  required: ['updateReason'],
  validate: (data) => {
    const errors = [];
    if (!data.updateReason) errors.push('"updateReason" is required');
    return {
      valid: errors.length === 0,
      errors,
    };
  }
};

// POST /api/login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username && password) {
    res.status(200).json({ token: 'fake-jwt-token' });
  } else {
    res.status(401).json({});
  }
});

// POST /api/resources
app.post('/api/resources', (req, res) => {
  const data = req.body;
  const { valid, errors } = resourceSchema.validate(data);

  if (!valid) {
    return res.status(400).json({ errors });
  }

  return res.status(201).json({
    ...data,
    id: faker.string.uuid(),
    createdAt: new Date().toISOString()
  });
});

// PUT /api/resources/:id
app.put('/api/resources/:id', (req, res) => {
  const data = req.body;
  const { valid, errors } = updateSchema.validate(data);

  if (!valid) {
    return res.status(400).json({ errors });
  }

  return res.status(200).json({
    ...data,
    updatedAt: new Date().toISOString()
  });
});

// Any unsupported method
app.all('/api/resources', (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send();
  }
});
app.all('/api/resources/:id', (req, res) => {
  if (req.method !== 'PUT') {
    return res.status(405).send();
  }
});

app.listen(port, () => {
  console.log(`✅ Mock server running at http://localhost:${port}`);
});

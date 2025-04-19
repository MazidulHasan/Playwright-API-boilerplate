const express = require('express');
const bodyParser = require('body-parser'); //used for middleware
const cors = require('cors'); //Middleware to allow cross-origin requests
const { faker } = require('@faker-js/faker');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

let fakeDb = [];

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username && password) {
    res.json({ token: 'fake-jwt-token' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/resources', (req, res) => {
  const data = req.body;
  if (!data.name) {
    return res.status(400).json({ errors: ['"name" is required'] });
  }
  if (data.status === 'active' && !data.activationDate) {
    return res.status(400).json({ errors: ['activationDate is required when status is active'] });
  }

  const newResource = {
    ...data,
    id: faker.string.uuid(),
    createdAt: new Date().toISOString()
  };
  fakeDb.push(newResource);
  res.status(201).json(newResource);
});

app.put('/api/resources/:id', (req, res) => {
  const data = req.body;
  if (!data.updateReason) {
    return res.status(400).json({ errors: ['"updateReason" is required'] });
  }

  const resourceIndex = fakeDb.findIndex(r => r.id === req.params.id);
  if (resourceIndex === -1) {
    return res.status(404).json({ error: 'Not found' });
  }

  fakeDb[resourceIndex] = {
    ...fakeDb[resourceIndex],
    ...data,
    updatedAt: new Date().toISOString()
  };

  res.status(200).json(fakeDb[resourceIndex]);
});

app.listen(port, () => {
  console.log(`Mock API server listening on http://localhost:${port}`);
});

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(bodyParser.json());
const upload = multer({ dest: 'tests/basicWithSingleSpecFile/MockAPI/WithExpressServer/uploadedFiles/' });

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'both are required for login' });
  }

  if (username.length > 10) {
    return res.status(400).json({ error: 'user name can not be more than 10 character' });
  }

  if (password.length < 5) {
    return res.status(400).json({ error: 'password can not be less than 5 character' });
  }

  if (username === 'testData' && password === 'testData') {
    return res.json({ message: 'Login successful' });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/register',upload.single('image'), (req, res) => {
  console.log('From request body',req.body);
  console.log('upload image',req.file);
  

  const { fname, lname, email, password, country, region, city, phone, age, gender, image } = req.body;

  if (!fname) {
    return res.status(400).json({ error: 'Fname Required' });
  }

  return res.json({ message: 'Registration successful' });
})



const PORT = 3001;
app.listen(PORT, () => console.log(`Mock server running on port ${PORT}`));
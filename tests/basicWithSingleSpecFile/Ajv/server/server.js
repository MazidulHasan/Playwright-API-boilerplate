const express = require('express');
const userRoutes = require('../routes/index'); // or './userRoutes' if renamed

const app = express();
const PORT = 3000;

app.use(express.json()); // Body parser
app.use('/api', userRoutes); // All routes prefixed with /api

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

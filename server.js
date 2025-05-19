// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cartRoutes = require('./routes/routes');

const app = express();

// Middleware
app.use(bodyParser.json());

// Routing untuk cart
app.use('/api', cartRoutes);

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
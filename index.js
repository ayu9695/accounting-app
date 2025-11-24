const express = require('express');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const app = express();
const PORT = process.env.PORT || 3000;
const cookieParser = require('cookie-parser');
const initSalaryCron = require('./jobs/salaryCron');

connectDB();

app.use(express.json());
const cors = require('cors');
app.use(cors({
  origin: ['https://accounting-software-self.vercel.app/'], // your frontend URL
  credentials: true               // allow cookies to be sent
}));
app.use(cookieParser()); // ✅ Add this near top
app.use(express.json()); // Required to read JSON bodies

// === Auto-register all routes in routes/ ===
const routesPath = path.join(__dirname, 'routes');

fs.readdirSync(routesPath).forEach((file) => {
  const filePath = path.join(routesPath, file);
  const route = require(filePath);

  if (typeof route === 'function') {
    app.use('/api', route);  // You can prefix this with '/api' or customize
  }
});

initSalaryCron();

// Root route
app.get('/', (req, res) => {
  res.send('API is working!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

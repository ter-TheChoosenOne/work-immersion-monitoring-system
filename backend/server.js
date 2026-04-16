require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');

const app = express();

connectDB();


app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://work-immersion-monitoring-system-po.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const BASE_URI = '/api/v1';

const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const teacherRoutes = require('./src/routes/teacherRoutes');

app.use(`${BASE_URI}/auth`, authRoutes);
app.use(`${BASE_URI}/admin`, adminRoutes);
app.use(`${BASE_URI}/student`, studentRoutes);
app.use(`${BASE_URI}/teacher`, teacherRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Auth: http://localhost:${PORT}${BASE_URI}/auth`);
    console.log(`Admin: http://localhost:${PORT}${BASE_URI}/admin`);
  });
}

module.exports = app;
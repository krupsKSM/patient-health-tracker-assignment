const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');


const app = express();

// Connect to databases
connectDB();
connectRedis();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Only parse JSON for mutations
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    express.json()(req, res, next);
  } else {
    next();
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Placeholder error handler 
app.use((err, req, res, next) => {
  console.error(err.stack || err.message);
  res.status(err.statusCode || 500).json({ message: err.message || 'Server Error' });
});

module.exports = app;

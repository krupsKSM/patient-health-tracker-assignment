const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const connectDB = require('./config/db')
const { connectRedis } = require('./config/redis')

//Routes
const authRoutes = require('./routes/authRoutes')
const patientRoutes = require('./routes/patientRoutes')

const errorHandler = require('./middlewares/errorHandler')

const app = express()

// Connect databases
connectDB()
connectRedis()

// Security and logging middleware
app.use(cors())
app.use(helmet())
app.use(morgan('dev'))

// Only parse JSON for request methods that likely have a body
app.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        express.json()(req, res, next)
        return
    }
    next()
})

// Serve static uploaded files
app.use('/uploads', express.static('uploads'))

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'TEST API is working fine!' })
})

// Mount routes
app.use('/api/auth', authRoutes)
app.use('/api/patients', patientRoutes)


// Error handling middleware - catches any thrown errors
app.use(errorHandler)


// default fallback
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' })
})


module.exports = app

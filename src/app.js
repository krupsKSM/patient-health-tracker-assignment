const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const connectDB = require('./config/db')
const { connectRedis } = require('./config/redis')

// Import routes
const authRoutes = require('./routes/authRoutes')
const patientRoutes = require('./routes/patientRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')

// Import errorHandler middleware
const errorHandler = require('./middlewares/errorHandler')

const app = express()

// Connect databases (MongoDB + Redis)
connectDB()
connectRedis()

// Import Bull queues
const { reportQueue } = require('./jobs/bullQueues')

// Initialize Bull queue listeners (starts processors)
reportQueue.on('completed', (job) => {
    console.log(`Bull Job completed: ${job.id}`)
})
reportQueue.on('failed', (job, err) => {
    console.error(`Bull Job failed: ${job.id}, error:`, err)
})

// Middleware: security, logging, parsing
app.use(cors())
app.use(helmet())
app.use(morgan('dev'))

app.use(express.json())


// Serve uploaded files statically
app.use('/uploads', express.static('uploads'))

// Test route for sanity check
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working fine!' })
})

// Register API routes
app.use('/api/auth', authRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/dashboard', dashboardRoutes)

// Centralized error handler must be last middleware
app.use(errorHandler)

// Default 404 fallback route
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' })
})

module.exports = app

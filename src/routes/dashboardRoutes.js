const express = require('express')
const { getAdminDashboard } = require('../controllers/dashboardController')
const { protect, authorizeRoles } = require('../middlewares/authMiddleware')

const router = express.Router()

// Admin-only dashboard endpoint
router.get('/admin', protect, authorizeRoles('admin'), getAdminDashboard)

module.exports = router

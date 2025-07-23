const Bull = require('bull')
const { getRedisClient } = require('../config/redis')
const { sendWhatsAppMessage } = require('../services/whatsappService')
const { syncWithZohoCRM } = require('../services/crmService')
const Patient = require('../models/Patient')

const reportQueue = new Bull('report-queue', process.env.REDIS_URL, {
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 }
    }
})

reportQueue.process(async (job) => {
    const { patient } = job.data

    try {
        // Sends WhatsApp notification
        await sendWhatsAppMessage(patient)
        await (getRedisClient()).incr('whatsappDelivered')

        // Pushes to Zoho CRM (mock)
        await syncWithZohoCRM(patient)
        await (getRedisClient()).incr('crmSyncSuccess')

        // Marks report sent in Patient document
        await Patient.findByIdAndUpdate(patient._id, { whatsappReportSent: true, crmSyncStatus: 'success' })

        await (getRedisClient()).incr('reportsSent')

        console.log(`Job completed for patient ${patient._id}`)
    } catch (error) {
        await Patient.findByIdAndUpdate(patient._id, { crmSyncStatus: 'fail' })
        await (getRedisClient()).incr('crmSyncFailure')
        console.error(`Job failed for patient ${patient._id}:`, error.message)
        throw error // to trigger retry
    }
})

module.exports = { reportQueue }

const Patient = require('../models/Patient')
const { getRedisClient } = require('../config/redis')

exports.getAdminDashboard = async (req, res, next) => {
    try {
        // MongoDB: total patients count
        const totalPatients = await Patient.countDocuments()

        // MongoDB aggregation for average BMI (weight / height(m)^2)
        const bmiAggregation = await Patient.aggregate([
            {
                $addFields: {
                    bmi: { $divide: ['$weight', { $pow: [{ $divide: ['$height', 100] }, 2] }] },
                },
            },
            {
                $group: {
                    _id: null,
                    averageBMI: { $avg: '$bmi' },
                },
            },
        ])

        const averageBMI = bmiAggregation[0]?.averageBMI || 0

        const redisClient = getRedisClient()

        // Redis fetches - convert to integer or default 0
        const [
            reportsSentStr,
            whatsappDeliveredStr,
            crmSyncSuccessStr,
            crmSyncFailureStr,
        ] = await Promise.all([
            redisClient.get('reportsSent'),
            redisClient.get('whatsappDelivered'),
            redisClient.get('crmSyncSuccess'),
            redisClient.get('crmSyncFailure'),
        ])

        res.json({
            totalPatients,
            averageBMI: Number(averageBMI.toFixed(2)),
            reportsSent: parseInt(reportsSentStr) || 0,
            whatsappDelivered: parseInt(whatsappDeliveredStr) || 0,
            crmSyncSuccess: parseInt(crmSyncSuccessStr) || 0,
            crmSyncFailure: parseInt(crmSyncFailureStr) || 0,
        })
    } catch (error) {
        next(error)
    }
}

const Patient = require('../models/Patient')

// Helper function to build BMI filter
function buildBMIFilter(minBMI, maxBMI) {
    const filter = {}
    if (minBMI !== undefined) filter.$gte = Number(minBMI)
    if (maxBMI !== undefined) filter.$lte = Number(maxBMI)
    return Object.keys(filter).length ? filter : null
}

exports.createPatient = async (req, res, next) => {
    try {
        const { name, age, height, weight, fatPercentage } = req.body
        const profileImage = req.files?.profileImage?.[0]?.path
        const reportPDF = req.files?.reportPDF?.[0]?.path

        if (!name || !age || !weight || !fatPercentage || !height) {
            return res.status(400).json({ message: 'Please provide name, age, height, weight, and fatPercentage.' })
        }

        const patient = new Patient({
            name, age, height, weight, fatPercentage,
            profileImage, reportPDF,
            createdBy: req.user.id,
        })

        await patient.save()
        res.status(201).json(patient)
    } catch (err) {
        next(err)
    }
}

exports.getPatients = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, sortBy = 'age', order = 'asc', minBMI, maxBMI } = req.query

        const bmiFilter = buildBMIFilter(minBMI, maxBMI)

        // Build aggregation pipeline to calculate BMI and filter if needed
        const pipeline = []

        // Project needed fields + compute bmi
        pipeline.push({
            $addFields: {
                bmi: { $divide: ['$weight', { $pow: [{ $divide: ['$height', 100] }, 2] }] },
            },
        })

        // Filter by BMI if provided
        if (bmiFilter) {
            pipeline.push({
                $match: { bmi: bmiFilter }
            })
        }

        // Total count for pagination
        const countPipeline = [...pipeline, { $count: "total" }]
        const countResult = await Patient.aggregate(countPipeline)
        const total = countResult[0] ? countResult[0].total : 0

        // Sort
        const sortDirection = order === 'asc' ? 1 : -1
        pipeline.push({ $sort: { [sortBy]: sortDirection } })

        // Pagination (skip, limit)
        pipeline.push({ $skip: (Number(page) - 1) * Number(limit) })
        pipeline.push({ $limit: Number(limit) })

        // Run aggregation to get patients with bmi
        const patients = await Patient.aggregate(pipeline)

        res.json({
            total,
            page: Number(page),
            limit: Number(limit),
            patients,
        })
    } catch (err) {
        next(err)
    }
}

exports.getPatientById = async (req, res, next) => {
    try {
        const patient = await Patient.findById(req.params.id)
        if (!patient) return res.status(404).json({ message: 'Patient not found' })
        res.json(patient)
    } catch (err) {
        next(err)
    }
}

exports.updatePatient = async (req, res, next) => {
    try {
        const patient = await Patient.findById(req.params.id)
        if (!patient) return res.status(404).json({ message: 'Patient not found' })

        const { name, age, height, weight, fatPercentage } = req.body
        if (name) patient.name = name
        if (age) patient.age = age
        if (height) patient.height = height
        if (weight) patient.weight = weight
        if (fatPercentage) patient.fatPercentage = fatPercentage

        if (req.files?.profileImage) patient.profileImage = req.files.profileImage[0].path
        if (req.files?.reportPDF) patient.reportPDF = req.files.reportPDF[0].path

        await patient.save()
        res.json(patient)
    } catch (err) {
        next(err)
    }
}

exports.deletePatient = async (req, res, next) => {
    try {
        const patient = await Patient.findById(req.params.id)
        if (!patient) return res.status(404).json({ message: 'Patient not found' })
        await patient.remove()
        res.json({ message: 'Patient deleted successfully' })
    } catch (err) {
        next(err)
    }
}

const path = require('path')
const fs = require('fs')
const { generateDummyPDF } = require('../services/pdfService')
const Patient = require('../models/Patient')

// Helper to build BMI filtering for aggregation pipeline
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
    let reportPDF = req.files?.reportPDF?.[0]?.path

    if (!name || !age || !height || !weight || !fatPercentage) {
      return res.status(400).json({ message: 'Please provide name, age, height, weight and fatPercentage.' })
    }

    // Auto-generate PDF report if none uploaded
    if (!reportPDF) {
      const reportsDir = path.resolve('uploads/reports')
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true })

      const pdfPath = path.join(reportsDir, `report_${Date.now()}.pdf`)
      await generateDummyPDF(name, pdfPath)
      reportPDF = pdfPath
    }

    const patient = new Patient({
      name, age, height, weight, fatPercentage, profileImage, reportPDF,
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

    // Calculate BMI for each patient
    pipeline.push({
      $addFields: {
        bmi: { $divide: ['$weight', { $pow: [{ $divide: ['$height', 100] }, 2] }] }
      }
    })

    if (bmiFilter) {
      pipeline.push({ $match: { bmi: bmiFilter } })
    }

    // Count total matching documents
    const countPipeline = [...pipeline, { $count: 'total' }]
    const countResult = await Patient.aggregate(countPipeline)
    const total = countResult[0]?.total || 0

    // Sorting and Pagination
    const sortOrder = order === 'asc' ? 1 : -1
    pipeline.push({ $sort: { [sortBy]: sortOrder } })
    pipeline.push({ $skip: (page - 1) * limit })
    pipeline.push({ $limit: Number(limit) })

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

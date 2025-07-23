const path = require('path')
const fs = require('fs')
const { generateDummyPDF } = require('../services/pdfService')
const Patient = require('../models/Patient')
const { reportQueue } = require('../jobs/bullQueues')


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

    // Safely access uploaded file paths, if any
    const profileImage = req.files?.profileImage?.[0]?.path || ''
    let reportPDF = req.files?.reportPDF?.[0]?.path || ''

    if (!name || !age || !height || !weight || !fatPercentage) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (typeof age !== 'number' || typeof height !== 'number' || typeof weight !== 'number' || typeof fatPercentage !== 'number') {
      return res.status(400).json({ message: 'Age, height, weight, and fatPercentage must be numbers' });
    }

    // Generate dummy PDF only if no report PDF uploaded
    if (!reportPDF) {
      const destPath = path.join('uploads', `${name}-${Date.now()}.pdf`);
      try {
        await generateDummyPDF(name, destPath);
        reportPDF = destPath; // Set reportPDF to the generated path
      } catch (error) {
        console.error('Error generating dummy PDF:', error);
        // Optionally, you might want to set a default value or handle the error differently
      }
    }

    const patient = new Patient({
      name,
      age,
      height,
      weight,
      fatPercentage,
      profileImage,
      reportPDF,
      createdBy: req.user.id,
    });

    try {
      await patient.save();
      console.log('Patient saved successfully:', patient._id);
    } catch (saveError) {
      console.error('Error saving patient:', saveError);
      return next(saveError);
    }

    // Enqueue background job as usual
    try {
      await reportQueue.add({ patient });
    } catch (queueError) {
      console.error('Error adding job to queue:', queueError);
    }

    res.status(201).json(patient)
  } catch (err) {
    next(err)
  }
}


exports.getPatients = async (req, res, next) => {
  try {
    let { page = 1, limit = 10, sortBy = 'age', order = 'asc', minBMI, maxBMI } = req.query

    page = Number(page);
    limit = Number(limit);
    minBMI = minBMI ? Number(minBMI) : undefined;
    maxBMI = maxBMI ? Number(maxBMI) : undefined;

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 100) limit = 10; // Limit to a reasonable max
    if (sortBy !== 'age' && sortBy !== 'bmi' && sortBy !== 'name') sortBy = 'age';
    if (order !== 'asc' && order !== 'desc') order = 'asc';

    if ((minBMI && isNaN(minBMI)) || (maxBMI && isNaN(maxBMI))) {
      return res.status(400).json({ message: 'minBMI and maxBMI must be numbers' });
    }

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

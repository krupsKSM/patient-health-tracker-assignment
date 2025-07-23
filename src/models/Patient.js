const mongoose = require('mongoose')

const patientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    // Height in cm, though its not given in requirements, but we need to have it for BMI calc
    height: {
        type: Number,
        required: true
    },
    // In Kilograms
    weight: {
        type: Number,
        required: true
    },
    // Body fat % value       
    fatPercentage: {
        type: Number,
        required: true
    },
    // Path to uploaded image
    profileImage: {
        type: String
    },
    // Path to uploaded/generated PDF                    
    reportPDF: { type: String },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
}, { timestamps: true });

// Virtual field for BMI (weight(kg) / height(m)^2)
// Note: height stored in cm, convert to meters before calculation
patientSchema.virtual('bmi').get(function () {
  const heightMeters = this.height / 100
  return this.weight / (heightMeters * heightMeters)
})

patientSchema.set('toJSON', { virtuals: true })
patientSchema.set('toObject', { virtuals: true })

module.exports = mongoose.model('Patient', patientSchema);


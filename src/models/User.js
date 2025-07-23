const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true 
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['patient', 'coach', 'admin'],
    default: 'patient'
  }
}, { timestamps: true });

// Hash password before save if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const saltRounds = 10
    this.password = await bcrypt.hash(this.password, saltRounds)
    next()
  } catch (err) {
    next(err);
  }
});

// Compare entered password with hashed
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password)
};

module.exports = mongoose.model('User', userSchema)

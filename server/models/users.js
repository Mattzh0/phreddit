// User Document Schema
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    displayName: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true
    },
    reputation: {
      type: Number,
      default: 100
    },
    created: {
      type: Date,
      default: Date.now
    }
  }
)

module.exports = mongoose.model('User', userSchema);
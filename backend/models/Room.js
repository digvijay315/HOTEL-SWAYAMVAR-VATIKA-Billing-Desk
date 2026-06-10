const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['AC', 'Non-AC', 'Hall', 'Mini Hall']
  },
  beds: {
    type: Number,
    required: true,
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Available', 'Occupied'],
    default: 'Available'
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);

const mongoose = require("mongoose");

const grcCounterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    default: "grcNo"
  },
  sequence_value: {
    type: Number,
    required: true,
    default: 1
  }
});

module.exports = mongoose.model("GRCCounter", grcCounterSchema);

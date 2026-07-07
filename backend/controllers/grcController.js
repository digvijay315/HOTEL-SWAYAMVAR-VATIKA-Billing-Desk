const GRCCounter = require("../models/GRCCounter");

// Get current GRC number
exports.getCounter = async (req, res) => {
  try {
    let counter = await GRCCounter.findOne({ name: "grcNo" });
    if (!counter) {
      counter = new GRCCounter({ name: "grcNo", sequence_value: 1 });
      await counter.save();
    }
    res.json({ sequence_value: counter.sequence_value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Increment GRC number
exports.incrementCounter = async (req, res) => {
  try {
    let counter = await GRCCounter.findOneAndUpdate(
      { name: "grcNo" },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    res.json({ sequence_value: counter.sequence_value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reset GRC number
exports.resetCounter = async (req, res) => {
  try {
    const { sequence_value } = req.body;
    const val = sequence_value || 1;
    let counter = await GRCCounter.findOneAndUpdate(
      { name: "grcNo" },
      { sequence_value: val },
      { new: true, upsert: true }
    );
    res.json({ sequence_value: counter.sequence_value, message: "GRC Number reset successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

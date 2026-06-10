const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String, // Cloudinary Image URL
      required: true,
    },
    category: {
      type: String,
      default: "General",
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Dish", dishSchema);

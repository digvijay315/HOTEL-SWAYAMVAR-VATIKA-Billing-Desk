const Dish = require("../models/Dish");

// @desc    Get all dishes
// @route   GET /api/dishes
// @access  Private (both staff and admin)
const getDishes = async (req, res) => {
  try {
    const dishes = await Dish.find({});
    res.json({ success: true, dishes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a new dish
// @route   POST /api/dishes
// @access  Private/Admin
const addDish = async (req, res) => {
  const { name, price, image, category } = req.body;

  try {
    if (!name || !price || !image) {
      return res.status(400).json({ success: false, message: "Please enter name, price, and upload an image" });
    }

    const dishExists = await Dish.findOne({ name });
    if (dishExists) {
      return res.status(400).json({ success: false, message: "Dish with this name already exists" });
    }

    const dish = await Dish.create({
      name,
      price: Number(price),
      image,
      category: category || "General",
    });

    res.status(201).json({ success: true, dish });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a dish
// @route   PUT /api/dishes/:id
// @access  Private/Admin
const updateDish = async (req, res) => {
  const { name, price, image, category, available } = req.body;

  try {
    const dish = await Dish.findById(req.params.id);

    if (!dish) {
      return res.status(404).json({ success: false, message: "Dish not found" });
    }

    dish.name = name || dish.name;
    dish.price = price !== undefined ? Number(price) : dish.price;
    dish.image = image || dish.image;
    dish.category = category || dish.category;
    dish.available = available !== undefined ? available : dish.available;

    const updatedDish = await dish.save();
    res.json({ success: true, dish: updatedDish });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a dish
// @route   DELETE /api/dishes/:id
// @access  Private/Admin
const deleteDish = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);

    if (!dish) {
      return res.status(404).json({ success: false, message: "Dish not found" });
    }

    await Dish.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Dish deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDishes,
  addDish,
  updateDish,
  deleteDish,
};

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mobile: user.mobile,
        },
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new staff member
// @route   POST /api/auth/register-staff
// @access  Private/Admin
const registerStaff = async (req, res) => {
  const { name, email, password, mobile, age, address } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: "Staff with this email already exists" });
    }

    const staff = await User.create({
      name,
      email,
      password, // Will be hashed by userSchema pre-save hook
      role: "staff",
      mobile,
      age,
      address,
    });

    if (staff) {
      res.status(201).json({
        success: true,
        message: "Staff member registered successfully",
        staff: {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          mobile: staff.mobile,
          age: staff.age,
          address: staff.address,
        },
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid staff data" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all staff members
// @route   GET /api/auth/staff
// @access  Private/Admin
const getStaff = async (req, res) => {
  try {
    const staffMembers = await User.find({ role: "staff" }).select("-password");
    res.json({ success: true, staff: staffMembers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a staff member
// @route   DELETE /api/auth/staff/:id
// @access  Private/Admin
const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);

    if (!staff || staff.role !== "staff") {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Staff member deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  loginUser,
  registerStaff,
  getStaff,
  deleteStaff,
};

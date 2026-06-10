const RoomBooking = require('../models/RoomBooking');
const Room = require('../models/Room');

// @desc    Get all room bookings
// @route   GET /api/room-bookings
// @access  Private
exports.getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, filter, startDate, endDate, search } = req.query;
    let query = {};

    // Date filtering based on checkInTime or createdAt
    if (filter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filter === 'today') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        query.createdAt = { $gte: today, $lt: tomorrow };
      } else if (filter === 'week') {
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        query.createdAt = { $gte: lastWeek };
      } else if (filter === 'month') {
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        query.createdAt = { $gte: lastMonth };
      } else if (filter === 'year') {
        const lastYear = new Date(today);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        query.createdAt = { $gte: lastYear };
      } else if (filter === 'custom' && startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        };
      }
    }

    // Search by guest name or room number (complex across populated fields, so we do basic guest name search if provided)
    if (search) {
      query['guests.name'] = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const totalBookings = await RoomBooking.countDocuments(query);
    const bookings = await RoomBooking.find(query)
      .populate('room', 'roomNumber type price')
      .populate('staffId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: bookings,
      pagination: {
        total: totalBookings,
        page: parseInt(page),
        pages: Math.ceil(totalBookings / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check In (Create a new booking)
// @route   POST /api/room-bookings/checkin
// @access  Private (Staff)
exports.checkIn = async (req, res) => {
  try {
    const { roomId, guests, advanceAmount } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.status === 'Occupied') {
      return res.status(400).json({ success: false, message: 'Room is already occupied' });
    }

    // Create Booking
    const booking = await RoomBooking.create({
      room: roomId,
      guests,
      advanceAmount: Number(advanceAmount) || 0,
      staffId: req.user._id,
      status: 'Checked-In'
    });

    // Update Room Status
    room.status = 'Occupied';
    await room.save();

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check Out
// @route   POST /api/room-bookings/checkout/:id
// @access  Private (Staff)
exports.checkOut = async (req, res) => {
  try {
    const booking = await RoomBooking.findById(req.params.id).populate('room');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'Checked-Out') {
      return res.status(400).json({ success: false, message: 'Already checked out' });
    }

    booking.checkOutTime = Date.now();
    booking.status = 'Checked-Out';

    // Calculate total amount based on room price. 
    // In a real scenario, you'd calculate days between checkIn and checkOut.
    // For simplicity, we just charge the base price or day-based price.
    const checkInDate = new Date(booking.checkInTime);
    const checkOutDate = new Date(booking.checkOutTime);
    
    // Difference in milliseconds
    const diffTime = Math.abs(checkOutDate - checkInDate);
    
    // Removed grace period to strictly charge next day after 24 hours
    
    // Calculate days and ensure minimum of 1 day
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) diffDays = 1; // Minimum 1 day charge
    
    // Check if staff provided a manual override
    if (req.body.manualTotalAmount !== undefined && req.body.manualTotalAmount !== null) {
      booking.totalAmount = Number(req.body.manualTotalAmount);
    } else {
      booking.totalAmount = diffDays * booking.room.price;
    }
    
    await booking.save();

    // Update Room Status
    const room = await Room.findById(booking.room._id);
    room.status = 'Available';
    await room.save();

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

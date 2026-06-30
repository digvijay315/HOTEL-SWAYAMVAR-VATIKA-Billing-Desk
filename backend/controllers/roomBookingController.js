const RoomBooking = require('../models/RoomBooking');
const Room = require('../models/Room');
const ExcelJS = require('exceljs');

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
    
    // Add support for active filter
    if (filter === 'active') {
      query.status = 'Checked-In';
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
      .populate('restaurantBills')
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
    const { roomId, guests, advanceAmount, hasGST, gstNumber, companyName, companyAddress } = req.body;

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
      hasGST: hasGST || false,
      gstNumber: hasGST ? gstNumber : '',
      companyName: hasGST ? companyName : '',
      companyAddress: hasGST ? companyAddress : '',
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
    const booking = await RoomBooking.findById(req.params.id)
      .populate('room')
      .populate('restaurantBills');

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
      let roomTotal = diffDays * booking.room.price;
      let restaurantTotal = 0;
      if (booking.restaurantBills && booking.restaurantBills.length > 0) {
        restaurantTotal = booking.restaurantBills.reduce((sum, bill) => sum + bill.grandTotal, 0);
      }
      booking.totalAmount = roomTotal + restaurantTotal;
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

// @desc    Verify GST Number
// @route   GET /api/room-bookings/verify-gst/:gstNumber
// @access  Private (Staff)
exports.verifyGST = async (req, res) => {
  try {
    const { gstNumber } = req.params;
    
    // Check if the user has provided an API key in the environment for AppyFlow or Razorpay
    // Example: process.env.GST_API_KEY
    
    if (process.env.GST_API_KEY) {
      const axios = require('axios');
      try {
        const response = await axios.get(`https://appyflow.in/api/verifyGST?gstNo=${gstNumber}&key_secret=${process.env.GST_API_KEY}`);
        
        if (response.data && !response.data.error) {
          const info = response.data.taxpayerInfo || {};
          const addrObj = info.pradr?.addr || {};
          const addressString = `${addrObj.bno || ''} ${addrObj.st || ''} ${addrObj.loc || ''}, ${addrObj.dst || ''}, ${addrObj.stcd || ''} - ${addrObj.pncd || ''}`.replace(/\s+/g, ' ').trim() || "Address verified";

          return res.json({ 
            success: true, 
            data: {
              businessName: info.tradeNam || info.lgnm || "Unknown",
              address: addressString
            } 
          });
        } else {
          return res.status(400).json({ success: false, message: response.data?.message || 'Invalid GST or API Error' });
        }
      } catch (err) {
        console.error("GST API Error:", err.response?.data || err.message);
        return res.status(400).json({ 
          success: false, 
          message: err.response?.data?.message || err.response?.data?.error || "GST Verification failed from provider. Check API Key or GST No."
        });
      }
    }

    // Fallback: Mock provider response if no API key is provided so it still works for demo
    // In production, the client must configure their .env with a valid API Key
    const mockData = {
      businessName: "Verified Company Pvt Ltd (Mock)",
      address: "123 Business Avenue, City Center, 400001 (Mock Data)",
      status: "Active"
    };

    // A small delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 800));

    res.json({ success: true, data: mockData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get previous guest details by phone number
// @route   GET /api/room-bookings/guest/:phone
// @access  Private (Staff)
exports.getGuestByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    
    // Find the most recent booking that has a guest with this phone number
    const booking = await RoomBooking.findOne({ 'guests.phone': phone })
      .sort({ createdAt: -1 });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'No guest found with this phone number' });
    }

    // Extract the specific guest from the array
    const guest = booking.guests.find(g => g.phone === phone);

    if (!guest) {
      return res.status(404).json({ success: false, message: 'No guest found with this phone number' });
    }

    res.json({ success: true, data: guest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export room bookings to excel
// @route   GET /api/room-bookings/export
// @access  Private
exports.exportBookingsToExcel = async (req, res) => {
  try {
    const { filter, startDate, endDate, search } = req.query;
    let query = {};

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
    
    if (filter === 'active') {
      query.status = 'Checked-In';
    }

    if (search) {
      query['guests.name'] = { $regex: search, $options: 'i' };
    }

    const bookings = await RoomBooking.find(query)
      .populate('room', 'roomNumber type price')
      .populate('staffId', 'name')
      .populate('restaurantBills')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Room Bookings');

    worksheet.columns = [
      { header: 'Guest Name', key: 'guestName', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'ID Type', key: 'idType', width: 15 },
      { header: 'ID Number', key: 'idNumber', width: 20 },
      { header: 'Room No', key: 'roomNo', width: 15 },
      { header: 'Room Type', key: 'roomType', width: 15 },
      { header: 'Check In', key: 'checkIn', width: 20 },
      { header: 'Check Out', key: 'checkOut', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      // { header: 'Amount (₹)', key: 'amount', width: 15 }
    ];

    bookings.forEach(b => {
      worksheet.addRow({
        guestName: b.guests && b.guests.length > 0 ? b.guests[0].name : 'N/A',
        phone: b.guests && b.guests.length > 0 ? b.guests[0].phone : 'N/A',
        idType: b.guests && b.guests.length > 0 ? b.guests[0].idType : 'N/A',
        idNumber: b.guests && b.guests.length > 0 ? b.guests[0].idNumber : 'N/A',
        roomNo: b.room ? b.room.roomNumber : 'N/A',
        roomType: b.room ? b.room.type : 'N/A',
        checkIn: b.checkInTime ? new Date(b.checkInTime).toLocaleString("en-IN") : 'N/A',
        checkOut: b.checkOutTime ? new Date(b.checkOutTime).toLocaleString("en-IN") : 'N/A',
        status: b.status,
        // amount: b.totalAmount || 0
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=RoomBookings.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

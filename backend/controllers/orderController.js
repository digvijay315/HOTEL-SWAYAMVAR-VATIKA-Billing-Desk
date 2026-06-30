const Order = require("../models/Order");
const Table = require("../models/Table");
const Invoice = require("../models/Invoice");

// @desc    Create or update order for a table
// @route   POST /api/orders
// @access  Private (Staff)
exports.createOrUpdateOrder = async (req, res) => {
  try {
    const { tableId, items, subTotal, tax, grandTotal } = req.body;

    let table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }

    let order;

    if (table.currentOrderId) {
      // Update existing order
      order = await Order.findById(table.currentOrderId);
      if (order) {
        order.items = items;
        order.subTotal = subTotal;
        order.tax = tax;
        order.grandTotal = grandTotal;
        await order.save();
      } else {
        // Fallback if currentOrderId is invalid
        order = await Order.create({
          table: tableId,
          items,
          subTotal,
          tax,
          grandTotal,
          createdBy: req.user._id,
        });
        table.currentOrderId = order._id;
        table.status = "Occupied";
        await table.save();
      }
    } else {
      // Create new order
      order = await Order.create({
        table: tableId,
        items,
        subTotal,
        tax,
        grandTotal,
        createdBy: req.user._id,
      });
      table.currentOrderId = order._id;
      table.status = "Occupied";
      await table.save();
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active order for a table
// @route   GET /api/orders/active/:tableId
// @access  Private
exports.getActiveOrder = async (req, res) => {
  try {
    const table = await Table.findById(req.params.tableId).populate("currentOrderId");
    if (!table || !table.currentOrderId) {
      return res.status(200).json({ success: true, data: null });
    }
    
    // Ensure we populate dish details if needed, but the items array has what we need
    res.status(200).json({ success: true, data: table.currentOrderId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Checkout and generate bill
// @route   POST /api/orders/:orderId/checkout
// @access  Private
exports.checkoutOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate("table");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "Billed") {
      return res.status(400).json({ success: false, message: "Order is already billed" });
    }

    // Create Invoice
    const invoice = await Invoice.create({
      customerName: `Table ${order.table.tableNo}`,
      customerMobile: "N/A", // Staff KOT generally doesn't ask for mobile immediately, or can be added later
      items: order.items,
      subTotal: order.subTotal,
      tax: order.tax,
      grandTotal: order.grandTotal,
      createdBy: req.user._id,
      tableId: order.table._id,
      orderId: order._id,
      status: "Paid", // Assuming paid right away for restaurant bill
    });

    // Update Order
    order.status = "Billed";
    await order.save();

    // Free the table
    const table = order.table;
    table.status = "Available";
    table.currentOrderId = null;
    await table.save();

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

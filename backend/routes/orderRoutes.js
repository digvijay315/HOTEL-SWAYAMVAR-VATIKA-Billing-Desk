const express = require("express");
const { createOrUpdateOrder, getActiveOrder, checkoutOrder } = require("../controllers/orderController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.route("/").post(protect, createOrUpdateOrder);
router.route("/active/:tableId").get(protect, getActiveOrder);
router.route("/:orderId/checkout").post(protect, checkoutOrder);

module.exports = router;

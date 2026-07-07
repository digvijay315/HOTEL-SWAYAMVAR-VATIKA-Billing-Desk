const express = require("express");
const router = express.Router();
const { getCounter, incrementCounter, resetCounter } = require("../controllers/grcController");

router.get("/", getCounter);
router.post("/increment", incrementCounter);
router.post("/reset", resetCounter);

module.exports = router;

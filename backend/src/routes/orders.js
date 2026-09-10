const express = require("express");
const {
  createOrder,
  getOrders,
  getOrder,
} = require("../controllers/orderController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrder);

module.exports = router;

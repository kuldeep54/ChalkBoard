const express = require("express");
const { body } = require("express-validator");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  mergeCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", getCart);

router.post(
  "/",
  [
    body("productId").isMongoId().withMessage("Valid product ID is required"),
    body("quantity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Quantity must be a positive number"),
  ],
  addToCart
);

router.post(
  "/add",
  [
    body("productId").isMongoId().withMessage("Valid product ID is required"),
    body("quantity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Quantity must be a positive number"),
  ],
  addToCart
);

router.put(
  "/update",
  [
    body("productId").isMongoId().withMessage("Valid product ID is required"),
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  ],
  updateCartItem
);

router.post(
  "/merge",
  [
    body("items").isArray({ min: 1 }).withMessage("Items are required"),
    body("items.*.productId")
      .isMongoId()
      .withMessage("Valid product ID is required"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be a positive number"),
  ],
  mergeCart
);

router.delete("/remove/:productId", removeFromCart);

module.exports = router;

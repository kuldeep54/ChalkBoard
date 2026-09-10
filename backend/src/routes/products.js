const express = require("express");
const { body } = require("express-validator");
const {
  getProducts,
  getProduct,
  getRelatedProducts,
  getCategories,
} = require("../controllers/productController");
const {
  getReviews,
  createReview,
  deleteReview,
} = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/:id/reviews", getReviews);
router.post(
  "/:id/reviews",
  protect,
  [
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment")
      .trim()
      .notEmpty()
      .withMessage("Please add a review comment")
      .isLength({ max: 1000 })
      .withMessage("Comment cannot be more than 1000 characters"),
  ],
  createReview
);
router.delete("/:id/reviews/:reviewId", protect, deleteReview);
router.get("/:id/related", getRelatedProducts);
router.get("/:id", getProduct);

module.exports = router;

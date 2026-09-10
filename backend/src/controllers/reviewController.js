const Review = require("../models/Review");
const Product = require("../models/Product");
const { validationResult } = require("express-validator");

const recalculateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const rating = stats.length > 0 ? Math.round(stats[0].avg * 10) / 10 : 0;
  const ratingCount = stats.length > 0 ? stats[0].count : 0;

  await Product.findByIdAndUpdate(
    productId,
    { rating, ratingCount },
    { new: true }
  );
};

exports.getReviews = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const reviews = await Review.find({ product: req.params.id })
      .populate("user", "name")
      .sort("-createdAt");

    const averageRating = reviews.length
      ? Math.round(
          (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
        ) / 10
      : product.rating || 0;

    res.json({
      success: true,
      averageRating,
      reviewCount: reviews.length,
      reviews,
    });
  } catch (err) {
    next(err);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const productId = product._id;
    const userId = req.user._id;

    const existing = await Review.findOne({ product: productId, user: userId });
    if (existing) {
      existing.rating = req.body.rating;
      existing.comment = req.body.comment.trim();
      await existing.save();
    } else {
      await Review.create({
        product: productId,
        user: userId,
        rating: req.body.rating,
        comment: req.body.comment.trim(),
      });
    }

    await recalculateProductRating(productId);

    res.status(201).json({
      success: true,
      message: existing ? "Review updated" : "Review submitted",
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "You can only delete your own review" });
    }

    const productId = review.product;
    await review.deleteOne();
    await recalculateProductRating(productId);

    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    next(err);
  }
};
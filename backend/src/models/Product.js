const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a product name"],
      trim: true,
      maxlength: [200, "Name cannot be more than 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
      maxlength: [2000, "Description cannot be more than 2000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Please add a price"],
      min: [0, "Price must be positive"],
    },
    images: {
      type: [String],
      required: [true, "Please add at least one image URL"],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "Product must have at least one image",
      },
    },
    category: {
      type: String,
      required: [true, "Please add a category"],
      enum: [
        "Electronics",
        "Clothing",
        "Books",
        "Home",
        "Sports",
        "Beauty",
        "Toys",
        "Other",
      ],
    },
    rating: {
      type: Number,
      min: [0, "Rating cannot be below 0"],
      max: [5, "Rating cannot exceed 5"],
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    trending: {
      type: Boolean,
      default: false,
    },
    discountPrice: {
      type: Number,
      min: [0, "Discount price must be positive"],
      default: null,
    },
    stock: {
      type: Number,
      required: [true, "Please add stock quantity"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
  },
  { timestamps: true }
);

ProductSchema.virtual("isOnSale").get(function () {
  return (
    this.discountPrice != null &&
    this.discountPrice > 0 &&
    this.discountPrice < this.price
  );
});

ProductSchema.virtual("discountPercent").get(function () {
  if (!this.isOnSale) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

ProductSchema.set("toJSON", { virtuals: true });
ProductSchema.set("toObject", { virtuals: true });

ProductSchema.index({ name: "text", description: "text" });
ProductSchema.index({ category: 1 });

module.exports = mongoose.model("Product", ProductSchema);

const Product = require("../models/Product");

const escapeRegex = (text) =>
  String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const clampLimit = (value) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return 20;
  return Math.min(parsed, 100);
};

exports.getProducts = async (req, res, next) => {
  try {
    const {
      category,
      search,
      featured,
      trending,
      discount,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (featured === "true") query.featured = true;
    if (trending === "true") query.trending = true;
    if (discount === "true") {
      query.discountPrice = { $ne: null, $gt: 0 };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const currentPage = Number.isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
    const limitNum = clampLimit(limit);

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      priceAsc: { price: 1 },
      priceDesc: { price: -1 },
      rating: { rating: -1 },
      name: { name: 1 },
    };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((currentPage - 1) * limitNum)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage,
      products,
    });
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

exports.getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
    })
      .sort({ rating: -1, createdAt: -1 })
      .limit(Math.min(parseInt(req.query.limit) || 6, 20));

    res.status(200).json({ success: true, count: related.length, products: related });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct("category");
    res.status(200).json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};
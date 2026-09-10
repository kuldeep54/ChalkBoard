const express = require("express");
const {
  getProducts,
  getProduct,
  getRelatedProducts,
  getCategories,
} = require("../controllers/productController");

const router = express.Router();

router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/:id/related", getRelatedProducts);
router.get("/:id", getProduct);

module.exports = router;

const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { validationResult } = require("express-validator");

const parseQuantity = (value, fallback = 1) => {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed >= 1) return parsed;
  return fallback;
};

const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg });
    return true;
  }
  return false;
};

exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    if (checkValidation(req, res)) return;

    const { productId } = req.body;
    const quantity = parseQuantity(req.body.quantity, 1);

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient stock" });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, quantity }],
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }
      await cart.save();
    }

    cart = await Cart.findOne({ user: req.user.id }).populate("items.product");

    res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    if (checkValidation(req, res)) return;

    const { productId } = req.body;
    const quantity = parseQuantity(req.body.quantity);

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID is required" });
    }

    const product = await Product.findById(productId);
    if (product && product.stock < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient stock" });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not in cart" });
    }

    item.quantity = quantity;
    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    res.status(200).json({ success: true, cart: updatedCart });
  } catch (err) {
    next(err);
  }
};

exports.mergeCart = async (req, res, next) => {
  try {
    if (checkValidation(req, res)) return;

    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one item to merge",
      });
    }

    // Validate every item up-front: valid product + stock.
    for (const item of items) {
      const quantity = Number(item.quantity) || 1;
      const product = await Product.findById(item.productId);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
      if (product.stock < quantity) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficient stock" });
      }
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    for (const item of items) {
      const quantity = Number(item.quantity) || 1;
      const existingItem = cart.items.find(
        (i) => i.product.toString() === item.productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ product: item.productId, quantity });
      }
    }
    await cart.save();

    const mergedCart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    res.status(200).json({ success: true, cart: mergedCart });
  } catch (err) {
    next(err);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );
    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    res.status(200).json({ success: true, cart: updatedCart });
  } catch (err) {
    next(err);
  }
};

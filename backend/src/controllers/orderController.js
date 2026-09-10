const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const REQUIRED_ADDRESS_FIELDS = ["street", "city", "state", "zipCode", "country"];

exports.createOrder = async (req, res, next) => {
  try {
    const { shippingAddress } = req.body;

    if (
      !shippingAddress ||
      typeof shippingAddress !== "object" ||
      REQUIRED_ADDRESS_FIELDS.some(
        (field) => !shippingAddress[field] || !String(shippingAddress[field]).trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a complete shipping address",
      });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Cart is empty" });
    }

    for (const item of cart.items) {
      if (!item.product || item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product?.name || "item"}`,
        });
      }
    }

    const orderItems = cart.items.map((item) => {
      const coverImage =
        item.product.images && item.product.images[0]
          ? item.product.images[0]
          : item.product.image;
      return {
        product: item.product._id,
        name: item.product.name,
        price: item.product.discountPrice && item.product.discountPrice < item.product.price
          ? item.product.discountPrice
          : item.product.price,
        quantity: item.quantity,
        image: coverImage,
      };
    });

    const totalAmount = orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Atomically decrement stock. Each update only succeeds if enough stock
    // remains, which closes the check-then-decrement race window.
    const decremented = [];
    for (const item of cart.items) {
      const result = await Product.updateOne(
        { _id: item.product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
      if (result.modifiedCount !== 1) {
        throw Object.assign(new Error(`Insufficient stock for ${item.product.name}`), {
          statusCode: 400,
          decremented,
        });
      }
      decremented.push({ _id: item.product._id, quantity: item.quantity });
    }

    try {
      const order = await Order.create({
        user: req.user.id,
        items: orderItems,
        totalAmount,
        shippingAddress,
        status: "placed",
      });

      cart.items = [];
      await cart.save();

      res.status(201).json({ success: true, order });
    } catch (err) {
      // Roll back stock decrements so a failed order does not leak inventory.
      await Product.bulkWrite(
        decremented.map(({ _id, quantity }) => ({
          updateOne: {
            filter: { _id },
            update: { $inc: { stock: quantity } },
          },
        }))
      );
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (err) {
    next(err);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};
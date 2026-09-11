const User = require("../models/User");

exports.getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("addresses");
    res.status(200).json({ success: true, addresses: user.addresses || [] });
  } catch (err) {
    next(err);
  }
};

exports.addAddress = async (req, res, next) => {
  try {
    const { label, street, city, state, zipCode, country } = req.body;
    if (!street || !city || !state || !zipCode) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide all address fields" });
    }

    const user = await User.findById(req.user.id);
    const addr = {
      label: label || "Home",
      street,
      city,
      state,
      zipCode,
      country: country || "India",
      isDefault: user.addresses.length === 0,
    };
    user.addresses.push(addr);
    await user.save({ validateBeforeSave: false });

    const saved = user.addresses[user.addresses.length - 1];
    res.status(201).json({ success: true, address: saved, addresses: user.addresses });
  } catch (err) {
    next(err);
  }
};

exports.setDefault = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses.forEach((a) => {
      a.isDefault = String(a._id) === req.params.id;
    });
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, addresses: user.addresses });
  } catch (err) {
    next(err);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const idx = user.addresses.findIndex((a) => String(a._id) === req.params.id);
    if (idx === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }
    const wasDefault = user.addresses[idx].isDefault;
    user.addresses.splice(idx, 1);
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, addresses: user.addresses });
  } catch (err) {
    next(err);
  }
};

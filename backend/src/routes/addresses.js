const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getAddresses,
  addAddress,
  setDefault,
  deleteAddress,
} = require("../controllers/addressController");

const router = express.Router();

router.use(protect);

router.get("/", getAddresses);
router.post("/", addAddress);
router.put("/:id/default", setDefault);
router.delete("/:id", deleteAddress);

module.exports = router;

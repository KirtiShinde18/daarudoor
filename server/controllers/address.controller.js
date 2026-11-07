const Address = require("../models/Address");

exports.addAddress = async (req, res) => {
  try {
    const { fullName, mobile, houseNo, building, area, landmark, city, state, pincode, addressType, isDefault, latitude, longitude } = req.body;

    if (!fullName || !mobile || !houseNo || !area || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const userId = req.user;

    // Check if this is the first address
    const addressCount = await Address.countDocuments({ user: userId });
    const shouldBeDefault = isDefault || addressCount === 0;

    if (shouldBeDefault) {
      await Address.updateMany({ user: userId }, { isDefault: false });
    }

    const newAddress = await Address.create({
      user: userId,
      fullName,
      mobile,
      houseNo,
      building,
      area,
      landmark,
      city,
      state,
      pincode,
      addressType: addressType || "Home",
      isDefault: shouldBeDefault,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
    });

    res.status(201).json({ success: true, message: "Address added successfully", address: newAddress });
  } catch (error) {
    console.error("Add address error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getMyAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ success: true, addresses });
  } catch (error) {
    console.error("Get addresses error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, mobile, houseNo, building, area, landmark, city, state, pincode, addressType, isDefault, latitude, longitude } = req.body;

    let address = await Address.findById(id);

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    if (address.user.toString() !== req.user.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (isDefault && !address.isDefault) {
      await Address.updateMany({ user: req.user }, { isDefault: false });
    }

    const updateFields = {
      fullName,
      mobile,
      houseNo,
      building,
      area,
      landmark,
      city,
      state,
      pincode,
      addressType,
      isDefault: isDefault !== undefined ? isDefault : address.isDefault,
    };
    if (latitude !== undefined) updateFields.latitude = Number(latitude);
    if (longitude !== undefined) updateFields.longitude = Number(longitude);

    address = await Address.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: "Address updated successfully", address });
  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findById(id);

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    if (address.user.toString() !== req.user.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const wasDefault = address.isDefault;

    await Address.findByIdAndDelete(id);

    if (wasDefault) {
      const remainingAddress = await Address.findOne({ user: req.user });
      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await remainingAddress.save();
      }
    }

    res.status(200).json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findById(id);

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    if (address.user.toString() !== req.user.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await Address.updateMany({ user: req.user }, { isDefault: false });
    
    address.isDefault = true;
    await address.save();

    res.status(200).json({ success: true, message: "Default address updated", address });
  } catch (error) {
    console.error("Set default address error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

import User from '../../models/User.js';
import Address from '../models/Address.js';
import bcrypt from 'bcryptjs';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('addresses defaultAddressId');

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, profilePicture } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, phone, profilePicture },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId).select('+password');

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addAddress = async (req, res) => {
  try {
    const { fullName, phone, addressLine1, addressLine2, city, state, zipCode, addressType } =
      req.body;

    const address = new Address({
      userId: req.user.userId,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      addressType,
    });

    await address.save();

    // Add to user's addresses
    await User.findByIdAndUpdate(req.user.userId, { $push: { addresses: address._id } });

    res.status(201).json({ success: true, message: 'Address added', address });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.userId });

    res.status(200).json({ success: true, addresses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { fullName, phone, addressLine1, addressLine2, city, state, zipCode, addressType } =
      req.body;

    const address = await Address.findByIdAndUpdate(
      addressId,
      { fullName, phone, addressLine1, addressLine2, city, state, zipCode, addressType },
      { new: true, runValidators: true }
    );

    if (!address || address.userId.toString() !== req.user.userId) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.status(200).json({ success: true, message: 'Address updated', address });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const address = await Address.findById(addressId);
    if (!address || address.userId.toString() !== req.user.userId) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await Address.findByIdAndDelete(addressId);
    await User.findByIdAndUpdate(req.user.userId, { $pull: { addresses: addressId } });

    res.status(200).json({ success: true, message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const address = await Address.findById(addressId);
    if (!address || address.userId.toString() !== req.user.userId) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await User.findByIdAndUpdate(req.user.userId, { defaultAddressId: addressId });

    res.status(200).json({ success: true, message: 'Default address set' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

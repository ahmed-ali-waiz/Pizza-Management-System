import Cart from '../../models/Cart.js';
import Coupon from '../models/Coupon.js';

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId }).populate('items.menuId');

    if (!cart) {
      const newCart = new Cart({ userId: req.user.userId, items: [] });
      await newCart.save();
      return res.status(200).json({ success: true, cart: newCart });
    }

    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { menuId, quantity, size, customizations, price, name } = req.body;

    let cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      cart = new Cart({ userId: req.user.userId, items: [] });
    }

    // Check if item already exists
    const existingItem = cart.items.find(
      (item) => item.menuId.toString() === menuId && item.size === size
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.totalPrice = existingItem.quantity * price;
    } else {
      cart.items.push({
        menuId,
        name,
        price,
        quantity,
        size,
        customizations: customizations || [],
        totalPrice: quantity * price,
      });
    }

    await cart.calculateTotals();
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    item.quantity = quantity;
    item.totalPrice = item.quantity * item.price;

    await cart.calculateTotals();
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

    await cart.calculateTotals();
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = [];
    await cart.calculateTotals();

    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Find coupon
    const coupon = await Coupon.findOne({ code: couponCode, isActive: true });

    if (!coupon || new Date() > coupon.expiryDate) {
      return res.status(400).json({ error: 'Invalid or expired coupon' });
    }

    if (cart.subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        error: `Minimum order amount of ${coupon.minOrderAmount} required`,
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (cart.subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    cart.couponCode = couponCode;
    cart.discountAmount = discount;
    await cart.calculateTotals();

    res.status(200).json({ success: true, cart, discount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

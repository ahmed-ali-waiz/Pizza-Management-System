import Order from '../../models/Order.js';
import Cart from '../../models/Cart.js';
import User from '../../models/User.js';

export const createOrder = async (req, res) => {
  try {
    const { deliveryAddressId, paymentMethod, specialInstructions } = req.body;

    // Get cart
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Get user address
    const user = await User.findById(req.user.userId).populate('addresses');
    const address = user.addresses.find((addr) => addr._id.toString() === deliveryAddressId);

    if (!address) {
      return res.status(400).json({ error: 'Invalid delivery address' });
    }

    // Create order
    const order = new Order({
      userId: req.user.userId,
      items: cart.items,
      deliveryAddress: {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        latitude: address.latitude,
        longitude: address.longitude,
      },
      paymentMethod,
      subtotal: cart.subtotal,
      tax: cart.tax,
      deliveryCharges: cart.deliveryCharges,
      discountAmount: cart.discountAmount,
      couponCode: cart.couponCode,
      totalAmount: cart.total,
      specialInstructions,
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60000), // 45 minutes
    });

    await order.save();

    // Clear cart
    cart.items = [];
    await cart.calculateTotals();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { userId: req.user.userId };
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .populate('riderAssigned')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('userId', 'name email phone')
      .populate('riderAssigned', 'name phone vehicle');

    if (!order || order.userId.toString() !== req.user.userId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);

    if (!order || order.userId.toString() !== req.user.userId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!['pending', 'preparing'].includes(order.orderStatus)) {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }

    order.orderStatus = 'cancelled';
    order.cancelReason = reason;
    order.cancelledAt = new Date();
    await order.save();

    res.status(200).json({ success: true, message: 'Order cancelled', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, review } = req.body;

    const order = await Order.findById(orderId);

    if (!order || order.userId.toString() !== req.user.userId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ error: 'Only delivered orders can be rated' });
    }

    order.rating = rating;
    order.review = review;
    await order.save();

    res.status(200).json({ success: true, message: 'Rating submitted', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

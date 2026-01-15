import Order from '../models/Order.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('branch')
    .populate('assignedRider')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('branch')
    .populate('assignedRider')
    .populate('items.menuId');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.json({ success: true, data: order });
});

export const createOrder = asyncHandler(async (req, res) => {
  // Map cartItems to items if provided (for backward compatibility)
  if (req.body.cartItems && (!req.body.items || req.body.items.length === 0)) {
    req.body.items = req.body.cartItems.map(item => ({
      menuId: item.menuItem,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      customizations: item.addons ? item.addons.map(a => ({ name: a.name, value: 'Standard', additionalPrice: a.price })) : [],
      totalPrice: item.price * item.quantity // Approximate
    }));
  }

  const order = await Order.create(req.body);
  const populatedOrder = await Order.findById(order._id)
    .populate('branch')
    .populate('assignedRider');
  res.status(201).json({ success: true, data: populatedOrder });
});

export const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('branch')
    .populate('assignedRider');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.json({ success: true, data: order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { orderStatus: status },
    { new: true, runValidators: true }
  )
    .populate('branch')
    .populate('assignedRider');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.json({ success: true, data: order });
});

export const assignRider = asyncHandler(async (req, res) => {
  const { riderId } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { assignedRider: riderId, orderStatus: 'OutForDelivery' },
    { new: true, runValidators: true }
  )
    .populate('branch')
    .populate('assignedRider');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.json({ success: true, data: order });
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  await order.deleteOne();
  res.json({ success: true, data: {} });
});















